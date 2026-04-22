/**
 * driverMap.integration.test.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Pruebas de integración — HU-09: Mapa en vivo con ubicación de repartidores
 *
 * Escenarios cubiertos:
 *  1.  Repartidor asignado aparece con marcador verde (ASSIGNED_TO_ME)
 *  2.  Repartidores disponibles aparecen con marcador amarillo (AVAILABLE)
 *  3.  Repartidores ocupados aparecen con marcador gris (BUSY)
 *  4.  Distinción clara entre los tres tipos en el mismo mapa
 *  5.  Actualización automática: intervalo configurado correctamente
 *  6.  Popup del repartidor asignado muestra nombre, estado y ETA
 *  7.  Popup de repartidor disponible muestra info correcta
 *  8.  Sin repartidores → mensaje informativo visible
 *  9.  Leyenda del mapa visible con los tres colores
 * 10.  Indicador "En vivo" visible en el mapa
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mocks de librerías externas ───────────────────────────────────────

// Mock de leaflet — L.divIcon y L.icon no necesitan DOM real
vi.mock('leaflet', async () => {
  const actual = {}
  return {
    ...actual,
    default: {
      divIcon: vi.fn((opts) => ({ ...opts, _isIcon: true })),
      icon: vi.fn((opts) => ({ ...opts, _isIcon: true })),
    },
    divIcon: vi.fn((opts) => ({ ...opts, _isIcon: true })),
    icon: vi.fn((opts) => ({ ...opts, _isIcon: true })),
  }
})

// Mock de react-leaflet — renderiza elementos HTML simples para poder testear
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, className, 'aria-label': ariaLabel }) => (
    <div
      data-testid="leaflet-map"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url }) => <div data-testid="tile-layer" data-url={url} />,
  Marker: ({ children, position, icon, 'aria-label': ariaLabel }) => {
    const statusClass = icon?.html?.match(/driver-pin--(\w+)/)?.[1] ?? 'unknown'
    return (
      <div
        data-testid="map-marker"
        data-lat={position?.[0]}
        data-lng={position?.[1]}
        data-status={statusClass}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    )
  },
  Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn() }),
}))

// Mock de leaflet CSS — no se necesita en tests
vi.mock('leaflet/dist/leaflet.css', () => ({}))

// ── Mock del hook de driver locations ─────────────────────────────────
vi.mock('../hooks/useDriverLocations')
import useDriverLocations from '../hooks/useDriverLocations'

// ── Mock del LogisticsService ─────────────────────────────────────────
vi.mock('../api/affiliateLogisticsService', () => ({
  getAffiliateLogisticsDashboard: vi.fn().mockRejectedValue(new Error('no backend')),
}))

// ── Datos de prueba ───────────────────────────────────────────────────

const NOW = new Date()

const ASSIGNED_DRIVER = {
  id: 1, name: 'Juan Pérez',
  lat: 4.711, lng: -74.0721,
  status: 'ASSIGNED_TO_ME',
  estimatedTime: '8 min',
  lastUpdate: NOW,
}

const AVAILABLE_DRIVER = {
  id: 2, name: 'Carlos López',
  lat: 4.720, lng: -74.066,
  status: 'AVAILABLE',
  estimatedTime: null,
  lastUpdate: NOW,
}

const BUSY_DRIVER = {
  id: 3, name: 'María Rodríguez',
  lat: 4.705, lng: -74.078,
  status: 'BUSY',
  estimatedTime: null,
  lastUpdate: NOW,
}

const ALL_DRIVERS = [ASSIGNED_DRIVER, AVAILABLE_DRIVER, BUSY_DRIVER]

// ── Helper ────────────────────────────────────────────────────────────

async function renderMap(driversOverride) {
  localStorage.setItem('medigo_user', JSON.stringify({ id: 1, role: 'AFILIADO', name: 'Test User' }))
  localStorage.setItem('medigo_token', 'fake-token')

  const { default: MapaPedidos } = await import('../pages/affiliate/MapaPedidos')

  return render(
    <MemoryRouter>
      <MapaPedidos />
    </MemoryRouter>
  )
}

// ── Suite ─────────────────────────────────────────────────────────────

describe('HU-09: Mapa en vivo con ubicación de repartidores', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 1: Repartidor asignado → marcador verde (ASSIGNED_TO_ME)
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 1: El repartidor asignado aparece con marcador verde (ASSIGNED_TO_ME)', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const markers = screen.getAllByTestId('map-marker')
    const assignedMarker = markers.find((m) => m.getAttribute('data-status') === 'assigned')

    expect(assignedMarker).toBeDefined()
    // El icono div usa class driver-pin--assigned
    expect(assignedMarker.getAttribute('data-status')).toBe('assigned')
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 2: Repartidores disponibles → marcador amarillo
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 2: Repartidores disponibles aparecen con marcador amarillo (AVAILABLE)', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const markers = screen.getAllByTestId('map-marker')
    const availableMarkers = markers.filter((m) => m.getAttribute('data-status') === 'available')

    expect(availableMarkers).toHaveLength(1)
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 3: Repartidores ocupados → marcador gris
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 3: Repartidores ocupados aparecen con marcador gris (BUSY)', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const markers = screen.getAllByTestId('map-marker')
    const busyMarkers = markers.filter((m) => m.getAttribute('data-status') === 'busy')

    expect(busyMarkers).toHaveLength(1)
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 4: Distinción clara entre los tres tipos
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 4: Los tres tipos de marcador (verde, amarillo, gris) están simultáneamente en el mapa', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const markers = screen.getAllByTestId('map-marker')
    expect(markers).toHaveLength(3)

    const statuses = markers.map((m) => m.getAttribute('data-status'))
    expect(statuses).toContain('assigned')
    expect(statuses).toContain('available')
    expect(statuses).toContain('busy')
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 5: Auto-actualización — hook llamado con intervalo
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 5: El hook de ubicaciones se inicializa correctamente para actualización automática', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    // El hook debe haber sido invocado (MapaPedidos lo llama en su render)
    expect(useDriverLocations).toHaveBeenCalled()
    // Verifica que se usa con intervalo por defecto (no se pasa argumento → usa 7000ms interno)
    expect(useDriverLocations).toHaveBeenCalledWith()
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 6+7: Popup con información al hacer clic — repartidor asignado
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 6-7: El popup del repartidor asignado muestra nombre, estado y tiempo estimado', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    // El Popup de react-leaflet se renderiza inmediatamente en el mock
    const popups = screen.getAllByTestId('map-popup')

    // El popup del repartidor asignado debe incluir el nombre
    const assignedMarker = screen.getAllByTestId('map-marker').find(
      (m) => m.getAttribute('data-status') === 'assigned'
    )
    const assignedPopup = within(assignedMarker).getByTestId('map-popup')

    expect(within(assignedPopup).getByText('Juan Pérez')).toBeInTheDocument()
    expect(within(assignedPopup).getByText(/tu repartidor.*juan pérez/i)).toBeInTheDocument()
    expect(within(assignedPopup).getByText(/8 min/i)).toBeInTheDocument()
  })

  it('Escenario 7: El popup del repartidor disponible muestra "Listo para entregar"', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const availableMarker = screen.getAllByTestId('map-marker').find(
      (m) => m.getAttribute('data-status') === 'available'
    )
    const availablePopup = within(availableMarker).getByTestId('map-popup')

    // El nombre aparece en dos nodos: título y texto de estado combinado — verificar con getAllByText
    expect(within(availablePopup).getAllByText(/carlos lópez/i).length).toBeGreaterThan(0)
    expect(within(availablePopup).getByText(/listo para entregar/i)).toBeInTheDocument()
  })

  it('Escenario 7: El popup del repartidor ocupado muestra "Entregando otro pedido"', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const busyMarker = screen.getAllByTestId('map-marker').find(
      (m) => m.getAttribute('data-status') === 'busy'
    )
    const busyPopup = within(busyMarker).getByTestId('map-popup')

    expect(within(busyPopup).getAllByText(/maría rodríguez/i).length).toBeGreaterThan(0)
    expect(within(busyPopup).getByText(/entregando otro pedido/i)).toBeInTheDocument()
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 8: Sin repartidores → mensaje informativo
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 8: Sin repartidores activos muestra mensaje informativo', async () => {
    useDriverLocations.mockReturnValue({
      drivers: [],
      assignedDriver: null,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: true,
    })

    await renderMap()

    await waitFor(() => {
      expect(screen.getByText(/no hay repartidores disponibles en tu zona/i)).toBeInTheDocument()
    })

    // No debe haber marcadores en el mapa
    expect(screen.queryAllByTestId('map-marker')).toHaveLength(0)
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 9: Leyenda del mapa visible con los tres colores
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 9: La leyenda del mapa muestra los tres tipos de repartidor', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const legend = screen.getByRole('complementary', { name: /leyenda/i })
    expect(legend).toBeInTheDocument()

    expect(within(legend).getByText(/mi repartidor/i)).toBeInTheDocument()
    expect(within(legend).getByText(/disponible/i)).toBeInTheDocument()
    expect(within(legend).getByText(/ocupado/i)).toBeInTheDocument()
  })

  // ────────────────────────────────────────────────────────────────────
  // Escenario 10: Indicador "En vivo" visible
  // ────────────────────────────────────────────────────────────────────
  it('Escenario 10: El indicador de actualización en vivo está visible en el mapa', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const liveBar = screen.getByLabelText(/estado de actualización del mapa/i)
    expect(liveBar).toBeInTheDocument()
    expect(liveBar).toHaveTextContent(/en vivo/i)
  })

  // ────────────────────────────────────────────────────────────────────
  // Validación: Tarjeta del repartidor asignado visible en el panel
  // ────────────────────────────────────────────────────────────────────
  it('La tarjeta del repartidor asignado se muestra en el panel lateral', async () => {
    useDriverLocations.mockReturnValue({
      drivers: ALL_DRIVERS,
      assignedDriver: ASSIGNED_DRIVER,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const assignedCard = screen.getByRole('region', { name: /repartidor asignado/i })
    expect(assignedCard).toBeInTheDocument()
    expect(within(assignedCard).getByText('Juan Pérez')).toBeInTheDocument()
    expect(within(assignedCard).getByText(/en camino/i)).toBeInTheDocument()
    expect(within(assignedCard).getByText(/8 min/i)).toBeInTheDocument()
  })

  // ────────────────────────────────────────────────────────────────────
  // Validación: Mapa renderizado correctamente con TileLayer
  // ────────────────────────────────────────────────────────────────────
  it('El mapa Leaflet se renderiza con el tile layer de OpenStreetMap', async () => {
    useDriverLocations.mockReturnValue({
      drivers: [],
      assignedDriver: null,
      isLoading: false,
      lastUpdated: NOW,
      noDrivers: false,
    })

    await renderMap()

    const map = screen.getByTestId('leaflet-map')
    expect(map).toBeInTheDocument()

    const tileLayer = screen.getByTestId('tile-layer')
    expect(tileLayer.getAttribute('data-url')).toContain('openstreetmap.org')
  })
})
