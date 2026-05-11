import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  }
}));

describe('Pages Simple 6', () => {
  it('renders login', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><Login /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders Register', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><Register /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });
});
