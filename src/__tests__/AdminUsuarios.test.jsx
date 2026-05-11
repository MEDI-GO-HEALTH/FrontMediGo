import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GestionUsuarios from '../pages/admin/GestionUsuarios';
import { MemoryRouter } from 'react-router';

// The app has a router itself, we render it directly
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('GestionUsuarios', () => {
  it('renders correctly', async () => {
    let container;
    await act(async () => {
      const res = render(
        <MemoryRouter>
          <GestionUsuarios />
        </MemoryRouter>
      );
      container = res.container;
    });
    expect(screen.getByText('Gestion de Usuarios')).toBeInTheDocument();
  });
});
