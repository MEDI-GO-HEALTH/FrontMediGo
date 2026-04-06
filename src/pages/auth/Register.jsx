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
import { registerUser } from '../../api/authService'
import heroImage from '../../assets/CreateAccount.png'
import { useAuthFormState } from '../../hooks/useAuthFormState'
import { isLikelyValidEmail } from '../../utils/authValidation'
import '../../styles/auth/auth-base.css'
import '../../styles/auth/register.css'

const PHONE_REGEX = /^\+\d{1,3}-\d{3}-\d{7}$/
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('AFFILIATE')
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
    if (!STRONG_PASSWORD_REGEX.test(form.password)) {
      setError('La contraseña debe tener minimo 8 caracteres, con mayuscula, minuscula y numero')
      return false
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }

    const phone = form.phone.trim()
    if (phone && !PHONE_REGEX.test(phone)) {
      setError('El teléfono debe tener formato +57-322-5555555')
      return false
    }

    if (!['AFFILIATE', 'DELIVERY'].includes(role)) {
      setError('El rol seleccionado no es válido')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        role,
      })

      // Seguridad: no auto-login tras registro. Siempre volver a login.
      localStorage.removeItem('medigo_token')
      localStorage.removeItem('medigo_user')
      navigate('/?registered=1', { replace: true })
    } catch (err) {
      const traceId = err?.response?.headers?.['x-trace-id'] || err?.response?.headers?.['X-Trace-Id']
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        err?.response?.data?.error ||
        'Error al registrarse. Intenta de nuevo.'
      setError(traceId && !String(msg).includes('traceId') ? `${msg} (traceId: ${traceId})` : msg)
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
              { value: 'AFFILIATE', label: 'Affiliate', icon: User, desc: 'Access auctions & medications' },
              { value: 'DELIVERY', label: 'Driver', icon: Truck, desc: 'Manage deliveries' },
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
