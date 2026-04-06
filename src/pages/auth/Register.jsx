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
import { useAuthFormState } from '../../hooks/useAuthFormState'
import { isLikelyValidEmail } from '../../utils/authValidation'
import '../../styles/auth/auth-base.css'
import '../../styles/auth/register.css'

const ROLE_REDIRECTS = {
  AFILIADO: '/afiliado/subastas',
  REPARTIDOR: '/repartidor/mapa',
}

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('AFILIADO')
  const {
    form,
    showPass,
    setShowPass,
    loading,
    setLoading,
    error,
    setError,
    touched,
    handleChange,
    handleBlur,
  } = useAuthFormState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Por favor ingresa tu nombre completo')
      return false
    }
    if (!form.email.trim()) {
      setError('Por favor ingresa tu correo electrónico')
      return false
    }
    if (!isLikelyValidEmail(form.email)) {
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
    </div>
  )
}
