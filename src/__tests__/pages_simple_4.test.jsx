import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import MapaPedidos from '../pages/affiliate/MapaPedidos';
import MapaEntregas from '../pages/driver/MapaEntregas';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  }
}));

// mock leafleat
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div>TileLayer</div>,
  Marker: () => <div>Marker</div>,
  Popup: () => <div>Popup</div>,
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn(), getZoom: vi.fn() }),
}));

describe('Pages Simple 4', () => {
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

  it('renders MapaPedidos', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><MapaPedidos /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getByText('Logistics Map')).toBeInTheDocument();
  });

  it('renders MapaEntregas', async () => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><MapaEntregas /></MemoryRouter>);
      container = res.container;
    });
    expect(screen.getAllByText('Mapa de Entregas')[0]).toBeInTheDocument();
  });
});
