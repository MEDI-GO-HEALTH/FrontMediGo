import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import PerfilRepartidor from '../pages/driver/PerfilRepartidor';
import HistorialViajes from '../pages/driver/HistorialViajes';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('Pages Simple 2', () => {
  it('renders PerfilRepartidor', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><PerfilRepartidor /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Datos del Repartidor')).toBeInTheDocument();
  });

  it('renders HistorialViajes', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><HistorialViajes /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Historial de Actividad')).toBeInTheDocument();
  });
});
