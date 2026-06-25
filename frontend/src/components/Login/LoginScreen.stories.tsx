import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginScreen } from './LoginScreen';
import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3000';

const meta: Meta<typeof LoginScreen> = {
  title: 'Screens/LoginScreen',
  component: LoginScreen,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Story />} />
          <Route path="/lobby" element={<div className="p-8 text-white bg-gray-900 min-h-screen">Lobby (navigated)</div>} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#111827' }] },
    msw: {
      handlers: [
        http.post(`${BASE}/users`, () =>
          HttpResponse.json({ id: 'user-1', username: 'alice' }),
        ),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoginScreen>;

export const Default: Story = {};
