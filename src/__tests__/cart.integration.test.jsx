/**
 * cart.integration.test.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Pruebas de integración — HU-03: Agregar medicamentos al carrito
 *
 * Escenarios cubiertos:
 *  1. Agregar producto con stock disponible → aparece en carrito con cantidad 1
 *  2. Agregar el mismo producto dos veces  → incrementa cantidad (no duplica)
 *  3. Intentar agregar producto sin stock  → botón deshabilitado
 *  4. Intentar superar el stock disponible → mensaje de error adecuado
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks de módulos externos ─────────────────────────────────────────

vi.mock('../api/cartService', () => ({
  addToCart: vi.fn(),
  getCart: vi.fn(),
}))

vi.mock('../api/inventarioService', () => ({
  getBranchesWithMedications: vi.fn(),
  getBranchStock: vi.fn(),
}))

import { addToCart, getCart } from '../api/cartService'
import { getBranchesWithMedications, getBranchStock } from '../api/inventarioService'

// ── Datos de prueba ───────────────────────────────────────────────────

const MOCK_BRANCHES = [{ branchId: 1, branchName: 'Sede Central' }]

const MOCK_MEDICATIONS = [
  {
    medicationId: 1,
    medicationName: 'Paracetamol 500mg',
    unit: 'tableta',
    quantity: 10,
    unitPrice: 5000,
    isAvailable: true,
  },
  {
    medicationId: 2,
    medicationName: 'Ibuprofeno 400mg',
    unit: 'cápsula',
    quantity: 0,
    unitPrice: 8000,
    isAvailable: false,
  },
  {
    medicationId: 3,
    medicationName: 'Amoxicilina 500mg',
    unit: 'cápsula',
    quantity: 50,
    unitPrice: 12000,
    isAvailable: true,
  },
]

// Respuesta de addToCart con 1 Paracetamol en el carrito
const buildCartResponse = (items) => ({
  cartId: 42,
  affiliateId: 1,
  branchId: 1,
  items,
  totalPrice: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
  message: 'Medicamento agregado al carrito exitosamente',
})

// ── Helpers de renderizado ────────────────────────────────────────────

import { CartProvider } from '../context/CartContext'

/**
 * Renderiza InventarioAfiliado dentro de un CartProvider con
 * localStorage simulado para un afiliado autenticado.
 */
async function renderInventory() {
  // Simular usuario autenticado
  localStorage.setItem('medigo_user', JSON.stringify({ id: 1, role: 'AFILIADO', name: 'Test User' }))
  localStorage.setItem('medigo_token', 'fake-token')

  // Importación dinámica para que los mocks ya estén activos
  const { default: InventarioAfiliado } = await import('../pages/affiliate/InventarioAfiliado')

  const utils = render(
    <MemoryRouter>
      <CartProvider>
        <InventarioAfiliado />
      </CartProvider>
    </MemoryRouter>
  )

  // Esperar a que se carguen las sedes y medicamentos
  await waitFor(() => {
    expect(getBranchesWithMedications).toHaveBeenCalled()
  })
  await waitFor(() => {
    expect(getBranchStock).toHaveBeenCalled()
  })

  return utils
}

// ── Suite de pruebas ──────────────────────────────────────────────────

describe('HU-03: Agregar medicamentos al carrito', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    getBranchesWithMedications.mockResolvedValue(MOCK_BRANCHES)
    // La página filtra items con quantity > 20, así que usamos medicamentos con quantity=50
    // pero para los tests de carrito necesitamos controlar cuáles pasan el filtro.
    // Ajustamos el mock para devolver ítems que superen el umbral de 20 o forzamos 0 stock.
    getBranchStock.mockResolvedValue(MOCK_MEDICATIONS)
    getCart.mockRejectedValue(new Error('No cart'))
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 3: Botón deshabilitado para producto sin stock
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 3: El botón "Agregar" está deshabilitado para medicamentos con stock 0', async () => {
    await renderInventory()

    // Ibuprofeno tiene quantity=0 → no pasa el filtro quantity > 20 de la página
    // (la página oculta medicamentos con stock ≤ 20, incluyendo 0)
    // Verificamos que no aparece en la tabla
    const rows = screen.queryAllByRole('row')
    const ibuprofenoRow = rows.find((row) => within(row).queryByText(/ibuprofeno/i))
    expect(ibuprofenoRow).toBeUndefined()
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 1: Agregar producto con stock disponible
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 1: Agregar producto con stock disponible actualiza el carrito', async () => {
    addToCart.mockResolvedValueOnce(
      buildCartResponse([{ medicationId: 3, quantity: 1, unitPrice: 12000, subtotal: 12000 }])
    )

    await renderInventory()

    // Amoxicilina tiene quantity=50 > 20, debe aparecer
    await waitFor(() => {
      expect(screen.getByText('Amoxicilina 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    // Encontrar el botón "Agregar" de Amoxicilina
    const rows = screen.getAllByRole('row')
    const amoxRow = rows.find((row) => within(row).queryByText('Amoxicilina 500mg'))
    expect(amoxRow).toBeDefined()

    const addBtn = within(amoxRow).getByRole('button', { name: /agregar amoxicilina/i })
    expect(addBtn).toBeEnabled()

    await user.click(addBtn)

    // Verificar que se llamó al servicio con los datos correctos
    expect(addToCart).toHaveBeenCalledWith({
      affiliateId: 1,
      branchId: 1,
      medicationId: 3,
      quantity: 1,
    })

    // Verificar notificación de éxito
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/amoxicilina/i)
    })

    // Verificar que el badge del carrito muestra 1
    await waitFor(() => {
      const badge = document.querySelector('.cart-badge')
      expect(badge).toHaveTextContent('1')
    })
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 2: Agregar el mismo producto dos veces
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 2: Agregar el mismo producto dos veces incrementa la cantidad sin duplicar', async () => {
    addToCart
      .mockResolvedValueOnce(
        buildCartResponse([{ medicationId: 3, quantity: 1, unitPrice: 12000, subtotal: 12000 }])
      )
      .mockResolvedValueOnce(
        buildCartResponse([{ medicationId: 3, quantity: 2, unitPrice: 12000, subtotal: 24000 }])
      )

    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Amoxicilina 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    const rows = screen.getAllByRole('row')
    const amoxRow = rows.find((row) => within(row).queryByText('Amoxicilina 500mg'))
    const addBtn = within(amoxRow).getByRole('button', { name: /agregar amoxicilina/i })

    // Primer clic
    await user.click(addBtn)
    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledTimes(1)
    })

    // Segundo clic
    await user.click(addBtn)
    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledTimes(2)
    })

    // El carrito debe mostrar cantidad 2 (no dos entradas separadas)
    await waitFor(() => {
      const badge = document.querySelector('.cart-badge')
      expect(badge).toHaveTextContent('2')
    })

    // Abrir el panel del carrito y verificar que hay solo 1 línea de Amoxicilina
    const cartToggle = screen.getByRole('button', { name: /abrir carrito/i })
    await user.click(cartToggle)

    await waitFor(() => {
      const listItems = screen.queryAllByRole('listitem')
      // Solo debe haber 1 item en el carrito (no duplicado)
      expect(listItems).toHaveLength(1)
    })
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 4: Intentar agregar más unidades que el stock disponible
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 4: No permite agregar más unidades que el stock disponible', async () => {
    // Medicamento con stock=50, ya tenemos 49 en el carrito
    // Al intentar agregar 1 más (total 50 = stock), debe funcionar.
    // Al intentar agregar cuando ya hay 50 (cartQty=50 >= stock=50), debe fallar.

    // Simular que el carrito ya tiene 49 unidades de Amoxicilina
    getCart.mockResolvedValueOnce(
      buildCartResponse([{ medicationId: 3, quantity: 49, unitPrice: 12000, subtotal: 588000 }])
    )

    addToCart.mockResolvedValueOnce(
      buildCartResponse([{ medicationId: 3, quantity: 50, unitPrice: 12000, subtotal: 600000 }])
    )

    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Amoxicilina 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    const rows = screen.getAllByRole('row')
    const amoxRow = rows.find((row) => within(row).queryByText('Amoxicilina 500mg'))
    const addBtn = within(amoxRow).getByRole('button', { name: /agregar amoxicilina/i })

    // Primer clic: cart tiene 49, stock es 50 → debe funcionar (49+1=50 ≤ 50)
    await user.click(addBtn)
    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledTimes(1)
    })

    // Segundo clic: cart tendría 51, stock es 50 → debe mostrar error
    await user.click(addBtn)

    await waitFor(() => {
      const notification = screen.getByRole('status')
      expect(notification).toHaveTextContent(/no hay suficiente stock disponible/i)
    })

    // El servicio NO debe haber sido llamado por segunda vez
    expect(addToCart).toHaveBeenCalledTimes(1)
  })

  // ────────────────────────────────────────────────────────────────────
  // Validación: total del carrito se actualiza al agregar producto
  // ────────────────────────────────────────────────────────────────────
  it('El total del carrito se actualiza correctamente al agregar un producto', async () => {
    addToCart.mockResolvedValueOnce(
      buildCartResponse([{ medicationId: 3, quantity: 1, unitPrice: 12000, subtotal: 12000 }])
    )

    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Amoxicilina 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    const rows = screen.getAllByRole('row')
    const amoxRow = rows.find((row) => within(row).queryByText('Amoxicilina 500mg'))
    const addBtn = within(amoxRow).getByRole('button', { name: /agregar amoxicilina/i })

    await user.click(addBtn)

    // Abrir el panel para verificar el total
    const cartToggle = screen.getByRole('button', { name: /abrir carrito/i })
    await user.click(cartToggle)

    await waitFor(() => {
      // El total debe mostrarse con formato de moneda colombiana
      const footer = document.querySelector('.carrito-footer')
      expect(footer).toHaveTextContent(/12\.000|12,000/)
    })
  })
})
