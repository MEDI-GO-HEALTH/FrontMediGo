/**
 * Register.jsx — Clinical Sanctuary Design
 * 
 * Pantalla de registro profesional con:
 * - Panel izquierdo (58%): Hero/Branding con imagen y gradiente
 * - Panel derecho (42%): Formulario con campos minimalistas
 * - White badge blocks para credibilidad
 * - Responsive: Stack vertical en mobile
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { Eye, EyeOff, Loader2, User, Truck } from 'lucide-react'
import { register } from '../../api/authService'
import heroImage from '../../assets/CreateAccount.png'

const ROLE_REDIRECTS = {
  AFILIADO: '/afiliado/subastas',
  REPARTIDOR: '/repartidor/mapa',
}

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('AFILIADO')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
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

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Por favor ingresa tu nombre completo')
      return false
    }
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
      setError('Por favor ingresa una contraseña')
      return false
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone,
        role,
      })
      localStorage.setItem('medigo_token', data.token)
      localStorage.setItem('medigo_user', JSON.stringify(data.user))
      navigate(ROLE_REDIRECTS[data.user.role] || '/login', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al registrarse. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      {/* ═══════════════════════════════════════════════
          PANEL IZQUIERDO: HERO/BRANDING
          ═══════════════════════════════════════════════ */}
      <div className="register-hero">
        {/* Hero Background Image */}
        <img src={heroImage} alt="Clinical Sanctuary" className="hero-image" />
        
        {/* Decorative glow elements */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div className="hero-content">
          {/* MediGo Logo */}
          <div className="hero-medigo">
            <span>MediGo</span>
          </div>

          {/* Hero Headline */}
          <h1 className="hero-headline">
            La salud conectada a<br />
            través de la logística.
          </h1>

          {/* Hero Description */}
          <p className="hero-description">
            Red optimizada para el transporte seguro de suministros médicos.<br /><br />
            Gestión inteligente para afiliados y profesionales de la salud
          </p>

        </div>

        {/* Footer */}
        <p className="hero-footer">
          © 2026 MediGo Systems. HIPAA Compliant.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          PANEL DERECHO: FORMULARIO
          ═══════════════════════════════════════════════ */}
      <div className="register-form-section">
        <div className="register-form-wrapper">
          {/* Form Header */}
          <div className="form-header">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Select your role in MediGo</p>
          </div>

          {/* Role Selector */}
          <div className="role-selector">
            {[
              { value: 'AFILIADO', label: 'Affiliate', icon: User, desc: 'Access auctions & medications' },
              { value: 'REPARTIDOR', label: 'Driver', icon: Truck, desc: 'Manage deliveries' },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`role-btn ${role === value ? 'active' : ''}`}
              >
                <Icon size={18} />
                <div className="role-btn-text">
                  <div className="role-btn-label">{label}</div>
                  <div className="role-btn-desc">{desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {/* Full Name */}
            <div className="form-field">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                className={`form-input ${touched.name && !form.name ? 'error' : ''}`}
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div className="form-field">
              <label htmlFor="email" className="form-label">PROFESSIONAL EMAIL</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="name@medigo.co"
                className={`form-input ${touched.email && !form.email ? 'error' : ''}`}
                disabled={loading}
              />
            </div>

            {/* Phone Field */}
            <div className="form-field">
              <label htmlFor="phone" className="form-label">PHONE (Optional)</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+57 300 000 0000"
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-field">
              <label htmlFor="password" className="form-label">PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
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

            {/* Confirm Password */}
            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-label">CONFIRM PASSWORD</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={`form-input ${touched.confirmPassword && !form.confirmPassword ? 'error' : ''}`}
                disabled={loading}
              />
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
                  <span>Creating account...</span>
                </>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>

            {/* Login Link */}
            <div className="form-login-link">
              <span>Already have an account?</span>
              <Link to="/login">Sign In</Link>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        /* ═════════════════════════════════════════════════
           REGISTER PAGE LAYOUT
           ═════════════════════════════════════════════════ */
        
        .register-container {
          display: flex;
          min-height: 100vh;
          background: var(--surface);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ═════════════════════════════════════════════════
           LEFT PANEL - HERO (58%)
           ═════════════════════════════════════════════════ */
        
        .register-hero {
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

        .hero-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .hero-medigo {
          margin-bottom: 3rem;
        }

        .hero-medigo span {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 0.35rem;
          letter-spacing: -0.5px;
          font-family: "Plus Jakarta Sans", sans-serif;
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
           RIGHT PANEL - FORM (42%)
           ═════════════════════════════════════════════════ */
        
        .register-form-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2.5rem 2rem 2rem 2rem;
          background: var(--surface);
          position: relative;
          padding-top: 2.5rem;
        }

        .register-form-wrapper {
          width: 100%;
          max-width: 400px;
        }

        /* Form Header */
        .form-header {
          margin-bottom: 2rem;
          text-align: left;
          margin-top: -0.5rem;
        }

        .form-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--on-surface);
          margin-bottom: 0.35rem;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 0.87rem;
          color: var(--on-surface-variant);
          font-weight: 400;
        }

        /* Role Selector */
        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          margin-bottom: 2rem;
        }

        .role-btn {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.85rem 0.8rem;
          background: var(--surface-container-high);
          border: 1.5px solid var(--outline-variant);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--on-surface-variant);
          font-size: 0.8rem;
          text-align: left;
        }

        .role-btn:hover {
          background: var(--surface-container-lowest);
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        .role-btn.active {
          background: #003358;
          border-color: #003358;
          color: #ffffff;
        }

        .role-btn.active .role-btn-label {
          color: #ffffff;
        }

        .role-btn.active .role-btn-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        .role-btn-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .role-btn-label {
          font-weight: 600;
          font-size: 0.88rem;
        }

        .role-btn-desc {
          font-size: 0.73rem;
          opacity: 0.75;
        }

        /* Form Styles */
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-label {
          font-size: 0.77rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--on-surface-variant);
        }

        .form-input {
          padding: 0.7rem 0.9rem;
          border: none;
          border-bottom: 2px solid var(--outline-variant);
          background: var(--surface-container-high);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          font-size: 0.92rem;
          color: var(--on-surface);
          transition: all 0.2s ease;
          font-family: inherit;
          min-height: 42px;
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
          padding-right: 2.8rem !important;
        }

        .password-toggle {
          position: absolute;
          right: 0.6rem;
          background: none;
          border: none;
          color: var(--on-surface-variant);
          cursor: pointer;
          padding: 0.45rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
          pointer-events: auto;
          z-index: 10;
        }

        .password-toggle:hover {
          color: var(--primary);
        }

        /* Error Message */
        .error-message {
          padding: 0.65rem 0.9rem;
          background: rgba(186, 26, 26, 0.1);
          color: var(--error);
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          font-weight: 500;
          border-left: 3px solid var(--error);
          margin-top: -0.3rem;
          line-height: 1.4;
        }

        /* Primary Button */
        .btn-primary {
          background: linear-gradient(135deg, #003358 0%, #004a7c 100%);
          color: white;
          padding: 0.85rem 1.5rem;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 51, 88, 0.25);
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(0, 51, 88, 0.35);
          transform: translateY(-2px);
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

        /* Form Footer Link */
        .form-login-link {
          text-align: center;
          font-size: 0.82rem;
          color: var(--on-surface-variant);
          margin-top: 1.25rem;
          font-weight: 400;
        }

        .form-login-link a {
          color: var(--primary);
          font-weight: 600;
          margin-left: 0.4rem;
          transition: color 0.2s ease;
          text-decoration: none;
        }

        .form-login-link a:hover {
          color: var(--primary-container);
        }

        /* ═════════════════════════════════════════════════
           RESPONSIVE DESIGN
           ═════════════════════════════════════════════════ */
        
        @media (max-width: 1024px) {
          .register-hero {
            width: 45%;
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
          .register-container {
            flex-direction: column;
          }

          .register-hero {
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

          .register-form-section {
            padding: 1.5rem;
          }

          .register-form-wrapper {
            max-width: 100%;
          }

          .role-selector {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .register-hero {
            min-height: 250px;
            padding: 1.5rem 1rem;
          }

          .hero-headline {
            font-size: 1.5rem;
          }

          .register-form-section {
            padding: 1rem;
          }

          .form-title {
            font-size: 1.375rem;
          }

          .role-selector {
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
