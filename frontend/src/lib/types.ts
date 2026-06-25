export interface User {
  id: string;
  username: string;
  createdAt?: string;
}

export interface Party {
  id: string;
  name: string;
  endsAt: string;
  hostId: string;
  currentSongId?: string | null;
  host: Pick<User, "id" | "username">;
  createdAt?: string;
  _count?: { members: number };
  members?: Array<{ user: Pick<User, "id" | "username"> }>;
  queue?: QueueItem[];
}

export interface Vote {
  userId: string;
  queueItemId: string;
  user: Pick<User, "id" | "username">;
}

export interface QueueItem {
  id: string;
  partyId: string;
  jamendoId: string;
  name: string;
  artist: string;
  albumImage?: string;
  audioUrl: string;
  duration?: number | null;
  addedById: string;
  addedAt: string;
  playedAt?: string | null;
  votes: Vote[];
  ratings?: Array<{ value: number; userId: string }>;
}

export interface Award {
  title: string;
  song: QueueItem & { bangerScore: number; hypeCount: number; sleeperScore: number };
  detail: string;
}

export interface SearchResult {
  jamendoId: string;
  name: string;
  artist: string;
  albumImage?: string;
  audioUrl: string;
  duration?: number;
}

export type Screen = "lobby" | "party" | "results";

export interface PlaybackState {
  action: "play" | "pause" | "seek";
  position: number;
  currentSongId: string | null;
}
