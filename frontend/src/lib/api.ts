import type { Party, QueueItem, SearchResult, User, Award } from "./types";

const BASE = "http://localhost:3000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Users
  createUser: (username: string) =>
    req<User>("/users", { method: "POST", body: JSON.stringify({ username }) }),

  // Parties
  listParties: () => req<Party[]>("/parties"),
  createParty: (name: string, durationMinutes: number, hostId: string) =>
    req<Party>("/parties", {
      method: "POST",
      body: JSON.stringify({ name, durationMinutes, hostId }),
    }),
  getParty: (id: string) => req<Party>(`/parties/${id}`),
  joinParty: (partyId: string, userId: string) =>
    req<Party>(`/parties/${partyId}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  toggleVote: (partyId: string, queueItemId: string, userId: string) =>
    req<{ voted: boolean; queue: QueueItem[] }>(`/parties/${partyId}/queue/${queueItemId}/vote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  addToQueue: (
    partyId: string,
    song: SearchResult,
    addedById: string
  ) =>
    req<QueueItem>(`/parties/${partyId}/queue`, {
      method: "POST",
      body: JSON.stringify({ ...song, addedById }),
    }),
  submitRatings: (
    partyId: string,
    userId: string,
    ratings: Record<string, { value: number; timestamps: Array<{ timestamp: number; rating: number }> }>
  ) =>
    req<{ ok: boolean }>(`/parties/${partyId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ userId, ratings }),
    }),
  updateTime: (partyId: string, endsAt: string) =>
    req<Party>(`/parties/${partyId}/time`, {
      method: "PATCH",
      body: JSON.stringify({ endsAt }),
    }),
  getAwards: (partyId: string) => req<{ awards: Award[] }>(`/parties/${partyId}/awards`),

  // Songs
  searchSongs: (q: string) => req<SearchResult[]>(`/songs/search?q=${encodeURIComponent(q)}&limit=10`),
};
