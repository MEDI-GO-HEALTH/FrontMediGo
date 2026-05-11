import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import GestionSedes from '../pages/admin/GestionSedes';
import Inventario from '../pages/admin/Inventario';
import PerfilAfiliado from '../pages/affiliate/PerfilAfiliado';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('Pages Simple 1', () => {
  it('renders GestionSedes', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><GestionSedes /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Sucursales')).toBeInTheDocument();
  });

  it('renders Inventario', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><Inventario /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Gestion de Inventario')).toBeInTheDocument();
  });

  it('renders PerfilAfiliado', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><PerfilAfiliado /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Preferencias')).toBeInTheDocument();
  });
});
