import type { Meta, StoryObj } from '@storybook/react';
import { SongPlayer } from './SongPlayer';

const mockSong = {
  id: 'qi-1',
  partyId: 'party-1',
  jamendoId: 'j-1',
  name: 'Electric Dreams',
  artist: 'Synthwave Runner',
  albumImage: 'https://placehold.co/100x100/8b5cf6/fff?text=♪',
  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  addedById: 'user-1',
  addedAt: new Date().toISOString(),
  playedAt: null,
  votes: [],
};

const meta: Meta<typeof SongPlayer> = {
  title: 'Party/SongPlayer',
  component: SongPlayer,
  parameters: {
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1f2937' }] },
    layout: 'padded',
  },
  args: {
    isHost: true,
    externalPlayback: null,
    currentRating: 3,
    onPlaybackControl: (action, pos) => console.log('Playback', action, pos),
    onRatingChange: (songId, val) => console.log('Rating', songId, val),
    onSongEnded: () => console.log('Song ended'),
  },
};

export default meta;
type Story = StoryObj<typeof SongPlayer>;

export const HostWithSong: Story = {
  args: { currentSong: mockSong, isHost: true },
};

export const GuestWithSong: Story = {
  args: {
    currentSong: mockSong,
    isHost: false,
    externalPlayback: { action: 'play', position: 30, currentSongId: 'qi-1' },
  },
};

export const NoSong: Story = {
  args: { currentSong: null, isHost: true },
};

export const GuestNoSong: Story = {
  args: { currentSong: null, isHost: false },
};
