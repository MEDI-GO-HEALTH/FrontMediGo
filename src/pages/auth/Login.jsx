/**
 * Login.jsx — Clinical Sanctuary Design
 * 
 * Pantalla de autenticación profesional con:
 * - Panel izquierdo: Hero/Branding con gradiente oscuro
 * - Panel derecho: Formulario minimalista
 * - Glassmorphism y tipografía editorial
 * - Responsive: Stack vertical en mobile
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import { login } from '../../api/authService'
import heroImage from '../../assets/LoginImg.png'
import logoImage from '../../assets/Logo.png'
import '../../styles/auth/auth-base.css'
import '../../styles/auth/login.css'

const ROLE_REDIRECTS = {
  ADMIN: '/admin/inventario',
  AFILIADO: '/afiliado/subastas',
  REPARTIDOR: '/repartidor/mapa',
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }))
  }

  const isLikelyValidEmail = (value) => {
    const email = value.trim()
    if (email.length < 5 || email.length > 254) return false
    if (email.includes(' ')) return false

    const atIndex = email.indexOf('@')
    if (atIndex <= 0 || atIndex !== email.lastIndexOf('@') || atIndex === email.length - 1) {
      return false
    }

    const localPart = email.slice(0, atIndex)
    const domainPart = email.slice(atIndex + 1)

    if (!localPart || !domainPart) return false
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false
    if (!domainPart.includes('.')) return false
    if (domainPart.includes('..')) return false

    return true
  }

  // Validación básica
  const validateForm = () => {
    if (!form.email.trim()) {
      setError('Por favor ingresa tu correo electrónico')
      return false
    }
    if (!isLikelyValidEmail(form.email)) {
      setError('Por favor ingresa un correo válido')
      return false
    }
    if (!form.password) {
      setError('Por favor ingresa tu contraseña')
      return false
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    return true
  }

  // Quick login para desarrollo
  const handleQuickLogin = async (role) => {
    const rolesMap = {
      ADMIN: 'admin@medigo.co',
      AFILIADO: 'afiliado@medigo.co',
      REPARTIDOR: 'repartidor@medigo.co'
    }
    setLoading(true)
    try {
      const data = await login({ email: rolesMap[role], password: 'password123' })
      localStorage.setItem('medigo_token', data.token)
      localStorage.setItem('medigo_user', JSON.stringify(data.user))
      navigate(ROLE_REDIRECTS[role], { replace: true })
    } catch (err) {
      setError('Error al acceder. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const data = await login({
        email: form.email.trim(),
        password: form.password
      })
      
      // Persistir sesión
      localStorage.setItem('medigo_token', data.token)
      localStorage.setItem('medigo_user', JSON.stringify(data.user))
      
      // Redirigir según rol
      const redirect = ROLE_REDIRECTS[data.user.role] || '/login'
      navigate(redirect, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* ═══════════════════════════════════════════════
          PANEL IZQUIERDO: HERO/BRANDING
          ═══════════════════════════════════════════════ */}
      <div className="login-hero">
        {/* Hero Background Image */}
        <img src={heroImage} alt="Clinical Sanctuary" className="hero-image" />
        
        {/* Decorative glow elements */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="hero-content">
          {/* Logo */}
          <div className="hero-logo">
            <img src={logoImage} alt="MediGo Logo" className="logo-icon" />
            <span className="logo-text">MediGo</span>
          </div>

          {/* Hero Headline */}
          <h1 className="hero-headline">
            The Future of<br />
            Clinical Governance.
          </h1>

          {/* Hero Description */}
          <p className="hero-description">
            Access high-fidelity diagnostics and patient care metrics through our encrypted clinical portal.
          </p>

          {/* Security Badges */}
          <div className="hero-badges">
            <div className="badge-item">
              <Lock size={14} />
              <span>HIPAA Compliant</span>
            </div>
            <div className="badge-item">
              <Lock size={14} />
              <span>End-to-End Encryption</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="hero-footer">
          © 2026 MediGo Systems. HIPAA Compliant.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          PANEL DERECHO: FORMULARIO
          ═══════════════════════════════════════════════ */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          {/* Welcome Header */}
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Your clinical journey resumes here</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                PROFESSIONAL EMAIL
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="dr.name@healthcare.com"
                autoComplete="email"
                className={`form-input ${touched.email && !form.email ? 'error' : ''}`}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-field">
              <div className="form-label-row">
                <label htmlFor="password" className="form-label">
                  PASSWORD
                </label>
                <Link to="#" className="forgot-password">
                  Forgot password?
                </Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`form-input ${touched.password && !form.password ? 'error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="password-toggle"
                  tabIndex="-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-large"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Remember Me & Create Account */}
            <div className="form-footer-row">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember this device</span>
              </label>
              <span className="divider">•</span>
              <Link to="/register" className="signup-link">
                Create account
              </Link>
            </div>
          </form>

          {/* Quick Access (Development) */}
          <div className="quick-access-section">
            <div className="divider-line">
              <span>QUICK ACCESS (Development)</span>
            </div>
            <div className="quick-buttons">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={loading}
                className="quick-btn"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('AFILIADO')}
                disabled={loading}
                className="quick-btn"
              >
                AFFILIATE
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('REPARTIDOR')}
                disabled={loading}
                className="quick-btn"
              >
                DRIVER
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="form-links">
          <Link to="#">Privacy Policy</Link>
          <span className="divider">•</span>
          <Link to="#">Terms of Service</Link>
          <span className="divider">•</span>
          <Link to="#">Security Architecture</Link>
        </div>
      </div>
    </div>
  )
}
