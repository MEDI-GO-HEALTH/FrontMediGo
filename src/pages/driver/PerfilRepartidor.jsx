import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  getDriverProfile,
  updateDriverAvailability,
  updateDriverProfile,
} from '../../api/driverProfileService'
import MedigoSidebarBrand from '../../components/common/MedigoSidebarBrand'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/driver/perfil-repartidor.css'

const FALLBACK_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  vehicleType: '',
  vehiclePlate: '',
  licenseNumber: '',
  city: '',
  notes: '',
  certifications: [],
  metrics: {
    rating: 0,
    trips: 0,
    completionRate: 0,
    availability: 'offline',
  },
}

export default function PerfilRepartidor() {
  const navigate = useNavigate()
  const [form, setForm] = useState(FALLBACK_PROFILE)
  const [initialForm, setInitialForm] = useState(FALLBACK_PROFILE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const showLoader = useCappedLoading(loading, 3000)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setLoading(true)
      try {
        const profileResponse = await getDriverProfile()
        if (!mounted) {
          return
        }

        const merged = {
          ...FALLBACK_PROFILE,
          ...(profileResponse ?? {}),
          metrics: {
            ...FALLBACK_PROFILE.metrics,
            ...(profileResponse?.metrics ?? {}),
          },
          certifications: Array.isArray(profileResponse?.certifications)
            ? profileResponse.certifications
            : FALLBACK_PROFILE.certifications,
        }

        setForm(merged)
        setInitialForm(merged)
      } catch {
        if (!mounted) {
          return
        }

        setForm(FALLBACK_PROFILE)
        setInitialForm(FALLBACK_PROFILE)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const initials = useMemo(() => {
    const first = form.firstName?.[0] ?? ''
    const last = form.lastName?.[0] ?? ''
    return `${first}${last}`.toUpperCase() || 'DR'
  }, [form.firstName, form.lastName])

  const fullName = useMemo(() => `${form.firstName} ${form.lastName}`.trim(), [form.firstName, form.lastName])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setForm(initialForm)
    setMessage('Cambios descartados.')
    setError('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      await updateDriverProfile(form)

      if (form.metrics?.availability && form.metrics.availability !== initialForm.metrics?.availability) {
        await updateDriverAvailability({ availability: form.metrics.availability })
      }

      setInitialForm(form)
      setMessage('Perfil actualizado correctamente.')
    } catch {
      setError('No fue posible guardar en backend. Los cambios permanecen visibles en modo local.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('medigo_token')
    localStorage.removeItem('medigo_user')
    navigate('/')
  }

  return (
    <div className="driver-profile-page">
      <PageLoadingOverlay visible={showLoader} message="Cargando perfil del repartidor..." />
      <div className="driver-profile-shell">
        <aside className="driver-profile-sidebar" aria-label="Navegacion repartidor">
          <div className="driver-profile-side-head">
            <MedigoSidebarBrand
              containerClassName="driver-profile-side-brand"
              logoContainerClassName="driver-profile-side-logo"
              textContainerClassName="driver-profile-side-brand-text"
              title="Driver Portal"
              subtitle="Clinical Logistics Unit"
            />
          </div>

          <nav className="driver-profile-nav">
            <button type="button" onClick={() => navigate('/repartidor/mapa')}>
              <span className="material-symbols-outlined">map</span>
              Mapa de Entregas
            </button>

            <button type="button" onClick={() => navigate('/repartidor/historial')}>
              <span className="material-symbols-outlined">history</span>
              Historial de Viajes
            </button>

            <button type="button" className="active">
              <span className="material-symbols-outlined">person</span>
              Configuracion de Perfil
            </button>
          </nav>

          <div className="driver-profile-side-footer">
            <button type="button" className="driver-profile-side-link">
              <span className="material-symbols-outlined">help</span>
              Help
            </button>

            <button type="button" className="driver-profile-side-link danger" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="driver-profile-main">
          <header className="driver-profile-topbar">
            <h2>MediGo Clinical Logistics</h2>
            <div className="driver-profile-topbar-right">
              <div className="driver-profile-online">
                <span />
                <span>{form.metrics?.availability === 'offline' ? 'Offline' : 'Online'}</span>
              </div>
              <div className="driver-profile-avatar-small">{initials}</div>
            </div>
          </header>

          <div className="driver-profile-content">
            <h3 className="driver-profile-title">Configuracion de Perfil</h3>
            <p className="driver-profile-subtitle">
              Administra tus datos personales y operativos. Esta vista esta preparada para conectarse a endpoints reales en futuras iteraciones.
            </p>

            <div className="driver-profile-grid">
              <aside className="driver-profile-card">
                <div className="driver-profile-avatar-lg" aria-label="Avatar por defecto del repartidor">
                  {initials}
                </div>
                <h3>{fullName || 'Repartidor'}</h3>
                <p>{form.email}</p>

                <div className="driver-profile-badges">
                  {(form.certifications ?? []).map((badge) => (
                    <span key={badge} className="driver-profile-badge">
                      {badge}
                    </span>
                  ))}
                </div>

                <div className="driver-profile-metrics">
                  <div className="driver-profile-metric">
                    <small>Calificacion</small>
                    <strong>{form.metrics?.rating}</strong>
                  </div>
                  <div className="driver-profile-metric">
                    <small>Viajes</small>
                    <strong>{form.metrics?.trips}</strong>
                  </div>
                  <div className="driver-profile-metric">
                    <small>Eficiencia</small>
                    <strong>{form.metrics?.completionRate}%</strong>
                  </div>
                  <div className="driver-profile-metric">
                    <small>Estado</small>
                    <strong>{form.metrics?.availability === 'offline' ? 'Offline' : 'Online'}</strong>
                  </div>
                </div>
              </aside>

              <section className="driver-profile-form">
                <h4>{loading ? 'Cargando perfil...' : 'Datos del Repartidor'}</h4>

                <form onSubmit={handleSave}>
                  <div className="driver-form-grid">
                    <label className="driver-form-field">
                      <span>Nombre</span>
                      <input name="firstName" value={form.firstName} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field">
                      <span>Apellido</span>
                      <input name="lastName" value={form.lastName} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field full">
                      <span>Correo</span>
                      <input name="email" type="email" value={form.email} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field">
                      <span>Telefono</span>
                      <input name="phone" value={form.phone} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field">
                      <span>Ciudad</span>
                      <input name="city" value={form.city} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field">
                      <span>Tipo de vehiculo</span>
                      <input name="vehicleType" value={form.vehicleType} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field">
                      <span>Placa</span>
                      <input name="vehiclePlate" value={form.vehiclePlate} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field full">
                      <span>Licencia</span>
                      <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
                    </label>

                    <label className="driver-form-field full">
                      <span>Disponibilidad</span>
                      <select
                        value={form.metrics?.availability ?? 'online'}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            metrics: {
                              ...prev.metrics,
                              availability: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </label>

                    <label className="driver-form-field full">
                      <span>Notas operativas</span>
                      <textarea name="notes" value={form.notes} onChange={handleChange} />
                    </label>
                  </div>

                  <div className="driver-form-actions">
                    <button type="button" className="driver-btn-ghost" onClick={handleReset} disabled={saving}>
                      Descartar
                    </button>
                    <button type="submit" className="driver-btn-primary" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>

                  {error ? <p className="driver-profile-error">{error}</p> : null}
                  {message ? <p className="driver-profile-success">{message}</p> : null}
                </form>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
