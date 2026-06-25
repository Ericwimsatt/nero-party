import type { Meta, StoryObj } from '@storybook/react';
import { UserProfiles } from './UserProfiles';

const meta: Meta<typeof UserProfiles> = {
  title: 'Components/UserProfiles',
  component: UserProfiles,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: '#ffffff' },
        { name: 'light-grey', value: '#f3f4f6' },
        { name: 'dark', value: '#1e1e2e' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserProfiles>;

/** Initials only — no avatars loaded. First user is the current user (green ring). */
export const InitialsOnly: Story = {
  args: {
    users: [
      { id: '1', name: 'Alice Johnson', isHighlighted: true },
      { id: '2', name: 'Bob Smith' },
      { id: '3', name: 'Carol White' },
      { id: '4', name: 'David Brown' },
    ],
  },
};

/** Mix of real avatar images and initials-only fallbacks. */
export const WithAvatars: Story = {
  args: {
    users: [
      {
        id: '1',
        name: 'Geoff Miller',
        avatar: 'https://api.dicebear.com/10.x/toon-head/svg?seed=Geoff',
        isHighlighted: true,
      },
      {
        id: '2',
        name: 'Eric Smith',
        avatar: 'https://api.dicebear.com/10.x/toon-head/svg?seed=Eriq',
      },
      { id: '3', name: 'Carol White' },
      {
        id: '4',
        name: 'Suzie Brown',
        avatar: 'https://api.dicebear.com/10.x/big-smile/svg?seed=Suzie',
      },
    ],
  },
};

/** Current user highlighted in the middle of the list. */
export const CurrentUserInMiddle: Story = {
  args: {
    users: [
      { id: '1', name: 'Alice Johnson' },
      { id: '2', name: 'Bob Smith', isHighlighted: true },
      { id: '3', name: 'Carol White' },
      { id: '4', name: 'David Brown' },
      { id: '5', name: 'Eve Adams' },
    ],
  },
};

/** Larger avatar size. */
export const Large: Story = {
  args: {
    width: 64,
    height: 64,
    overlap: 20,
    users: [
      { id: '1', name: 'Alice Johnson', isHighlighted: true },
      { id: '2', name: 'Bob Smith' },
      { id: '3', name: 'Carol White' },
    ],
  },
};

/** Single user — the current user. */
export const SingleCurrentUser: Story = {
  args: {
    users: [{ id: '1', name: 'Alice Johnson', isHighlighted: true }],
  },
};

/** No current user highlighted. */
export const NoCurrentUser: Story = {
  args: {
    users: [
      { id: '1', name: 'Alice Johnson' },
      { id: '2', name: 'Bob Smith' },
      { id: '3', name: 'Carol White' },
    ],
  },
};

/** Overflow: active user is among the hidden avatars — +n bubble gets the green ring. */
export const OverflowActiveUserHidden: Story = {
  args: {
    maxWidth: 160,
    users: [
      { id: '1', name: 'Alice Johnson' },
      { id: '2', name: 'Bob Smith' },
      { id: '3', name: 'Carol White' },
      { id: '4', name: 'David Brown', isHighlighted: true },
      { id: '5', name: 'Eve Adams' },
      { id: '6', name: 'Frank Castle' },
    ],
  },
};

/** Overflow: active user is visible, hidden users are not highlighted. */
export const OverflowActiveUserVisible: Story = {
  args: {
    maxWidth: 160,
    users: [
      { id: '1', name: 'Alice Johnson', isHighlighted: true },
      { id: '2', name: 'Bob Smith' },
      { id: '3', name: 'Carol White' },
      { id: '4', name: 'David Brown' },
      { id: '5', name: 'Eve Adams' },
      { id: '6', name: 'Frank Castle' },
    ],
  },
};

/** Overflow: more than 3 hidden — tooltip shows first 2 names + "and N others". */
export const OverflowManyHidden: Story = {
  args: {
    maxWidth: 120,
    users: [
      { id: '1', name: 'Alice Johnson', isHighlighted: true },
      { id: '2', name: 'Bob Smith' },
      { id: '3', name: 'Carol White' },
      { id: '4', name: 'David Brown' },
      { id: '5', name: 'Eve Adams' },
      { id: '6', name: 'Frank Castle' },
      { id: '7', name: 'Grace Hopper' },
    ],
  },
};
