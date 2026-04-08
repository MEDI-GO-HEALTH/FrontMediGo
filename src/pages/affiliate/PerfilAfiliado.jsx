import { useEffect, useMemo, useState } from 'react'
import {
  createAffiliatePaymentMethod,
  deleteAffiliatePaymentMethod,
  getAffiliateAccountStatus,
  getAffiliatePaymentMethods,
  getAffiliatePreferences,
  getAffiliateProfile,
  updateAffiliatePreferences,
  updateAffiliateProfile,
} from '../../api/affiliateProfileService'
import PageLoadingOverlay from '../../components/common/PageLoadingOverlay'
import AffiliateShell from '../../components/layout/AffiliateShell'
import useCappedLoading from '../../hooks/useCappedLoading'
import '../../styles/affiliate/perfil-afiliado.css'

const FALLBACK_PROFILE = {
  fullName: 'Dr. Alejandro Ramirez',
  email: 'a.ramirez@clinica-central.es',
  organizationName: 'Farmacia Central Sanitas',
  professionalId: 'ES-98234-PH',
}

const FALLBACK_ACCOUNT_STATUS = {
  statusLabel: 'Verificado',
  statusDescription: 'Su cuenta cumple con los estandares regulatorios para logistica clinica nivel A1.',
}

const FALLBACK_PREFERENCES = {
  pushNotifications: true,
  monthlyReports: false,
  emergencySms: true,
  twoFactorEnabled: true,
}

const FALLBACK_PAYMENT_METHODS = [
  {
    id: 'pm-visa-4242',
    brand: 'VISA',
    brandType: 'visa',
    label: 'Visa que termina en 4242',
    expiry: '12/25',
    isDefault: true,
  },
  {
    id: 'pm-mc-8890',
    brand: 'MC',
    brandType: 'mc',
    label: 'Mastercard que termina en 8890',
    expiry: '08/24',
    isDefault: false,
  },
]

export default function PerfilAfiliado() {
  const [profile, setProfile] = useState(FALLBACK_PROFILE)
  const [preferences, setPreferences] = useState(FALLBACK_PREFERENCES)
  const [paymentMethods, setPaymentMethods] = useState(FALLBACK_PAYMENT_METHODS)
  const [accountStatus, setAccountStatus] = useState(FALLBACK_ACCOUNT_STATUS)
  const [initialState, setInitialState] = useState({
    profile: FALLBACK_PROFILE,
    preferences: FALLBACK_PREFERENCES,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const showLoader = useCappedLoading(loading, 3000)

  useEffect(() => {
    let mounted = true

    const loadAffiliateProfileScreen = async () => {
      try {
        const [profileResponse, paymentsResponse, preferencesResponse, statusResponse] = await Promise.all([
          getAffiliateProfile(),
          getAffiliatePaymentMethods(),
          getAffiliatePreferences(),
          getAffiliateAccountStatus(),
        ])

        if (!mounted) {
          return
        }

        const mergedProfile = {
          ...FALLBACK_PROFILE,
          ...(profileResponse ?? {}),
        }

        const mergedPreferences = {
          ...FALLBACK_PREFERENCES,
          ...(preferencesResponse ?? {}),
        }

        const mappedPayments = Array.isArray(paymentsResponse?.items)
          ? paymentsResponse.items
          : Array.isArray(paymentsResponse)
            ? paymentsResponse
            : FALLBACK_PAYMENT_METHODS

        setProfile(mergedProfile)
        setPreferences(mergedPreferences)
        setPaymentMethods(mappedPayments)
        setAccountStatus({
          ...FALLBACK_ACCOUNT_STATUS,
          ...(statusResponse ?? {}),
        })
        setInitialState({
          profile: mergedProfile,
          preferences: mergedPreferences,
        })
      } catch {
        if (!mounted) {
          return
        }

        setProfile(FALLBACK_PROFILE)
        setPreferences(FALLBACK_PREFERENCES)
        setPaymentMethods(FALLBACK_PAYMENT_METHODS)
        setAccountStatus(FALLBACK_ACCOUNT_STATUS)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAffiliateProfileScreen()

    return () => {
      mounted = false
    }
  }, [])

  const affiliateInitials = useMemo(() => {
    const names = profile.fullName?.split(' ') ?? []
    return `${names[0]?.[0] ?? 'A'}${names[1]?.[0] ?? 'F'}`.toUpperCase()
  }, [profile.fullName])

  const handleProfileFieldChange = (event) => {
    const { name, value } = event.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleCancelChanges = () => {
    setProfile(initialState.profile)
    setPreferences(initialState.preferences)
    setMessage('Cambios descartados.')
    setError('')
  }

  const handleSaveChanges = async () => {
    setMessage('')
    setError('')
    setIsSaving(true)

    try {
      await Promise.all([
        updateAffiliateProfile(profile),
        updateAffiliatePreferences(preferences),
      ])

      setInitialState({ profile, preferences })
      setMessage('Informacion actualizada correctamente.')
    } catch {
      setError('No fue posible guardar en backend. Los cambios se mantienen en modo local para pruebas.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    setError('')
    const mockCard = {
      id: `pm-local-${Date.now()}`,
      brand: 'VISA',
      brandType: 'visa',
      label: 'Visa de prueba que termina en 0101',
      expiry: '01/29',
      isDefault: false,
    }

    try {
      await createAffiliatePaymentMethod(mockCard)
      setPaymentMethods((prev) => [...prev, mockCard])
      setMessage('Metodo de pago agregado en modo de prueba.')
    } catch {
      setPaymentMethods((prev) => [...prev, mockCard])
      setMessage('Metodo agregado localmente. Pendiente integracion backend.')
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    setError('')
    const current = paymentMethods
    setPaymentMethods((prev) => prev.filter((item) => item.id !== paymentMethodId))

    try {
      await deleteAffiliatePaymentMethod(paymentMethodId)
    } catch {
      setPaymentMethods(current)
      setError('No fue posible eliminar en backend. Se restauro el metodo local.')
    }
  }

  return (
    <AffiliateShell active="profile">
            <PageLoadingOverlay visible={showLoader} message="Cargando perfil del afiliado..." />
            <header>
              <h2 className="affiliate-title">Perfil del Afiliado</h2>
              <p className="affiliate-subtitle">Gestione su identidad profesional y preferencias clinicas.</p>
            </header>

            <div className="affiliate-grid">
              <section>
                <article className="affiliate-card">
                  <div className="affiliate-card-head">
                    <div className="affiliate-card-title">
                      <span className="material-symbols-outlined">person</span>
                      <h2>Informacion Personal</h2>
                    </div>
                  </div>

                  <div className="affiliate-field-grid">
                    <label className="affiliate-field">
                      <span>Nombre Completo</span>
                      <input
                        name="fullName"
                        value={profile.fullName}
                        onChange={handleProfileFieldChange}
                      />
                    </label>

                    <label className="affiliate-field">
                      <span>Correo Electronico</span>
                      <input
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileFieldChange}
                      />
                    </label>

                    <label className="affiliate-field">
                      <span>Nombre de la Farmacia / Centro</span>
                      <input
                        name="organizationName"
                        value={profile.organizationName}
                        onChange={handleProfileFieldChange}
                      />
                    </label>

                    <label className="affiliate-field">
                      <span>Identificacion Profesional</span>
                      <input
                        name="professionalId"
                        value={profile.professionalId}
                        onChange={handleProfileFieldChange}
                      />
                    </label>
                  </div>
                </article>

                <article className="affiliate-card" style={{ marginTop: '1rem' }}>
                  <div className="affiliate-card-head">
                    <div className="affiliate-card-title">
                      <span className="material-symbols-outlined">payments</span>
                      <h3>Metodos de Pago</h3>
                    </div>

                    <button type="button" className="affiliate-secondary-btn" onClick={handleAddPaymentMethod}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                      Anadir Nuevo
                    </button>
                  </div>

                  <div className="payment-list">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className={`payment-item ${method.isDefault ? 'primary' : 'secondary'}`}>
                        <div className="payment-left">
                          <span className={`payment-brand ${method.brandType}`}>{method.brand}</span>
                          <div className="payment-text">
                            <strong>{method.label}</strong>
                            <small>Expira {method.expiry}</small>
                          </div>
                        </div>

                        {method.isDefault ? (
                          <span className="payment-default">Predeterminado</span>
                        ) : (
                          <button
                            type="button"
                            className="payment-delete-btn"
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            aria-label="Eliminar metodo de pago"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <aside>
                <article className="affiliate-card affiliate-account-status">
                  <h3>Estado de la Cuenta</h3>
                  <div className="affiliate-status-pill">
                    <span />
                    <span>{accountStatus.statusLabel}</span>
                  </div>
                  <p className="affiliate-account-text">{accountStatus.statusDescription}</p>
                  <button type="button" className="affiliate-primary-btn">Descargar Credenciales</button>
                </article>

                <article className="affiliate-card" style={{ marginTop: '1rem' }}>
                  <div className="affiliate-card-title" style={{ marginBottom: '1rem' }}>
                    <span className="material-symbols-outlined">settings</span>
                    <h3>Preferencias</h3>
                  </div>

                  <div className="preference-item">
                    <div>
                      <p>Notificaciones Push</p>
                      <small>Alertas de subastas en vivo</small>
                    </div>
                    <button
                      type="button"
                      className={`pref-toggle ${preferences.pushNotifications ? 'on' : 'off'}`}
                      onClick={() => togglePreference('pushNotifications')}
                    />
                  </div>

                  <div className="preference-item">
                    <div>
                      <p>Reportes Mensuales</p>
                      <small>Resumen de inventario via Email</small>
                    </div>
                    <button
                      type="button"
                      className={`pref-toggle ${preferences.monthlyReports ? 'on' : 'off'}`}
                      onClick={() => togglePreference('monthlyReports')}
                    />
                  </div>

                  <div className="preference-item">
                    <div>
                      <p>SMS de Urgencia</p>
                      <small>Logistica de transporte critico</small>
                    </div>
                    <button
                      type="button"
                      className={`pref-toggle ${preferences.emergencySms ? 'on' : 'off'}`}
                      onClick={() => togglePreference('emergencySms')}
                    />
                  </div>

                  <div className="affiliate-small-actions">
                    <button type="button" className="affiliate-small-action">
                      <span>Cambiar Contrasena</span>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    <button type="button" className="affiliate-small-action">
                      <span>Seguridad 2FA</span>
                      <span className="status">{preferences.twoFactorEnabled ? 'Activo' : 'Inactivo'}</span>
                    </button>
                  </div>
                </article>
              </aside>
            </div>

            <div className="affiliate-actions">
              <button type="button" className="affiliate-cancel-btn" onClick={handleCancelChanges}>
                Cancelar Cambios
              </button>
              <button type="button" className="affiliate-save-btn" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

            {error ? <p className="affiliate-feedback error">{error}</p> : null}
            {message ? <p className="affiliate-feedback success">{message}</p> : null}
    </AffiliateShell>
  )
}
