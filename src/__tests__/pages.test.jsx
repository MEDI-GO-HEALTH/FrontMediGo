import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import MapaPedidos from '../pages/affiliate/MapaPedidos';
import MapaEntregas from '../pages/driver/MapaEntregas';
import GestionSedes from '../pages/admin/GestionSedes';
import Inventario from '../pages/admin/Inventario';
import PerfilAfiliado from '../pages/affiliate/PerfilAfiliado';
import PerfilRepartidor from '../pages/driver/PerfilRepartidor';
import HistorialViajes from '../pages/driver/HistorialViajes';
import GestionSubastas from '../pages/admin/GestionSubastas';
import CentroSubastas from '../pages/affiliate/CentroSubastas';

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
  useMapEvents: () => ({}),
}));

describe('Pages Rendering Tests', () => {
  const renderComponent = async (Component) => {
    let container;
    await act(async () => {
      const res = render(<MemoryRouter><Component /></MemoryRouter>);
      container = res.container;
    });
    return container;
  };

  it('renders auth pages correctly', async () => {
    await renderComponent(Login);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();

    await renderComponent(Register);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders map pages correctly', async () => {
    await renderComponent(MapaPedidos);
    expect(screen.getByText('Logistics Map')).toBeInTheDocument();

    await renderComponent(MapaEntregas);
    expect(screen.getAllByText('Mapa de Entregas')[0]).toBeInTheDocument();
  });

  it('renders admin pages correctly', async () => {
    await renderComponent(GestionSedes);
    expect(screen.getByText('Sucursales')).toBeInTheDocument();

    await renderComponent(Inventario);
    expect(screen.getByText('Gestion de Inventario')).toBeInTheDocument();

    await renderComponent(GestionSubastas);
    expect(screen.getAllByText('Subastas')[0]).toBeInTheDocument();
  });

  it('renders affiliate pages correctly', async () => {
    await renderComponent(PerfilAfiliado);
    expect(screen.getByText('Preferencias')).toBeInTheDocument();

    await renderComponent(CentroSubastas);
    expect(screen.getByText('Subastas Activas')).toBeInTheDocument();
  });

  it('renders driver pages correctly', async () => {
    await renderComponent(PerfilRepartidor);
    expect(screen.getByText('Datos del Repartidor')).toBeInTheDocument();

    await renderComponent(HistorialViajes);
    expect(screen.getByText('Historial de Actividad')).toBeInTheDocument();
  });
});
