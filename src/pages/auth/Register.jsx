/**
 * Register.jsx — Registro de Usuario
 *
 * 🔗 CONEXIÓN AL BACKEND:
 *   Archivo: src/api/authService.js → función register()
 *   Línea clave: await register({ name, email, password, role, phone })
 *   Endpoint: POST /auth/register
 *   Respuesta esperada: { token, user: { id, name, email, role } }
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Eye, EyeOff, Loader2, User, Truck } from 'lucide-react'
import { register } from '../../api/authService'

const ROLE_REDIRECTS = {
  AFILIADO:   '/afiliado/subastas',
  REPARTIDOR: '/repartidor/mapa',
}

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('AFILIADO')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  // ─────────────────────────────────────────────────────────────────
  // 📡 LLAMADA AL BACKEND — src/api/authService.js → register()
  //    POST /auth/register  →  { token, user: { id, name, email, role } }
  // ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Por favor completa todos los campos requeridos.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const data = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role,
      })
      localStorage.setItem('medigo_token', data.token)
      localStorage.setItem('medigo_user',  JSON.stringify(data.user))
      navigate(ROLE_REDIRECTS[data.user.role] || '/login', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al registrarse. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.brandPanel}>
        <div style={styles.brandGlow} />
        <div style={styles.brandContent}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>💊</div>
            <span style={styles.logoText}>Medi<span style={{ color: '#d2bbff' }}>Go</span></span>
          </div>
          <h1 style={styles.brandHeadline}>
            Únete a la<br />
            <span style={{ color: '#00fe66' }}>Red de Salud.</span>
          </h1>
          <p style={styles.brandDesc}>
            Regístrate como afiliado o repartidor y forma parte del ecosistema
            de salud más avanzado de Colombia.
          </p>
        </div>
        <p style={styles.copyright}>© 2024 MediGo Systems. All rights reserved.</p>
      </div>

      <div style={styles.formPanel}>
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Crear cuenta</h2>
          <p style={styles.formSubtitle}>Selecciona tu rol en MediGo</p>

          {/* Selector de Rol */}
          <div style={styles.roleSelector}>
            {[
              { value: 'AFILIADO',   label: 'Afiliado',    icon: User,  desc: 'Accede a subastas y medicamentos' },
              { value: 'REPARTIDOR', label: 'Repartidor',  icon: Truck, desc: 'Gestiona entregas y pedidos' },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                id={`role-${value.toLowerCase()}`}
                onClick={() => setRole(value)}
                style={{
                  ...styles.roleBtn,
                  ...(role === value ? styles.roleBtnActive : {}),
                }}
              >
                <Icon size={20} style={{ color: role === value ? 'var(--primary)' : 'var(--on-surface-variant)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: role === value ? 'var(--on-surface)' : 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre completo *</label>
                <input id="register-name" name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Teléfono</label>
                <input id="register-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+57 300 000 0000" />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Correo electrónico *</label>
              <input id="register-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="nombre@medigo.co" />
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Contraseña *</label>
                <div style={{ position: 'relative' }}>
                  <input id="register-password" type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" style={{ paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Confirmar contraseña *</label>
                <input id="register-confirm-password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>

            {error && <p style={styles.errorMsg}>{error}</p>}

            <button id="register-submit" type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Crear Cuenta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '1.5rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Iniciar sesión</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--surface)' },
  brandPanel: {
    width: '38%',
    background: 'linear-gradient(145deg, #0a1f0e 0%, #0f2d14 40%, #131313 100%)',
    display: 'flex',
    flexDirection: 'column',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
  },
  brandGlow: {
    position: 'absolute',
    top: -50,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,254,102,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  brandContent: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 },
  logoRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' },
  logoIcon: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #d2bbff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--on-surface)' },
  brandHeadline: { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-1px' },
  brandDesc: { fontSize: '0.95rem', color: 'var(--on-surface-variant)', lineHeight: 1.7 },
  copyright: { fontSize: '0.75rem', color: 'var(--outline)', position: 'relative', zIndex: 1 },
  formPanel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  formCard: { width: '100%', maxWidth: 560, background: 'var(--surface-container)', borderRadius: 'var(--radius-2xl)', padding: '2.5rem', border: '1px solid rgba(74,68,85,0.3)', boxShadow: 'var(--shadow-lg)' },
  formTitle: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.4rem', letterSpacing: '-0.5px' },
  formSubtitle: { fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' },
  roleSelector: { display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' },
  roleBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-container-high)', border: '1px solid rgba(74,68,85,0.4)', borderRadius: 'var(--radius-xl)', padding: '0.85rem 1rem', cursor: 'pointer', transition: 'all var(--transition-fast)' },
  roleBtnActive: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.5)', boxShadow: 'var(--shadow-glow-purple)' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'flex', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', flex: 1 },
  label: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 6, fontFamily: 'var(--font-display)' },
  eyeBtn: { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', display: 'flex', alignItems: 'center' },
  errorMsg: { background: 'rgba(147,0,10,0.2)', color: 'var(--error)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem', fontSize: '0.83rem' },
  submitBtn: { background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' },
}
