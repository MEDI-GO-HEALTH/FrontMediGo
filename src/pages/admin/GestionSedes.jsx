import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router'
import { createSede, deleteSede, getSedes, updateSede } from '../../api/sedesService'
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import { ROUTES } from '../../constants/routes'
import useCappedLoading from '../../hooks/useCappedLoading'
import 'leaflet/dist/leaflet.css'
import '../../styles/admin/gestion-sedes.css'

const FALLBACK_BRANCHES = [
  {
    id: 'SED-001',
    name: 'Central Medical Plaza',
    address: 'Av. El Dorado #22-10',
    phone: '(601) 455-8800',
    specialization: 'ATENCION PRIMARIA',
    team: 42,
    icon: 'apartment',
  },
  {
    id: 'SED-002',
    name: 'Advanced Diagnostic Wing',
    address: 'Carrera 15 #93-45',
    phone: '(601) 210-9900',
    specialization: 'ESPECIALIZADA',
    team: 18,
    icon: 'biotech',
  },
  {
    id: 'SED-003',
    name: 'MediGo Pediatrics Hub',
    address: 'Street 116 #45-12',
    phone: '(601) 677-1122',
    specialization: 'MATERNIDAD',
    team: 35,
    icon: 'child_care',
  },
]

const EMPTY_FORM = {
  name: '',
  specialty: 'Medicina General',
  address: '',
  phone: '',
  capacity: '',
  latitude: '',
  longitude: '',
}

const DEFAULT_CENTER = [4.711, -74.0721]

const toCoordinateNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const hasValidCoordinates = (branch) => {
  const lat = Number(branch?.latitude)
  const lng = Number(branch?.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng)
}

const buildApproxAddress = (lat, lng) => `Ubicacion aproximada (${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)})`

const mapBranchFromApi = (item, index) => ({
  id: item?.id || item?.codigo || `SED-${String(index + 1).padStart(3, '0')}`,
  name: item?.nombre || item?.name || 'Nueva Sede',
  address: item?.direccion || item?.address || 'Direccion por confirmar',
  phone: item?.telefono || item?.phone || '(000) 000-0000',
  specialization: String(item?.especialidad || item?.specialization || 'GENERAL').toUpperCase(),
  team: Number(item?.miembros || item?.personal || item?.team || 0),
  latitude: toCoordinateNumber(item?.latitude ?? item?.lat),
  longitude: toCoordinateNumber(item?.longitude ?? item?.lng),
  icon: item?.icon || 'apartment',
})

function MapViewportController({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, map, zoom])

  return null
}

function MapClickCapture({ enabled, onPick }) {
  useMapEvents({
    click: (event) => {
      if (!enabled) {
        return
      }

      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

const getBranchCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }
  if (Array.isArray(payload?.items)) {
    return payload.items
  }
  if (Array.isArray(payload?.results)) {
    return payload.results
  }
  return []
}

export default function GestionSedes() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [branches, setBranches] = useState(FALLBACK_BRANCHES)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editDraft, setEditDraft] = useState({
    name: '',
    address: '',
    specialty: '',
    phone: '',
    capacity: '',
    latitude: '',
    longitude: '',
  })
  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const [mapZoom, setMapZoom] = useState(12)
  const [creationMode, setCreationMode] = useState('manual')
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [mapLookupLoading, setMapLookupLoading] = useState(false)
  const [mapDraft, setMapDraft] = useState({
    name: '',
    specialty: 'Medicina General',
    address: '',
    phone: '',
    capacity: '',
    latitude: '',
    longitude: '',
  })
  const [syncNotice, setSyncNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const reverseLookupRequestIdRef = useRef(0)
  const showLoader = useCappedLoading(loading, 3000)

  useEffect(() => {
    let mounted = true

    const loadBranches = async () => {
      try {
        const response = await getSedes({ limit: 20 })
        if (!mounted) {
          return
        }

        const source = getBranchCollection(response?.data)
        if (source.length > 0) {
          setBranches(source.map((item, index) => mapBranchFromApi(item, index)))
        }

        if (response?.message) {
          setSyncNotice(response.message)
        }
      } catch (error) {
        if (mounted) {
          setSyncNotice(error?.message || 'Backend no disponible para sedes. Visualizando datos de respaldo.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadBranches()

    return () => {
      mounted = false
    }
  }, [])

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return branches
    }

    return branches.filter((item) => `${item.name} ${item.address} ${item.specialization}`.toLowerCase().includes(query))
  }, [branches, search])

  const geolocatedBranches = useMemo(() => filteredBranches.filter((branch) => hasValidCoordinates(branch)), [filteredBranches])

  const selectedBranch = useMemo(
    () => geolocatedBranches.find((branch) => String(branch.id) === String(selectedBranchId)) || null,
    [geolocatedBranches, selectedBranchId],
  )

  const mapCenter = selectedBranch
    ? [selectedBranch.latitude, selectedBranch.longitude]
    : geolocatedBranches.length > 0
      ? [geolocatedBranches[0].latitude, geolocatedBranches[0].longitude]
      : DEFAULT_CENTER

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const handleFormChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const buildCreatePayload = (source) => ({
    nombre: source.name,
    especialidad: source.specialty,
    direccion: source.address,
    telefono: source.phone,
    capacidad: Number(source.capacity || 0),
    latitude: toCoordinateNumber(source.latitude),
    longitude: toCoordinateNumber(source.longitude),
  })

  const createBranchWithPayload = async (source, successMessage) => {
    if (!source.name.trim() || !source.address.trim() || !source.specialty.trim()) {
      setSyncNotice('Completa nombre, direccion y especialidad para registrar la sede.')
      return false
    }

    const payload = buildCreatePayload(source)

    if (payload.latitude === null || payload.longitude === null) {
      setSyncNotice('Debes ingresar latitud y longitud validas para ubicar la sede en el mapa.')
      return false
    }

    try {
      const created = await createSede(payload)
      const createdPayload = created?.data || created
      const branch = mapBranchFromApi(createdPayload, 0)
      setBranches((previous) => [branch, ...previous])
      setSelectedBranchId(branch.id)
      setSyncNotice(created?.message || successMessage || 'Sede registrada en backend correctamente.')
      return true
    } catch (error) {
      const status = Number(error?.status || 0)

      if (status === 400 || status === 404 || status === 409 || status === 500) {
        setSyncNotice(error.message)
        return false
      }

      const localBranch = {
        id: `SED-LOCAL-${Date.now()}`,
        name: source.name,
        address: source.address,
        phone: source.phone || '(000) 000-0000',
        specialization: source.specialty.toUpperCase(),
        team: Number(source.capacity || 0),
        latitude: payload.latitude,
        longitude: payload.longitude,
        icon: 'domain',
      }
      setBranches((previous) => [localBranch, ...previous])
      setSelectedBranchId(localBranch.id)
      setSyncNotice(error?.message || 'Sede registrada en modo local. Lista para conectar al endpoint cuando este disponible.')
      return true
    }
  }

  const handleRegisterBranch = async () => {
    setSaving(true)
    setSyncNotice('')

    const ok = await createBranchWithPayload(formData, 'Sede registrada en backend correctamente.')

    if (ok) {
      setFormData(EMPTY_FORM)
    }

    setSaving(false)
  }

  const handleMapDraftChange = (field, value) => {
    setMapDraft((previous) => ({ ...previous, [field]: value }))
  }

  const resolveAddressFromCoordinates = async (lat, lng) => {
    const endpoint = new URL('https://nominatim.openstreetmap.org/reverse')
    endpoint.searchParams.set('format', 'jsonv2')
    endpoint.searchParams.set('lat', String(lat))
    endpoint.searchParams.set('lon', String(lng))
    endpoint.searchParams.set('zoom', '18')
    endpoint.searchParams.set('addressdetails', '1')

    const response = await fetch(endpoint.toString(), {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'es',
      },
    })

    if (!response.ok) {
      throw new Error('No se pudo resolver direccion desde el mapa.')
    }

    const payload = await response.json()
    return typeof payload?.display_name === 'string' && payload.display_name.trim()
      ? payload.display_name
      : null
  }

  const handleMapPick = async (lat, lng) => {
    const fallbackAddress = buildApproxAddress(lat, lng)

    setMapDraft({
      name: '',
      specialty: 'Medicina General',
      address: fallbackAddress,
      phone: '',
      capacity: '',
      latitude: String(lat.toFixed(6)),
      longitude: String(lng.toFixed(6)),
    })
    setMapModalOpen(true)

    const requestId = reverseLookupRequestIdRef.current + 1
    reverseLookupRequestIdRef.current = requestId
    setMapLookupLoading(true)

    try {
      const resolvedAddress = await resolveAddressFromCoordinates(lat, lng)
      if (reverseLookupRequestIdRef.current !== requestId) {
        return
      }

      if (resolvedAddress) {
        setMapDraft((previous) => ({ ...previous, address: resolvedAddress }))
      }
    } catch {
      if (reverseLookupRequestIdRef.current !== requestId) {
        return
      }

      setMapDraft((previous) => ({
        ...previous,
        address: previous.address?.trim() ? previous.address : fallbackAddress,
      }))
    } finally {
      if (reverseLookupRequestIdRef.current === requestId) {
        setMapLookupLoading(false)
      }
    }
  }

  const handleRegisterFromMap = async () => {
    setSaving(true)
    setSyncNotice('')

    const ok = await createBranchWithPayload(mapDraft, 'Sede agregada desde el mapa correctamente.')

    if (ok) {
      setMapModalOpen(false)
      setCreationMode('manual')
      setMapLookupLoading(false)
      setMapDraft({
        name: '',
        specialty: 'Medicina General',
        address: '',
        phone: '',
        capacity: '',
        latitude: '',
        longitude: '',
      })
    }

    setSaving(false)
  }

  const startEditBranch = (branch) => {
    setEditingId(branch.id)
    setEditDraft({
      name: branch.name,
      address: branch.address,
      specialty: branch.specialization,
      phone: branch.phone,
      capacity: String(branch.team || ''),
      latitude: String(branch.latitude ?? ''),
      longitude: String(branch.longitude ?? ''),
    })
    setSelectedBranchId(branch.id)
    setMapZoom(14)
  }

  const cancelEditBranch = () => {
    setEditingId('')
    setEditDraft({
      name: '',
      address: '',
      specialty: '',
      phone: '',
      capacity: '',
      latitude: '',
      longitude: '',
    })
  }

  const handleEditDraftChange = (field, value) => {
    setEditDraft((previous) => ({ ...previous, [field]: value }))
  }

  const handleSaveBranch = async (branch) => {
    const payload = {}

    if (editDraft.name.trim() && editDraft.name.trim() !== branch.name) {
      payload.nombre = editDraft.name.trim()
    }
    if (editDraft.address.trim() && editDraft.address.trim() !== branch.address) {
      payload.direccion = editDraft.address.trim()
    }
    if (editDraft.specialty.trim() && editDraft.specialty.trim().toUpperCase() !== branch.specialization.toUpperCase()) {
      payload.especialidad = editDraft.specialty.trim()
    }
    if ((editDraft.phone || '').trim() !== (branch.phone || '').trim()) {
      payload.telefono = editDraft.phone.trim()
    }

    const normalizedCapacity = Number(editDraft.capacity || 0)
    if (!Number.isNaN(normalizedCapacity) && normalizedCapacity !== Number(branch.team || 0)) {
      payload.capacidad = normalizedCapacity
    }

    const normalizedLatitude = toCoordinateNumber(editDraft.latitude)
    if (normalizedLatitude !== null && normalizedLatitude !== branch.latitude) {
      payload.latitude = normalizedLatitude
    }

    const normalizedLongitude = toCoordinateNumber(editDraft.longitude)
    if (normalizedLongitude !== null && normalizedLongitude !== branch.longitude) {
      payload.longitude = normalizedLongitude
    }

    if (Object.keys(payload).length === 0) {
      setSyncNotice('No hay cambios para guardar en la sede seleccionada.')
      cancelEditBranch()
      return
    }

    setUpdatingId(branch.id)
    setSyncNotice('')

    try {
      const response = await updateSede(branch.id, payload)
      const updated = mapBranchFromApi(response?.data || response, 0)

      setBranches((previous) => previous.map((item) => (item.id === branch.id ? { ...item, ...updated } : item)))
      setSyncNotice(response?.message || 'Sede actualizada correctamente.')
      cancelEditBranch()
    } catch (error) {
      setSyncNotice(error?.message || 'No se pudo actualizar la sede seleccionada.')
    } finally {
      setUpdatingId('')
    }
  }

  const handleDeleteBranch = async (branch) => {
    const confirmed = globalThis.confirm(`Deseas eliminar la sede ${branch.name}?`)
    if (!confirmed) {
      return
    }

    setDeletingId(branch.id)
    setSyncNotice('')

    try {
      const response = await deleteSede(branch.id)
      setBranches((previous) => previous.filter((item) => item.id !== branch.id))
      setSyncNotice(response?.message || 'Sede eliminada correctamente.')
      if (editingId === branch.id) {
        cancelEditBranch()
      }
      if (String(selectedBranchId) === String(branch.id)) {
        setSelectedBranchId(null)
      }
    } catch (error) {
      const localBranch = String(branch.id).startsWith('SED-LOCAL-')

      if (localBranch) {
        setBranches((previous) => previous.filter((item) => item.id !== branch.id))
        setSyncNotice('Sede local eliminada correctamente.')
        if (editingId === branch.id) {
          cancelEditBranch()
        }
        if (String(selectedBranchId) === String(branch.id)) {
          setSelectedBranchId(null)
        }
      } else {
        setSyncNotice(error?.message || 'No se pudo eliminar la sede seleccionada.')
      }
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="admin-branches-shell">
      <PageLoadingOverlay visible={showLoader} message="Cargando sedes..." />
      <aside className="branches-side">
        <MedigoSidebarBrand
          containerClassName="branches-brand"
          logoContainerClassName="branches-brand-icon"
          title="MediGo Admin"
          subtitle="CLINICAL PRECISION"
        />

        <nav className="branches-nav" aria-label="Navegacion administrador">
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.AUCTIONS)}>
            <span className="material-symbols-outlined">gavel</span>
            {' '}Subastas
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.INVENTORY)}>
            <span className="material-symbols-outlined">inventory_2</span>
            {' '}Inventario
          </button>
          <button type="button" className="active" onClick={() => navigate(ROUTES.ADMIN.BRANCHES)}>
            <span className="material-symbols-outlined">account_tree</span>
            {' '}Sedes
          </button>
          <button type="button" onClick={() => navigate(ROUTES.ADMIN.USERS)}>
            <span className="material-symbols-outlined">group</span>
            {' '}Usuarios
          </button>
        </nav>

        <div className="branches-side-bottom">
          <button type="button" className="new-income-btn">
            <span className="material-symbols-outlined">add</span>
            {' '}Nuevo Ingreso
          </button>

          <button type="button" className="side-link">
            <span className="material-symbols-outlined">help</span>
            {' '}Soporte
          </button>

          <button type="button" className="side-link danger" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            {' '}Cerrar Sesion
          </button>
        </div>
      </aside>

      <main className="branches-main">
        <header className="branches-topbar">
          <label className="branches-search" aria-label="Buscar sedes">
            <span className="material-symbols-outlined">search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar sedes..." />
          </label>

          <div className="branches-top-right">
            <button type="button" className="icon-btn" aria-label="Notificaciones">
              <span className="material-symbols-outlined">notifications</span>
              <i />
            </button>
            <button type="button" className="icon-btn" aria-label="Configuracion">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="top-separator" />
            <div className="top-profile">
              <div>
                <strong>Admin User</strong>
                <small>Administrator</small>
              </div>
              <div className="profile-image-placeholder" aria-label="Placeholder de imagen de administrador">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        <section className="branches-content">
          <div className="branches-header-row">
            <div>
              <h2>Sucursales</h2>
              <p>
                Administre la red de sedes de la EPS, instalaciones clinicas y sucursales medicas estrategicas en todo
                el territorio.
              </p>
            </div>

            <button type="button" className="export-network-btn">
              <span className="material-symbols-outlined">download</span>
              Exportar Red
            </button>
          </div>

          {syncNotice ? <p className="branches-notice">{syncNotice}</p> : null}

          <div className="branches-grid">
            <div className="left-column">
              <article className="register-card">
                <header>
                  <h3>Agregar Nueva Sede</h3>
                  <p>Registrar por formulario o seleccionando ubicacion en el mapa</p>
                </header>

                <div className="creation-mode-switch" role="tablist" aria-label="Modo de creacion de sede">
                  <button
                    type="button"
                    className={creationMode === 'manual' ? 'active' : ''}
                    onClick={() => setCreationMode('manual')}
                  >
                    Formulario manual
                  </button>
                  <button
                    type="button"
                    className={creationMode === 'map' ? 'active' : ''}
                    onClick={() => setCreationMode('map')}
                  >
                    Clic en mapa
                  </button>
                </div>

                {creationMode === 'map' ? (
                  <div className="map-pick-helper">
                    <strong>Modo mapa activo</strong>
                    <p>Haz clic en el mapa para fijar ubicacion y abrir el formulario de datos faltantes.</p>
                  </div>
                ) : null}

                <form className="register-form" onSubmit={(event) => event.preventDefault()}>
                  <label>
                    <span>NOMBRE DE LA SEDE</span>
                    <input
                      value={formData.name}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      placeholder="ej. MediGo Norte Central"
                    />
                  </label>

                  <label>
                    <span>ESPECIALIDAD CLINICA</span>
                    <select value={formData.specialty} onChange={(event) => handleFormChange('specialty', event.target.value)}>
                      <option>Medicina General</option>
                      <option>Pediatria y Maternidad</option>
                      <option>Centro Quirurgico</option>
                      <option>Imagenes Diagnosticas</option>
                    </select>
                  </label>

                  <label>
                    <span>DIRECCION FISICA</span>
                    <div className="field-with-icon">
                      <span className="material-symbols-outlined">location_on</span>
                      <input
                        value={formData.address}
                        onChange={(event) => handleFormChange('address', event.target.value)}
                        placeholder="Calle 45 #12-88, Distrito Medico"
                      />
                    </div>
                  </label>

                  <div className="form-row-split">
                    <label>
                      <span>TELEFONO DE CONTACTO</span>
                      <input
                        value={formData.phone}
                        onChange={(event) => handleFormChange('phone', event.target.value)}
                        placeholder="+57 (601) 000-0000"
                      />
                    </label>

                    <label>
                      <span>CAPACIDAD</span>
                      <input
                        value={formData.capacity}
                        onChange={(event) => handleFormChange('capacity', event.target.value)}
                        placeholder="Camas/Unidades"
                        type="number"
                      />
                    </label>
                  </div>

                  <div className="form-row-split">
                    <label>
                      <span>LATITUD</span>
                      <input
                        value={formData.latitude}
                        onChange={(event) => handleFormChange('latitude', event.target.value)}
                        placeholder="4.7110"
                        type="number"
                        step="0.000001"
                      />
                    </label>

                    <label>
                      <span>LONGITUD</span>
                      <input
                        value={formData.longitude}
                        onChange={(event) => handleFormChange('longitude', event.target.value)}
                        placeholder="-74.0721"
                        type="number"
                        step="0.000001"
                      />
                    </label>
                  </div>

                  <button type="button" className="confirm-btn" onClick={handleRegisterBranch} disabled={saving}>
                    <span className="material-symbols-outlined">domain_add</span>
                    {' '}{saving ? 'Guardando...' : 'Confirmar Registro de Sede'}
                  </button>
                </form>
              </article>

              <article className="network-card">
                <div className="network-head">
                  <span className="material-symbols-outlined">hub</span>
                  <small>RED EN VIVO</small>
                </div>
                <strong>{branches.length} Activas</strong>
                <p>Instalaciones clinicas registradas</p>
              </article>
            </div>

            <div className="right-column">
              <article className="map-panel" aria-label="Mapa de sedes">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  className={`branches-map ${creationMode === 'map' ? 'pick-mode' : ''}`}
                  scrollWheelZoom
                  attributionControl={false}
                >
                  <MapViewportController center={mapCenter} zoom={mapZoom} />
                  <MapClickCapture enabled={creationMode === 'map'} onPick={handleMapPick} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {geolocatedBranches.map((branch) => (
                    <CircleMarker
                      key={branch.id}
                      center={[branch.latitude, branch.longitude]}
                      radius={String(selectedBranchId) === String(branch.id) ? 10 : 8}
                      pathOptions={{
                        color: '#003358',
                        weight: 2,
                        fillColor: String(selectedBranchId) === String(branch.id) ? '#00a3bf' : '#0f5f95',
                        fillOpacity: 0.8,
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedBranchId(branch.id)
                          setMapZoom(14)
                        },
                      }}
                    >
                      <Popup>
                        <strong>{branch.name}</strong>
                        <br />
                        {branch.address}
                        <br />
                        Lat: {Number(branch.latitude).toFixed(5)} | Lng: {Number(branch.longitude).toFixed(5)}
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                <div className="map-live-tag">
                  <i />
                  {' '}Sedes geolocalizadas: {geolocatedBranches.length}/{filteredBranches.length}
                </div>

                {creationMode === 'map' ? (
                  <div className="map-mode-indicator">
                    <span className="material-symbols-outlined">touch_app</span>
                    {' '}Selecciona un punto en el mapa para crear sede
                  </div>
                ) : null}

                <div className="map-zoom-actions">
                  <button type="button" aria-label="Acercar" onClick={() => setMapZoom((prev) => Math.min(prev + 1, 18))}>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  <button type="button" aria-label="Alejar" onClick={() => setMapZoom((prev) => Math.max(prev - 1, 4))}>
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                </div>
              </article>

              <section className="directory-panel" aria-label="Directorio de sedes">
                <div className="directory-head">
                  <h3>Directorio de Sedes</h3>
                  <button type="button">
                    Ver Reportes Detallados{' '}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>

                <div className="directory-list">
                  {filteredBranches.map((branch) => (
                    <article
                      key={branch.id}
                      className={`branch-item ${String(selectedBranchId) === String(branch.id) ? 'selected' : ''}`}
                      onClick={() => {
                        if (hasValidCoordinates(branch)) {
                          setSelectedBranchId(branch.id)
                          setMapZoom(14)
                        }
                      }}
                    >
                      <div className="branch-main">
                        <div className="branch-icon">
                          <span className="material-symbols-outlined">{branch.icon}</span>
                        </div>
                        <div>
                          {editingId === branch.id ? (
                            <input
                              className="branch-inline-input"
                              value={editDraft.name}
                              onChange={(event) => handleEditDraftChange('name', event.target.value)}
                              placeholder="Nombre"
                            />
                          ) : (
                            <h4>{branch.name}</h4>
                          )}
                          <div className="branch-meta">
                            <span>
                              <span className="material-symbols-outlined">location_on</span>
                              {editingId === branch.id ? (
                                <input
                                  className="branch-inline-input"
                                  value={editDraft.address}
                                  onChange={(event) => handleEditDraftChange('address', event.target.value)}
                                  placeholder="Direccion"
                                />
                              ) : (
                                branch.address
                              )}
                            </span>
                            <span>
                              <span className="material-symbols-outlined">call</span>
                              {editingId === branch.id ? (
                                <input
                                  className="branch-inline-input"
                                  value={editDraft.phone}
                                  onChange={(event) => handleEditDraftChange('phone', event.target.value)}
                                  placeholder="Telefono"
                                />
                              ) : (
                                branch.phone
                              )}
                            </span>
                            {hasValidCoordinates(branch) ? (
                              <span>
                                <span className="material-symbols-outlined">my_location</span>
                                {Number(branch.latitude).toFixed(4)}, {Number(branch.longitude).toFixed(4)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="branch-side">
                        {editingId === branch.id ? (
                          <>
                            <input
                              className="branch-inline-input branch-inline-small"
                              value={editDraft.specialty}
                              onChange={(event) => handleEditDraftChange('specialty', event.target.value)}
                              placeholder="Especialidad"
                            />
                            <input
                              className="branch-inline-input branch-inline-small"
                              value={editDraft.capacity}
                              onChange={(event) => handleEditDraftChange('capacity', event.target.value)}
                              placeholder="Capacidad"
                              type="number"
                            />
                            <input
                              className="branch-inline-input branch-inline-small"
                              value={editDraft.latitude}
                              onChange={(event) => handleEditDraftChange('latitude', event.target.value)}
                              placeholder="Latitud"
                              type="number"
                              step="0.000001"
                            />
                            <input
                              className="branch-inline-input branch-inline-small"
                              value={editDraft.longitude}
                              onChange={(event) => handleEditDraftChange('longitude', event.target.value)}
                              placeholder="Longitud"
                              type="number"
                              step="0.000001"
                            />
                          </>
                        ) : (
                          <>
                            <span>{branch.specialization}</span>
                            <small>{branch.team} Miembros del personal</small>
                          </>
                        )}
                      </div>

                      <div className="branch-actions">
                        {editingId === branch.id ? (
                          <>
                            <button
                              type="button"
                              className="branch-action-btn primary"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleSaveBranch(branch)
                              }}
                              disabled={updatingId === branch.id}
                            >
                              {updatingId === branch.id ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className="branch-action-btn"
                              onClick={(event) => {
                                event.stopPropagation()
                                cancelEditBranch()
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="branch-action-btn"
                              onClick={(event) => {
                                event.stopPropagation()
                                startEditBranch(branch)
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="branch-action-btn danger"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleDeleteBranch(branch)
                              }}
                              disabled={deletingId === branch.id}
                            >
                              {deletingId === branch.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {filteredBranches.length === 0 ? <p className="empty-branches">No hay sedes que coincidan con "{search}".</p> : null}
              </section>
            </div>
          </div>
        </section>

        <footer className="branches-footer">
          <div>
            <span>ESTADO DE LA RED: OPTIMO</span>
            {' '}<i />{' '}
            <span>VERSION BD: 4.0.2-CLINICAL</span>
          </div>
          <small>© 2024 MediGo Systems - Todos los derechos reservados</small>
        </footer>
      </main>

      {mapModalOpen ? (
        <div className="map-create-modal-backdrop" role="presentation" onClick={() => setMapModalOpen(false)}>
          <section
            className="map-create-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Completar datos de nueva sede"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h3>Nueva sede desde mapa</h3>
              <p>Completa los datos clinicos. La ubicacion ya fue tomada del mapa.</p>
              {mapLookupLoading ? <small>Buscando direccion sugerida...</small> : null}
            </header>

            <div className="map-create-grid">
              <label>
                <span>NOMBRE</span>
                <input value={mapDraft.name} onChange={(event) => handleMapDraftChange('name', event.target.value)} />
              </label>

              <label>
                <span>ESPECIALIDAD</span>
                <select value={mapDraft.specialty} onChange={(event) => handleMapDraftChange('specialty', event.target.value)}>
                  <option>Medicina General</option>
                  <option>Pediatria y Maternidad</option>
                  <option>Centro Quirurgico</option>
                  <option>Imagenes Diagnosticas</option>
                </select>
              </label>

              <label className="full">
                <span>DIRECCION</span>
                <input value={mapDraft.address} onChange={(event) => handleMapDraftChange('address', event.target.value)} />
              </label>

              <label>
                <span>TELEFONO</span>
                <input value={mapDraft.phone} onChange={(event) => handleMapDraftChange('phone', event.target.value)} />
              </label>

              <label>
                <span>CAPACIDAD</span>
                <input
                  type="number"
                  value={mapDraft.capacity}
                  onChange={(event) => handleMapDraftChange('capacity', event.target.value)}
                />
              </label>

              <label>
                <span>LATITUD</span>
                <input value={mapDraft.latitude} readOnly />
              </label>

              <label>
                <span>LONGITUD</span>
                <input value={mapDraft.longitude} readOnly />
              </label>
            </div>

            <div className="map-create-actions">
              <button type="button" className="branch-action-btn" onClick={() => setMapModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="branch-action-btn primary" onClick={handleRegisterFromMap} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar sede'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {loading ? <div className="branches-loading">Sincronizando sedes...</div> : null}
    </div>
  )
}
