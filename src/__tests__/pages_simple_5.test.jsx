import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CartProvider } from '../context/CartContext';

import InventarioAfiliado from '../pages/affiliate/InventarioAfiliado';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  }
}));

describe('Pages Simple 5', () => {
  it('renders InventarioAfiliado', async () => {
    let container;
    await act(async () => {
      const res = render(
        <MemoryRouter>
          <CartProvider>
            <InventarioAfiliado />
          </CartProvider>
        </MemoryRouter>
      );
      container = res.container;
    });
    expect(screen.getByText('Inventario por Sucursal')).toBeInTheDocument();
  });
});
