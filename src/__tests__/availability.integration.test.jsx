/**
 * availability.integration.test.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Pruebas de integración — HU-04: Ver disponibilidad en sucursal en tiempo real
 *
 * Escenarios cubiertos:
 *  1. Disponibilidad de medicamento con stock  → badge verde "Disponible"
 *  2. Medicamento sin stock en sucursal        → badge rojo "No disponible"
 *  3. Cambio de sucursal actualiza indicadores → sin recarga de página
 *  4. Múltiples sucursales con indicadores     → lista completa visible en modal
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('../api/cartService', () => ({
  addToCart: vi.fn(),
  getCart: vi.fn().mockRejectedValue(new Error('no cart')),
}))

vi.mock('../api/inventarioService', () => ({
  getBranchesWithMedications: vi.fn(),
  getBranchStock: vi.fn(),
  getMedicationAvailabilityAllBranches: vi.fn(),
  getMedicationAvailabilityByBranch: vi.fn(),
}))

import { getMedicationAvailabilityAllBranches, getBranchesWithMedications, getBranchStock } from '../api/inventarioService'

// ── Datos de prueba ───────────────────────────────────────────────────

const BRANCHES = [
  { branchId: 1, branchName: 'Sede Centro' },
  { branchId: 2, branchName: 'Sede Norte' },
  { branchId: 3, branchName: 'Sede Sur' },
]

// Medicamento con stock suficiente para superar el filtro CRITICAL_STOCK_THRESHOLD=20
const MEDICATIONS_BRANCH_1 = [
  {
    medicationId: 10,
    medicationName: 'Paracetamol 500mg',
    unit: 'tableta',
    quantity: 50,
    unitPrice: 5000,
    isAvailable: true,
  },
]

// Respuesta de disponibilidad en todas las sucursales para Paracetamol 500mg
const AVAILABILITY_ALL_BRANCHES = {
  medicationId: 10,
  medicationName: 'Paracetamol 500mg',
  description: 'Analgésico',
  unit: 'tableta',
  availabilityByBranch: [
    { branchId: 1, quantity: 5, isAvailable: true, availabilityStatus: 'Disponible' },
    { branchId: 2, quantity: 0, isAvailable: false, availabilityStatus: 'No disponible' },
    { branchId: 3, quantity: 12, isAvailable: true, availabilityStatus: 'Disponible' },
  ],
  totalAvailable: 17,
  branchesWithStock: 2,
}

// ── Helper ────────────────────────────────────────────────────────────

import { CartProvider } from '../context/CartContext'

async function renderInventory() {
  localStorage.setItem('medigo_user', JSON.stringify({ id: 1, role: 'AFILIADO', name: 'Test User' }))
  localStorage.setItem('medigo_token', 'fake-token')

  const { default: InventarioAfiliado } = await import('../pages/affiliate/InventarioAfiliado')

  const utils = render(
    <MemoryRouter>
      <CartProvider>
        <InventarioAfiliado />
      </CartProvider>
    </MemoryRouter>
  )

  await waitFor(() => expect(getBranchesWithMedications).toHaveBeenCalled())
  await waitFor(() => expect(getBranchStock).toHaveBeenCalled())

  return utils
}

// ── Suite ─────────────────────────────────────────────────────────────

describe('HU-04: Ver disponibilidad en sucursal en tiempo real', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    getBranchesWithMedications.mockResolvedValue(BRANCHES)
    getBranchStock.mockResolvedValue(MEDICATIONS_BRANCH_1)
    getMedicationAvailabilityAllBranches.mockResolvedValue(AVAILABILITY_ALL_BRANCHES)
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 1: Disponibilidad en sucursal con stock → badge verde
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 1: Sucursal con stock muestra badge verde "Disponible"', async () => {
    await renderInventory()

    // Esperar a que aparezca el medicamento
    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    // Abrir modal de disponibilidad
    const dispBtn = screen.getByRole('button', { name: /ver disponibilidad de paracetamol/i })
    await user.click(dispBtn)

    // El modal debe aparecer
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Esperar respuesta de la API
    await waitFor(() => {
      expect(getMedicationAvailabilityAllBranches).toHaveBeenCalledWith(10)
    })

    // Sede Centro (branchId=1, quantity=5) → debe mostrar badge verde
    await waitFor(() => {
      const modal = screen.getByRole('dialog')
      const items = within(modal).getAllByRole('listitem')
      const centroItem = items.find((li) => within(li).queryByText('Sede Centro'))
      expect(centroItem).toBeDefined()
      const badge = within(centroItem).getByText(/disponible/i)
      expect(badge).toHaveClass('disp-badge--ok')
    })
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 2: Sucursal sin stock → badge rojo "No disponible"
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 2: Sucursal sin stock muestra badge rojo "No disponible"', async () => {
    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const dispBtn = screen.getByRole('button', { name: /ver disponibilidad de paracetamol/i })
    await user.click(dispBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Sede Norte (branchId=2, quantity=0) → badge rojo
    await waitFor(() => {
      const modal = screen.getByRole('dialog')
      const items = within(modal).getAllByRole('listitem')
      const norteItem = items.find((li) => within(li).queryByText('Sede Norte'))
      expect(norteItem).toBeDefined()
      const badge = within(norteItem).getByText(/no disponible/i)
      expect(badge).toHaveClass('disp-badge--no')
    })
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 3: Cambio de sucursal actualiza disponibilidad sin recargar
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 3: Cambio de sucursal actualiza el inventario automáticamente sin recargar', async () => {
    // Sucursal 1 (Centro): Paracetamol disponible
    getBranchStock
      .mockResolvedValueOnce(MEDICATIONS_BRANCH_1)
      // Sucursal 2 (Norte): Paracetamol sin stock (quantity=0, no pasa el filtro > 20)
      .mockResolvedValueOnce([])

    await renderInventory()

    // Estado inicial: Sede Centro, Paracetamol visible
    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    // Cambiar a Sede Norte (branchId=2)
    const branchSelect = screen.getByRole('combobox')
    await user.selectOptions(branchSelect, '2')

    // El inventario se actualiza automáticamente (sin recargar página)
    // La tabla mostrará el estado vacío ya que no hay medicamentos con stock > 20 en Sede Norte
    await waitFor(() => {
      expect(getBranchStock).toHaveBeenCalledWith(2)
    })

    // Paracetamol ya no aparece (sin stock en Sede Norte)
    await waitFor(() => {
      expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument()
    })

    // El mensaje de "no hay medicamentos" aparece
    await waitFor(() => {
      expect(screen.getByText(/no hay medicamentos/i)).toBeInTheDocument()
    })

    // No hubo recarga de página (el componente sigue montado y el select sigue ahí)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 4: Modal muestra TODAS las sucursales con indicadores
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 4: El modal muestra todas las sucursales con indicador visual de disponibilidad', async () => {
    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()

    const dispBtn = screen.getByRole('button', { name: /ver disponibilidad de paracetamol/i })
    await user.click(dispBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Esperar a que la API responda y se muestre la lista
    await waitFor(() => {
      const modal = screen.getByRole('dialog')
      const items = within(modal).getAllByRole('listitem')
      // Debe haber 3 sucursales (una por cada entrada en AVAILABILITY_ALL_BRANCHES)
      expect(items).toHaveLength(3)
    })

    // Verificar que cada sucursal aparece en el listado
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText('Sede Centro')).toBeInTheDocument()
    expect(within(modal).getByText('Sede Norte')).toBeInTheDocument()
    expect(within(modal).getByText('Sede Sur')).toBeInTheDocument()

    // Verificar indicadores visuales correctos
    const items = within(modal).getAllByRole('listitem')

    // Sede Centro (disponible) → badge verde
    const centroItem = items.find((li) => within(li).queryByText('Sede Centro'))
    expect(within(centroItem).getByText(/disponible/i)).toHaveClass('disp-badge--ok')

    // Sede Norte (no disponible) → badge rojo
    const norteItem = items.find((li) => within(li).queryByText('Sede Norte'))
    expect(within(norteItem).getByText(/no disponible/i)).toHaveClass('disp-badge--no')

    // Sede Sur (disponible) → badge verde
    const surItem = items.find((li) => within(li).queryByText('Sede Sur'))
    expect(within(surItem).getByText(/disponible/i)).toHaveClass('disp-badge--ok')
  })

  // ────────────────────────────────────────────────────────────────────
  // Validación: La sucursal actualmente seleccionada está resaltada en el modal
  // ────────────────────────────────────────────────────────────────────
  it('La sucursal actualmente seleccionada se resalta en el modal de disponibilidad', async () => {
    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const dispBtn = screen.getByRole('button', { name: /ver disponibilidad de paracetamol/i })
    await user.click(dispBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Esperar que la lista se cargue
    await waitFor(() => {
      const modal = screen.getByRole('dialog')
      expect(within(modal).getAllByRole('listitem')).toHaveLength(3)
    })

    // La sucursal seleccionada (branchId=1, Sede Centro) debe tener la clase selected
    const modal = screen.getByRole('dialog')
    const items = within(modal).getAllByRole('listitem')
    const centroItem = items.find((li) => within(li).queryByText('Sede Centro'))
    expect(centroItem).toHaveClass('disp-item--selected')

    // Y debe mostrar la etiqueta "Sucursal seleccionada"
    expect(within(centroItem).getByText(/sucursal seleccionada/i)).toBeInTheDocument()
  })

  // ────────────────────────────────────────────────────────────────────
  // Validación: Mock fallback cuando la API no está disponible
  // ────────────────────────────────────────────────────────────────────
  it('Usa datos mock cuando la API de disponibilidad falla', async () => {
    getMedicationAvailabilityAllBranches.mockRejectedValue(new Error('API unavailable'))

    await renderInventory()

    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const dispBtn = screen.getByRole('button', { name: /ver disponibilidad de paracetamol/i })
    await user.click(dispBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Debe mostrar datos mock (no quedarse en estado de carga)
    await waitFor(() => {
      const modal = screen.getByRole('dialog')
      const items = within(modal).queryAllByRole('listitem')
      // Los datos mock se generan para las 3 sucursales cargadas
      expect(items.length).toBeGreaterThan(0)
    })
  })
})
