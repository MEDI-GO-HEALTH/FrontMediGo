import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AdminSidebar from '../components/layout/AdminSidebar';
import AffiliateSidebar from '../components/layout/AffiliateSidebar';
import DriverSidebar from '../components/layout/DriverSidebar';
import Sidebar from '../components/layout/Sidebar';
import AffiliateShell from '../components/layout/AffiliateShell';
import DashboardLayout from '../components/layout/DashboardLayout';
import MedigoSidebarBrand from '../components/common/MedigoSidebarBrand';
import PageLoadingOverlay from '../components/common/PageLoadingOverlay';
import useAuthFormState from '../hooks/useAuthFormState';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('Misc tests to bump coverage', () => {
  it('renders login', async () => {
    await act(async () => {
      render(<MemoryRouter><Login /></MemoryRouter>);
    });
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders register', async () => {
    await act(async () => {
      render(<MemoryRouter><Register /></MemoryRouter>);
    });
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders sidebars', async () => {
    await act(async () => {
      render(<MemoryRouter><AdminSidebar /></MemoryRouter>);
      render(<MemoryRouter><AffiliateSidebar /></MemoryRouter>);
      render(<MemoryRouter><DriverSidebar /></MemoryRouter>);
      render(<MemoryRouter><Sidebar /></MemoryRouter>);
    });
    expect(screen.getAllByText('Inventario')[0]).toBeInTheDocument();
  });

  it('renders layouts', async () => {
    await act(async () => {
      render(<MemoryRouter><AffiliateShell /></MemoryRouter>);
      render(<MemoryRouter><DashboardLayout>childx</DashboardLayout></MemoryRouter>);
    });
    expect(screen.getByText('childx')).toBeInTheDocument();
  });

  it('renders common components', () => {
    render(<MedigoSidebarBrand />);
    render(<PageLoadingOverlay visible={true} message="loadingx" />);
    expect(screen.getByText('loadingx')).toBeInTheDocument();
  });
});
