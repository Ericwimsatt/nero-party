import type { Meta, StoryObj } from '@storybook/react';
import { AdminControl } from './AdminControl';

const mockParty = {
  id: 'party-1',
  name: 'Friday Night Jams',
  hostId: 'user-1',
  host: { id: 'user-1', username: 'alice' },
  endsAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
};

const meta: Meta<typeof AdminControl> = {
  title: 'Party/AdminControl',
  component: AdminControl,
  parameters: {
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1f2937' }] },
    layout: 'padded',
  },
  args: {
    party: mockParty,
    onUpdateTime: (endsAt) => console.log('Update time:', endsAt),
  },
};

export default meta;
type Story = StoryObj<typeof AdminControl>;

export const Default: Story = {};
