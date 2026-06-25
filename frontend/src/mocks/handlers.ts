import { http, HttpResponse } from "msw";
import type { Party, User, QueueItem, SearchResult } from "../lib/types";

const BASE = "http://localhost:3000";

const mockUser: User = { id: "user-1", username: "alice" };
const mockUser2: User = { id: "user-2", username: "bob" };
const mockUser3: User = { id: "user-3", username: "carol" };

const mockQueue: QueueItem[] = [
  {
    id: "qi-1",
    partyId: "party-1",
    jamendoId: "j-1",
    name: "Summer Vibes",
    artist: "ChillBeats",
    albumImage: "https://placehold.co/100x100/6366f1/fff?text=♪",
    audioUrl: "",
    addedById: "user-1",
    addedAt: new Date(Date.now() - 60000).toISOString(),
    playedAt: null,
    votes: [
      { userId: "user-1", queueItemId: "qi-1", user: { id: "user-1", username: "alice" } },
      { userId: "user-2", queueItemId: "qi-1", user: { id: "user-2", username: "bob" } },
    ],
  },
  {
    id: "qi-2",
    partyId: "party-1",
    jamendoId: "j-2",
    name: "Night Drive",
    artist: "LoFi Studio",
    albumImage: "https://placehold.co/100x100/10b981/fff?text=♪",
    audioUrl: "",
    addedById: "user-2",
    addedAt: new Date(Date.now() - 30000).toISOString(),
    playedAt: null,
    votes: [
      { userId: "user-3", queueItemId: "qi-2", user: { id: "user-3", username: "carol" } },
    ],
  },
  {
    id: "qi-3",
    partyId: "party-1",
    jamendoId: "j-3",
    name: "Midnight Jazz",
    artist: "Blue Note Trio",
    albumImage: "https://placehold.co/100x100/f59e0b/fff?text=♪",
    audioUrl: "",
    addedById: "user-3",
    addedAt: new Date(Date.now() - 10000).toISOString(),
    playedAt: null,
    votes: [],
  },
];

export const mockParty: Party = {
  id: "party-1",
  name: "Friday Night Jams",
  hostId: "user-1",
  host: { id: "user-1", username: "alice" },
  endsAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  _count: { members: 3 },
  members: [
    { user: mockUser },
    { user: mockUser2 },
    { user: mockUser3 },
  ],
  queue: mockQueue,
};

const mockSearchResults: SearchResult[] = [
  {
    jamendoId: "j-100",
    name: "Electric Dreams",
    artist: "Synthwave Runner",
    albumImage: "https://placehold.co/100x100/8b5cf6/fff?text=♪",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 210,
  },
  {
    jamendoId: "j-101",
    name: "Ocean Waves",
    artist: "Nature Sounds",
    albumImage: "https://placehold.co/100x100/0ea5e9/fff?text=♪",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 180,
  },
  {
    jamendoId: "j-102",
    name: "City Lights",
    artist: "Urban Groove",
    albumImage: "https://placehold.co/100x100/ef4444/fff?text=♪",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 240,
  },
];

export const handlers = [
  // Users
  http.post(`${BASE}/users`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Parties list
  http.get(`${BASE}/parties`, () => {
    return HttpResponse.json([mockParty]);
  }),

  // Create party
  http.post(`${BASE}/parties`, () => {
    return HttpResponse.json(mockParty);
  }),

  // Get party
  http.get(`${BASE}/parties/:id`, () => {
    return HttpResponse.json(mockParty);
  }),

  // Join party
  http.post(`${BASE}/parties/:id/join`, () => {
    return HttpResponse.json(mockParty);
  }),

  // Add to queue
  http.post(`${BASE}/parties/:id/queue`, () => {
    return HttpResponse.json(mockQueue[0]);
  }),

  // Vote
  http.post(`${BASE}/parties/:id/queue/:itemId/vote`, () => {
    return HttpResponse.json({ voted: true, queue: mockQueue });
  }),

  // Ratings
  http.post(`${BASE}/parties/:id/ratings`, () => {
    return HttpResponse.json({ ok: true });
  }),

  // Update time
  http.patch(`${BASE}/parties/:id/time`, () => {
    return HttpResponse.json(mockParty);
  }),

  // Awards
  http.get(`${BASE}/parties/:id/awards`, () => {
    return HttpResponse.json({
      awards: [
        { title: "Crowd Favorite", song: { ...mockQueue[0], avgRating: 4.2, voteCount: 2 }, detail: "2 votes" },
        { title: "Top Rated", song: { ...mockQueue[1], avgRating: 4.8, voteCount: 1 }, detail: "4.80/5" },
      ],
    });
  }),

  // Song search
  http.get(`${BASE}/songs/search`, () => {
    return HttpResponse.json(mockSearchResults);
  }),
];
