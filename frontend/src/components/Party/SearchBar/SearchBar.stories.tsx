import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { SearchBar } from './SearchBar';

const BASE = 'http://localhost:3000';

const meta: Meta<typeof SearchBar> = {
  title: 'Party/SearchBar',
  component: SearchBar,
  parameters: {
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1f2937' }] },
    msw: {
      handlers: [
        http.get(`${BASE}/songs/search`, () => HttpResponse.json(mockResults)),
        http.post(`${BASE}/parties/:id/queue`, () => HttpResponse.json({})),
      ],
    },
  },
  args: {
    partyId: 'party-1',
    onAddSong: async (song) => { console.log('Add song', song); },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {};
