import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import GestionSubastas from '../pages/admin/GestionSubastas';
import CentroSubastas from '../pages/affiliate/CentroSubastas';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  }
}));

describe('Pages Simple 3', () => {
  it('renders GestionSubastas', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><GestionSubastas /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getAllByText('Subastas')[0]).toBeInTheDocument();
  });

  it('renders CentroSubastas', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><CentroSubastas /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Subastas Activas')).toBeInTheDocument();
  });
});
