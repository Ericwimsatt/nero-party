import type { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from './ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#3a3a5c' },
        { name: 'mid', value: '#5c5c80' },
        { name: 'light', value: '#e8e8f0' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

/** Default unpressed state — button appears raised with shadow toward bottom-left. */
export const Raised: Story = {
  args: { unpressedLabel: 'Toggle', defaultPressed: false },
};

/** Button rendered in the pressed / sunken state at load. */
export const Sunken: Story = {
  args: { unpressedLabel: 'Toggle', defaultPressed: true },
};

/** Different labels for each state. */
export const DualLabel: Story = {
  args: { unpressedLabel: '▶ Play', pressedLabel: '⏸ Pause', defaultPressed: false },
};

/** Custom label example. */
export const DarkMode: Story = {
  args: { unpressedLabel: '🌙 Dark Mode', defaultPressed: false },
};

/** Mute toggle example. */
export const Mute: Story = {
  args: { unpressedLabel: '🔈 Unmuted', pressedLabel: '🔇 Muted', defaultPressed: false },
};

/** Custom button and shadow colors — swap on press. */
export const Colorful: Story = {
  args: { unpressedLabel: 'Colorful', defaultPressed: false, buttonColor: '#4f8ef7', shadowColor: '#f7a24f' },
};

/** High contrast colors. */
export const HighContrast: Story = {
  args: { unpressedLabel: 'Contrast', defaultPressed: false, buttonColor: '#e8e8f0', shadowColor: '#1a1a2e' },
};

/** Custom text colors for unpressed and pressed states. */
export const CustomTextColors: Story = {
  args: {
    unpressedLabel: 'Off',
    pressedLabel: 'On',
    defaultPressed: false,
    buttonColor: '#2d2d2d',
    shadowColor: '#000000',
    unpressedTextColor: '#ff9900',
    pressedTextColor: '#00ccff',
  },
};

/** Pressed state showing the pressedTextColor. */
export const CustomTextColorsPressed: Story = {
  args: {
    unpressedLabel: 'Off',
    pressedLabel: 'On',
    defaultPressed: true,
    buttonColor: '#2d2d2d',
    shadowColor: '#000000',
    unpressedTextColor: '#ff9900',
    pressedTextColor: '#00ccff',
  },
};
