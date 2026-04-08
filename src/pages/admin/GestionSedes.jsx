import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { createSede, deleteSede, getSedes, updateSede } from '../../api/sedesService'
import { ROUTES } from '../../constants/routes'
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
}

const mapBranchFromApi = (item, index) => ({
  id: item?.id || item?.codigo || `SED-${String(index + 1).padStart(3, '0')}`,
  name: item?.nombre || item?.name || 'Nueva Sede',
  address: item?.direccion || item?.address || 'Direccion por confirmar',
  phone: item?.telefono || item?.phone || '(000) 000-0000',
  specialization: String(item?.especialidad || item?.specialization || 'GENERAL').toUpperCase(),
  team: Number(item?.miembros || item?.personal || item?.team || 0),
  icon: item?.icon || 'apartment',
})

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
  })
  const [syncNotice, setSyncNotice] = useState('')
  const [loading, setLoading] = useState(true)

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

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate(ROUTES.AUTH.LOGIN, { replace: true })
  }

  const handleFormChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const handleRegisterBranch = async () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.specialty.trim()) {
      setSyncNotice('Completa nombre, direccion y especialidad para registrar la sede.')
      return
    }

    setSaving(true)
    setSyncNotice('')

    const payload = {
      nombre: formData.name,
      especialidad: formData.specialty,
      direccion: formData.address,
      telefono: formData.phone,
      capacidad: Number(formData.capacity || 0),
    }

    try {
      const created = await createSede(payload)
      const createdPayload = created?.data || created
      const branch = mapBranchFromApi(createdPayload, 0)
      setBranches((previous) => [branch, ...previous])
      setFormData(EMPTY_FORM)
      setSyncNotice(created?.message || 'Sede registrada en backend correctamente.')
    } catch (error) {
      const status = Number(error?.status || 0)

      if (status === 400 || status === 404 || status === 409 || status === 500) {
        setSyncNotice(error.message)
        return
      }

      const localBranch = {
        id: `SED-LOCAL-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        phone: formData.phone || '(000) 000-0000',
        specialization: formData.specialty.toUpperCase(),
        team: Number(formData.capacity || 0),
        icon: 'domain',
      }
      setBranches((previous) => [localBranch, ...previous])
      setFormData(EMPTY_FORM)
      setSyncNotice(error?.message || 'Sede registrada en modo local. Lista para conectar al endpoint cuando este disponible.')
    } finally {
      setSaving(false)
    }
  }

  const startEditBranch = (branch) => {
    setEditingId(branch.id)
    setEditDraft({
      name: branch.name,
      address: branch.address,
      specialty: branch.specialization,
      phone: branch.phone,
      capacity: String(branch.team || ''),
    })
  }

  const cancelEditBranch = () => {
    setEditingId('')
    setEditDraft({
      name: '',
      address: '',
      specialty: '',
      phone: '',
      capacity: '',
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
    } catch (error) {
      const localBranch = String(branch.id).startsWith('SED-LOCAL-')

      if (localBranch) {
        setBranches((previous) => previous.filter((item) => item.id !== branch.id))
        setSyncNotice('Sede local eliminada correctamente.')
        if (editingId === branch.id) {
          cancelEditBranch()
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
      <aside className="branches-side">
        <div className="branches-brand">
          <div className="branches-brand-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
          </div>
          <div>
            <h1>MediGo Admin</h1>
            <p>CLINICAL PRECISION</p>
          </div>
        </div>

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
                  <p>Registrar una nueva instalacion clinica</p>
                </header>

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
                <div className="map-surface" aria-hidden="true">
                  <div className="map-noise" />
                  <div className="map-glow" />
                  <div className="map-grid" />
                </div>

                <div className="map-live-tag">
                  <i />
                  {' '}Cobertura de Red en Vivo: 94%
                </div>

                <div className="map-zoom-actions">
                  <button type="button" aria-label="Acercar">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  <button type="button" aria-label="Alejar">
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
                    <article key={branch.id} className="branch-item">
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
                              onClick={() => handleSaveBranch(branch)}
                              disabled={updatingId === branch.id}
                            >
                              {updatingId === branch.id ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" className="branch-action-btn" onClick={cancelEditBranch}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="branch-action-btn" onClick={() => startEditBranch(branch)}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="branch-action-btn danger"
                              onClick={() => handleDeleteBranch(branch)}
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

      {loading ? <div className="branches-loading">Sincronizando sedes...</div> : null}
    </div>
  )
}
