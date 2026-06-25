import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AwardsScreen } from './AwardsScreen';
import type { Award } from '../../lib/types';

const mockBase = {
  partyId: 'party-1',
  addedById: 'user-1',
  addedAt: new Date().toISOString(),
  playedAt: null,
  votes: [{ userId: 'user-1', queueItemId: 'qi-1', user: { id: 'user-1', username: 'alice' } }],
  bangerScore: 3.5,
  hypeCount: 5,
  sleeperScore: 0.7,
};

const mockAwards: Award[] = [
  {
    title: 'Biggest Banger',
    song: {
      ...mockBase,
      id: 'qi-1',
      jamendoId: 'j-1',
      name: 'Summer Vibes',
      artist: 'ChillBeats',
      albumImage: 'https://placehold.co/100x100/f97316/fff?text=🔥',
      audioUrl: '',
      duration: 210,
    },
    detail: 'Banger score: 3.50',
  },
  {
    title: 'Most Hyped',
    song: {
      ...mockBase,
      id: 'qi-2',
      jamendoId: 'j-2',
      name: 'Night Drive',
      artist: 'LoFi Studio',
      albumImage: 'https://placehold.co/100x100/a855f7/fff?text=🙌',
      audioUrl: '',
      duration: 180,
      hypeCount: 8,
      sleeperScore: 0.44,
    },
    detail: '8 requests',
  },
  {
    title: 'Sleeper Hit',
    song: {
      ...mockBase,
      id: 'qi-3',
      jamendoId: 'j-3',
      name: 'Midnight Jazz',
      artist: 'Blue Note Trio',
      albumImage: 'https://placehold.co/100x100/3b82f6/fff?text=💤',
      audioUrl: '',
      duration: 240,
      hypeCount: 1,
      bangerScore: 4.1,
      sleeperScore: 4.1,
    },
    detail: 'Score: 4.10',
  },
];

function withRouterState(awards: Award[], partyName?: string) {
  return (Story: React.ComponentType) => (
    <MemoryRouter
      initialEntries={[{ pathname: '/results', state: { awards, partyName } }]}
    >
      <Routes>
        <Route path="/results" element={<Story />} />
        <Route path="/lobby" element={<div className="p-8 text-white">Lobby</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const meta: Meta<typeof AwardsScreen> = {
  title: 'Screens/AwardsScreen',
  component: AwardsScreen,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#111827' }] },
  },
};

export default meta;
type Story = StoryObj<typeof AwardsScreen>;

export const WithAwards: Story = {
  decorators: [withRouterState(mockAwards, 'Friday Night Jams')],
};

export const NoSongs: Story = {
  decorators: [withRouterState([], 'Friday Night Jams')],
};
