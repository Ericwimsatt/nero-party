import { Router } from "express";
import { prisma } from "../prisma.js";

export const partiesRouter = Router();

/** Shared helper: fetch party queue sorted by votes desc, then addedAt asc */
export async function getQueueWithVotes(partyId: string) {
  const items = await prisma.queueItem.findMany({
    where: { partyId },
    include: {
      votes: { include: { user: { select: { id: true, username: true } } } },
      ratings: true,
    },
    orderBy: { addedAt: "asc" },
  });
  // Sort: unplayed first (votes desc, addedAt asc), played last
  return items.sort((a, b) => {
    const aPlayed = a.playedAt ? 1 : 0;
    const bPlayed = b.playedAt ? 1 : 0;
    if (aPlayed !== bPlayed) return aPlayed - bPlayed;
    const votesDiff = b.votes.length - a.votes.length;
    if (votesDiff !== 0) return votesDiff;
    return a.addedAt.getTime() - b.addedAt.getTime();
  });
}

// GET /parties — list all parties with time remaining
partiesRouter.get("/", async (_req, res) => {
  const parties = await prisma.party.findMany({
    include: { host: { select: { id: true, username: true } }, _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(parties);
});

// POST /parties — create a new party
partiesRouter.post("/", async (req, res) => {
  const { name, durationMinutes, hostId } = req.body as {
    name: string;
    durationMinutes: number;
    hostId: string;
  };
  if (!name || !durationMinutes || !hostId) {
    res.status(400).json({ error: "name, durationMinutes, hostId required" });
    return;
  }
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const party = await prisma.party.create({
    data: {
      name: name.trim(),
      endsAt,
      hostId,
      members: { create: { userId: hostId } },
    },
    include: { host: { select: { id: true, username: true } }, _count: { select: { members: true } } },
  });
  res.json(party);
});

// GET /parties/:id — full party info
partiesRouter.get("/:id", async (req, res) => {
  const party = await prisma.party.findUnique({
    where: { id: req.params.id },
    include: {
      host: { select: { id: true, username: true } },
      members: { include: { user: { select: { id: true, username: true } } } },
    },
  });
  if (!party) { res.status(404).json({ error: "Party not found" }); return; }
  const queue = await getQueueWithVotes(req.params.id);
  res.json({ ...party, queue });
});

// POST /parties/:id/join — join a party
partiesRouter.post("/:id/join", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  await prisma.userParty.upsert({
    where: { userId_partyId: { userId, partyId: req.params.id } },
    update: {},
    create: { userId, partyId: req.params.id },
  });
  const party = await prisma.party.findUnique({
    where: { id: req.params.id },
    include: {
      host: { select: { id: true, username: true } },
      members: { include: { user: { select: { id: true, username: true } } } },
    },
  });
  const queue = await getQueueWithVotes(req.params.id);
  res.json({ ...party, queue });
});

// PATCH /parties/:id/current-song — host sets the currently playing song
partiesRouter.patch("/:id/current-song", async (req, res) => {
  const { songId } = req.body as { songId: string | null };
  const party = await prisma.party.update({
    where: { id: req.params.id },
    data: { currentSongId: songId ?? null },
    include: { host: { select: { id: true, username: true } } },
  });
  res.json(party);
});

// POST /parties/:id/queue — add a song
partiesRouter.post("/:id/queue", async (req, res) => {
  const { jamendoId, name, artist, albumImage, audioUrl, duration, addedById } = req.body as {
    jamendoId: string;
    name: string;
    artist: string;
    albumImage?: string;
    audioUrl: string;
    duration?: number;
    addedById: string;
  };
  if (!jamendoId || !name || !artist || !audioUrl || !addedById) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  // Check for duplicate in this party
  const existing = await prisma.queueItem.findFirst({
    where: { partyId: req.params.id, jamendoId },
  });
  if (existing) {
    res.status(409).json({ error: "Song already in queue" });
    return;
  }
  const item = await prisma.queueItem.create({
    data: { partyId: req.params.id, jamendoId, name, artist, albumImage, audioUrl, duration, addedById },
    include: { votes: { include: { user: { select: { id: true, username: true } } } } },
  });
  res.json(item);
});

// POST /parties/:id/queue/:itemId/vote — toggle vote
partiesRouter.post("/:id/queue/:itemId/vote", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  const existing = await prisma.vote.findUnique({
    where: { userId_queueItemId: { userId, queueItemId: req.params.itemId } },
  });
  if (existing) {
    await prisma.vote.delete({ where: { userId_queueItemId: { userId, queueItemId: req.params.itemId } } });
  } else {
    await prisma.vote.create({ data: { userId, queueItemId: req.params.itemId } });
  }
  const queue = await getQueueWithVotes(req.params.id);
  res.json({ voted: !existing, queue });
});

// POST /parties/:id/ratings — submit rating batch
partiesRouter.post("/:id/ratings", async (req, res) => {
  const { userId, ratings } = req.body as {
    userId: string;
    ratings: Record<string, { value: number; timestamps: Array<{ timestamp: number; rating: number }> }>;
  };
  if (!userId || !ratings) { res.status(400).json({ error: "userId and ratings required" }); return; }
  for (const [queueItemId, data] of Object.entries(ratings)) {
    await prisma.rating.upsert({
      where: { userId_queueItemId: { userId, queueItemId } },
      update: { value: data.value, timestamps: JSON.stringify(data.timestamps) },
      create: {
        userId,
        queueItemId,
        partyId: req.params.id,
        value: data.value,
        timestamps: JSON.stringify(data.timestamps),
      },
    });
  }
  res.json({ ok: true });
});

// PATCH /parties/:id/time — admin update time remaining
partiesRouter.patch("/:id/time", async (req, res) => {
  const { endsAt } = req.body as { endsAt: string };
  if (!endsAt) { res.status(400).json({ error: "endsAt required" }); return; }
  const party = await prisma.party.update({
    where: { id: req.params.id },
    data: { endsAt: new Date(endsAt) },
    include: { host: { select: { id: true, username: true } } },
  });
  res.json(party);
});

// POST /parties/:id/queue/:itemId/played — mark a song as played
partiesRouter.post("/:id/queue/:itemId/played", async (req, res) => {
  await prisma.queueItem.update({
    where: { id: req.params.itemId },
    data: { playedAt: new Date() },
  });
  const queue = await getQueueWithVotes(req.params.id);
  res.json({ queue });
});

// GET /parties/:id/awards — compute awards
partiesRouter.get("/:id/awards", async (req, res) => {
  const awards = await computeAwards(req.params.id);
  res.json({ awards });
});

export function computeBangerScore(item: { ratings: Array<{ timestamps: string | null }>; duration: number | null }): number {
  let total = 0;
  for (const rating of item.ratings) {
    if (!rating.timestamps) continue;
    const ts = JSON.parse(rating.timestamps) as Array<{ timestamp: number; rating: number }>;
    for (const entry of ts) {
      total += entry.rating;
    }
  }
  const dur = item.duration ?? 1;
  return total / dur;
}

export async function computeAwards(partyId: string) {
  const queue = await getQueueWithVotes(partyId);
  if (queue.length === 0) return [];

  const withScores = queue.map((item) => {
    const bangerScore = computeBangerScore(item);
    const hypeCount = item.votes.length;
    const sleeperScore = hypeCount > 0 ? bangerScore / hypeCount : bangerScore;
    return { ...item, bangerScore, hypeCount, sleeperScore };
  });

  const awards: Array<{ title: string; song: typeof withScores[0]; detail: string }> = [];

  // Biggest Banger: highest banger score
  const biggestBanger = [...withScores].sort((a, b) => b.bangerScore - a.bangerScore)[0];
  awards.push({ title: "Biggest Banger", song: biggestBanger, detail: `Banger score: ${biggestBanger.bangerScore.toFixed(2)}` });

  // Most Hyped: most votes
  const mostHyped = [...withScores].sort((a, b) => b.hypeCount - a.hypeCount)[0];
  awards.push({ title: "Most Hyped", song: mostHyped, detail: `${mostHyped.hypeCount} requests` });

  // Sleeper Hit: highest banger score / hype count
  const sleeperHit = [...withScores].sort((a, b) => b.sleeperScore - a.sleeperScore)[0];
  awards.push({ title: "Sleeper Hit", song: sleeperHit, detail: `Score: ${sleeperHit.sleeperScore.toFixed(2)}` });

  return awards;
}
