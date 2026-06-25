import type { Meta, StoryObj } from '@storybook/react';
import { SongQueue } from './SongQueue';

const members = [
  { id: 'user-1', username: 'alice' },
  { id: 'user-2', username: 'bob' },
  { id: 'user-3', username: 'carol' },
];

const baseQueue = [
  {
    id: 'qi-1',
    partyId: 'party-1',
    jamendoId: 'j-1',
    name: 'Summer Vibes',
    artist: 'ChillBeats',
    albumImage: 'https://placehold.co/100x100/6366f1/fff?text=♪',
    audioUrl: '',
    addedById: 'user-1',
    addedAt: new Date().toISOString(),
    playedAt: null,
    votes: [
      { userId: 'user-1', queueItemId: 'qi-1', user: { id: 'user-1', username: 'alice' } },
      { userId: 'user-2', queueItemId: 'qi-1', user: { id: 'user-2', username: 'bob' } },
    ],
  },
  {
    id: 'qi-2',
    partyId: 'party-1',
    jamendoId: 'j-2',
    name: 'Night Drive',
    artist: 'LoFi Studio',
    albumImage: 'https://placehold.co/100x100/10b981/fff?text=♪',
    audioUrl: '',
    addedById: 'user-2',
    addedAt: new Date().toISOString(),
    playedAt: null,
    votes: [
      { userId: 'user-3', queueItemId: 'qi-2', user: { id: 'user-3', username: 'carol' } },
    ],
  },
  {
    id: 'qi-3',
    partyId: 'party-1',
    jamendoId: 'j-3',
    name: 'Midnight Jazz',
    artist: 'Blue Note Trio',
    albumImage: 'https://placehold.co/100x100/f59e0b/fff?text=♪',
    audioUrl: '',
    addedById: 'user-3',
    addedAt: new Date().toISOString(),
    playedAt: null,
    votes: [],
  },
];

const meta: Meta<typeof SongQueue> = {
  title: 'Party/SongQueue',
  component: SongQueue,
  parameters: {
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1f2937' }] },
    layout: 'padded',
  },
  args: {
    currentSongId: 'qi-1',
    currentUserId: 'user-1',
    members,
    isHost: false,
    onVote: (id) => console.log('Vote', id),
  },
};

export default meta;
type Story = StoryObj<typeof SongQueue>;

export const Default: Story = {
  args: { queue: baseQueue },
};

export const HostView: Story = {
  args: {
    queue: baseQueue,
    isHost: true,
    onSelectSong: (id) => console.log('Select song', id),
  },
};

export const WithPlayedSongs: Story = {
  args: {
    queue: [
      { ...baseQueue[0], playedAt: new Date(Date.now() - 120000).toISOString() },
      baseQueue[1],
      baseQueue[2],
    ],
    currentSongId: 'qi-2',
  },
};

export const EmptyQueue: Story = {
  args: { queue: [], currentSongId: null },
};
