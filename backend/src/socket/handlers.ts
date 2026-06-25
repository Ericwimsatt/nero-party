import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { getQueueWithVotes, computeAwards } from "../routes/parties.js";

// Track which userId is in which socket
const socketUserMap = new Map<string, string>(); // socketId -> userId

// Track last-known playback state per party so late joiners can sync
interface PartyPlayback {
  action: "play" | "pause" | "seek";
  position: number;
  currentSongId: string | null;
  updatedAt: number; // Date.now() when this was recorded
}
const partyPlaybackState = new Map<string, PartyPlayback>();

export function registerSocketHandlers(io: Server, socket: Socket) {
  // Join a party room
  socket.on("join-party", async ({ partyId, userId }: { partyId: string; userId: string }) => {
    socket.join(partyId);
    socketUserMap.set(socket.id, userId);

    // Ensure membership
    await prisma.userParty.upsert({
      where: { userId_partyId: { userId, partyId } },
      update: {},
      create: { userId, partyId },
    });

    const [members, queue, party] = await Promise.all([
      prisma.userParty.findMany({
        where: { partyId },
        include: { user: { select: { id: true, username: true } } },
      }),
      getQueueWithVotes(partyId),
      prisma.party.findUnique({
        where: { id: partyId },
        include: { host: { select: { id: true, username: true } } },
      }),
    ]);

    // Broadcast updated member list to everyone in the room
    io.to(partyId).emit("members-updated", { members: members.map((m) => m.user) });

    // Send current state to the joining socket so the page populates immediately
    socket.emit("queue-updated", { queue });
    if (party) {
      socket.emit("party-updated", { party });
      socket.emit("current-song-changed", { currentSongId: party.currentSongId ?? null });
    }

    // Sync playback position for late joiners
    const playback = partyPlaybackState.get(partyId);
    if (playback) {
      const elapsedSeconds = (Date.now() - playback.updatedAt) / 1000;
      const adjustedPosition =
        playback.action === "play"
          ? playback.position + elapsedSeconds
          : playback.position;
      socket.emit("playback-state", {
        action: playback.action,
        position: adjustedPosition,
        currentSongId: playback.currentSongId,
      });
    }
  });

  // Leave party room
  socket.on("leave-party", async ({ partyId }: { partyId: string }) => {
    socket.leave(partyId);
    broadcastMembers(io, partyId);
  });

  // Toggle vote on a queue item
  socket.on(
    "vote",
    async ({ partyId, queueItemId, userId }: { partyId: string; queueItemId: string; userId: string }) => {
      const existing = await prisma.vote.findUnique({
        where: { userId_queueItemId: { userId, queueItemId } },
      });
      if (existing) {
        await prisma.vote.delete({ where: { userId_queueItemId: { userId, queueItemId } } });
      } else {
        await prisma.vote.create({ data: { userId, queueItemId } });
      }
      const queue = await getQueueWithVotes(partyId);
      io.to(partyId).emit("queue-updated", { queue });
    }
  );

  // Host broadcasts playback control to all in party
  socket.on(
    "playback-control",
    ({ partyId, action, position, currentSongId }: {
      partyId: string;
      action: "play" | "pause" | "seek";
      position: number;
      currentSongId: string | null;
    }) => {
      // Store state so late joiners can sync
      partyPlaybackState.set(partyId, { action, position, currentSongId, updatedAt: Date.now() });
      socket.to(partyId).emit("playback-state", { action, position, currentSongId });
    }
  );

  // Host marks a song as played and advances
  socket.on(
    "song-played",
    async ({ partyId, queueItemId }: { partyId: string; queueItemId: string }) => {
      await prisma.queueItem.update({
        where: { id: queueItemId },
        data: { playedAt: new Date() },
      });
      const queue = await getQueueWithVotes(partyId);
      io.to(partyId).emit("queue-updated", { queue });
    }
  );

  // Host sets (or clears) the currently playing song — persisted to DB so late joiners can load it
  socket.on(
    "set-current-song",
    async ({ partyId, songId }: { partyId: string; songId: string | null }) => {
      await prisma.party.update({
        where: { id: partyId },
        data: { currentSongId: songId },
      });
      // Broadcast to everyone in the party (including the sender via io.to, not socket.to)
      io.to(partyId).emit("current-song-changed", { currentSongId: songId });
    }
  );

  // Submit rating batch when song changes
  socket.on(
    "submit-ratings",
    async ({
      partyId,
      userId,
      ratings,
    }: {
      partyId: string;
      userId: string;
      ratings: Record<string, { value: number; timestamps: Array<{ timestamp: number; rating: number }> }>;
    }) => {
      for (const [queueItemId, data] of Object.entries(ratings)) {
        await prisma.rating.upsert({
          where: { userId_queueItemId: { userId, queueItemId } },
          update: { value: data.value, timestamps: JSON.stringify(data.timestamps) },
          create: {
            userId,
            queueItemId,
            partyId,
            value: data.value,
            timestamps: JSON.stringify(data.timestamps),
          },
        });
      }
    }
  );

  // Admin updates time remaining
  socket.on(
    "update-time",
    async ({ partyId, endsAt }: { partyId: string; endsAt: string }) => {
      const party = await prisma.party.update({
        where: { id: partyId },
        data: { endsAt: new Date(endsAt) },
        include: { host: { select: { id: true, username: true } } },
      });
      io.to(partyId).emit("party-updated", { party });

      // If set to now or past, end the party
      if (new Date(endsAt) <= new Date()) {
        await endParty(io, partyId);
      }
    }
  );

  // Song added to queue — broadcast update
  socket.on("song-added", async ({ partyId }: { partyId: string }) => {
    const queue = await getQueueWithVotes(partyId);
    io.to(partyId).emit("queue-updated", { queue });
  });

  socket.on("disconnect", async () => {
    socketUserMap.delete(socket.id);
  });
}

async function broadcastMembers(io: Server, partyId: string) {
  const members = await prisma.userParty.findMany({
    where: { partyId },
    include: { user: { select: { id: true, username: true } } },
  });
  io.to(partyId).emit("members-updated", { members: members.map((m) => m.user) });
}

export async function endParty(io: Server, partyId: string) {
  const awards = await computeAwards(partyId);
  io.to(partyId).emit("party-ended", { partyId, awards });
}
