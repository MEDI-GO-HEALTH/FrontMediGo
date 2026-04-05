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

  // Validación básica
  const validateForm = () => {
    if (!form.email.trim()) {
      setError('Por favor ingresa tu correo electrónico')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
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

      <style>{`
        /* ═════════════════════════════════════════════════
           LOGIN PAGE LAYOUT
           ═════════════════════════════════════════════════ */
        
        .login-container {
          display: flex;
          min-height: 100vh;
          background: var(--surface);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ═════════════════════════════════════════════════
           LEFT PANEL - HERO
           ═════════════════════════════════════════════════ */
        
        .login-hero {
          width: 58%;
          background: linear-gradient(135deg, #0a1929 0%, #132f4c 20%, #1a4d6d 50%, #0d2a42 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          position: relative;
          overflow: hidden;
          align-items: flex-start;
        }

        /* Hero Image */
        .hero-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.75;
          z-index: 1;
          pointer-events: none;
        }

        /* Decorative glow effects */
        .hero-glow {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 51, 88, 0.4) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-glow-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          right: -100px;
          opacity: 0.6;
        }

        .hero-glow-2 {
          width: 400px;
          height: 400px;
          bottom: 100px;
          left: -150px;
          background: radial-gradient(circle, rgba(0, 106, 106, 0.2) 0%, transparent 70%);
          opacity: 0.4;
        }

        /* Logo */
        .hero-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 5rem;
          position: relative;
          z-index: 2;
          margin-top: -2rem;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 51, 88, 0.4);
          object-fit: contain;
        }

        .logo-text {
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        /* Content */
        .hero-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .hero-headline {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -1.5px;
          max-width: 700px;
        }

        .hero-description {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          margin-bottom: 2rem;
          max-width: 620px;
        }

        /* Badges */
        .hero-badges {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .badge-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: #003358;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 0.75rem;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: fit-content;
        }

        .badge-item svg {
          color: #003358;
          flex-shrink: 0;
        }

        .hero-footer {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          position: relative;
          z-index: 2;
        }

        /* ═════════════════════════════════════════════════
           RIGHT PANEL - FORM
           ═════════════════════════════════════════════════ */
        
        .login-form-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: var(--surface);
          position: relative;
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 500px;
        }

        /* Form Header */
        .form-header {
          margin-bottom: 2rem;
          text-align: left;
        }

        .form-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--on-surface);
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 0.95rem;
          color: var(--on-surface-variant);
        }

        /* Form Styles */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--on-surface-variant);
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-password {
          font-size: 0.8rem;
          color: var(--primary);
          font-weight: 600;
          transition: color var(--transition-base);
        }

        .forgot-password:hover {
          color: var(--primary-container);
        }

        .form-input {
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 2px solid var(--outline-variant);
          background: var(--surface-container-high);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          font-size: 1rem;
          color: var(--on-surface);
          transition: all var(--transition-base);
          font-family: inherit;
          min-height: 44px;
          width: 100%;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: var(--on-surface-variant);
          opacity: 0.6;
        }

        .form-input:focus {
          outline: none;
          border-bottom-color: var(--primary);
          background: var(--surface-container-lowest);
          box-shadow: 0 2px 0 0 var(--primary);
        }

        .form-input.error {
          border-bottom-color: var(--error);
          background-color: rgba(186, 26, 26, 0.10);
        }

        /* Password Input */
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper input {
          padding-right: 2.75rem !important;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: var(--on-surface-variant);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-base);
          pointer-events: auto;
          z-index: 10;
        }

        .password-toggle:hover {
          color: var(--primary);
        }

        /* Error Message */
        .error-message {
          padding: 0.75rem 1rem;
          background: rgba(186, 26, 26, 0.1);
          color: var(--error);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          font-weight: 500;
          border-left: 3px solid var(--error);
          margin-top: -0.5rem;
        }

        /* Primary Button */
        .btn-primary {
          background: linear-gradient(135deg, #003358 0%, #004a7c 100%);
          color: white;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all var(--transition-base);
          box-shadow: 0 4px 12px rgba(0, 51, 88, 0.25);
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-transform: uppercase;
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(0, 51, 88, 0.35);
          transform: translateY(-2px);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(0, 51, 88, 0.25);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Footer Row */
        .form-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--on-surface-variant);
          gap: 0.5rem;
        }

        .divider {
          opacity: 0.3;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input {
          cursor: pointer;
          outline: none;
          accent-color: var(--primary);
        }

        .checkbox-label input:focus {
          outline: none;
          box-shadow: none;
        }

        .signup-link {
          color: var(--primary);
          font-weight: 600;
          transition: color var(--transition-base);
        }

        .signup-link:hover {
          color: var(--primary-container);
        }

        /* Quick Access Section */
        .quick-access-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--surface-container-low);
        }

        .divider-line {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          color: var(--on-surface-variant);
          font-weight: 600;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .divider-line::before,
        .divider-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--surface-container-low);
        }

        .divider-line::before {
          margin-right: 0.75rem;
        }

        .divider-line::after {
          margin-left: 0.75rem;
        }

        .quick-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .quick-btn {
          padding: 0.75rem 1rem;
          background: var(--secondary-container);
          color: var(--on-secondary-container);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-base);
          min-height: 40px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .quick-btn:hover:not(:disabled) {
          background: var(--secondary);
          color: var(--on-secondary);
        }

        .quick-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Form Footer */
        .form-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          margin-top: 2rem;
          font-size: 0.75rem;
          color: var(--on-surface-variant);
          flex-wrap: wrap;
        }

        .form-links a {
          color: var(--primary);
          font-weight: 600;
          transition: color var(--transition-base);
        }

        .form-links a:hover {
          color: var(--primary-container);
        }

        /* ═════════════════════════════════════════════════
           RESPONSIVE DESIGN
           ═════════════════════════════════════════════════ */
        
        @media (max-width: 1024px) {
          .login-hero {
            width: 40%;
            padding: 2rem;
          }

          .hero-headline {
            font-size: 2rem;
          }

          .form-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
          }

          .login-hero {
            width: 100%;
            min-height: 300px;
            padding: 2rem 1.5rem;
            justify-content: center;
          }

          .hero-headline {
            font-size: 1.75rem;
          }

          .hero-description {
            font-size: 0.95rem;
          }

          .login-form-section {
            padding: 1.5rem;
          }

          .login-form-wrapper {
            max-width: 100%;
          }

          .quick-buttons {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .login-container {
            flex-direction: column;
          }

          .login-hero {
            min-height: 250px;
            padding: 1.5rem 1rem;
          }

          .hero-headline {
            font-size: 1.5rem;
          }

          .hero-description {
            font-size: 0.9rem;
          }

          .login-form-section {
            padding: 1rem;
          }

          .form-title {
            font-size: 1.375rem;
          }

          .quick-buttons {
            grid-template-columns: 1fr;
          }
        }

        /* ═════════════════════════════════════════════════
           ANIMATIONS
           ═════════════════════════════════════════════════ */
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
