import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export function joinParty(partyId: string, userId: string) {
  socket.connect();
  socket.emit("join-party", { partyId, userId });
}

export function leaveParty(partyId: string) {
  socket.emit("leave-party", { partyId });
  socket.disconnect();
}

export function emitVote(partyId: string, queueItemId: string, userId: string) {
  socket.emit("vote", { partyId, queueItemId, userId });
}

export function emitPlaybackControl(
  partyId: string,
  action: "play" | "pause" | "seek",
  position: number,
  currentSongId: string | null
) {
  socket.emit("playback-control", { partyId, action, position, currentSongId });
}

export function emitSongPlayed(partyId: string, queueItemId: string) {
  socket.emit("song-played", { partyId, queueItemId });
}

export function emitSubmitRatings(
  partyId: string,
  userId: string,
  ratings: Record<string, { value: number; timestamps: Array<{ timestamp: number; rating: number }> }>
) {
  socket.emit("submit-ratings", { partyId, userId, ratings });
}

export function emitUpdateTime(partyId: string, endsAt: string) {
  socket.emit("update-time", { partyId, endsAt });
}

export function emitSongAdded(partyId: string) {
  socket.emit("song-added", { partyId });
}

export function emitSetCurrentSong(partyId: string, songId: string | null) {
  socket.emit("set-current-song", { partyId, songId });
}
