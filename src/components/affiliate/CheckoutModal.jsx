/**
 * CheckoutModal.jsx — Modal de confirmación de pedido (HU-03/HU-06)
 *
 * Recoge la dirección de entrega del afiliado y llama a:
 *   POST /api/orders/{branchId}/confirm
 *
 * Al confirmar exitosamente guarda el orderId en localStorage bajo
 * 'medigo_active_order' para que MapaPedidos pueda hacer polling.
 */

import { useState } from 'react'
import { confirmOrder } from '../../api/affiliateOrderService'
import '../../styles/affiliate/checkout-modal.css'

const BOGOTA_CENTER = { latitude: 4.711, longitude: -74.0721 }

export default function CheckoutModal({ branchId, totalPrice, onSuccess, onClose }) {
  const [form, setForm] = useState({
    street: '',
    streetNumber: '',
    city: 'Bogotá',
    commune: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { street, streetNumber, city, commune } = form
    if (!street.trim() || !streetNumber.trim() || !city.trim() || !commune.trim()) {
      setError('Por favor completa todos los campos de dirección.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const order = await confirmOrder({
        branchId,
        ...form,
        ...BOGOTA_CENTER,
      })

      // Persistir orderId para que MapaPedidos haga polling
      localStorage.setItem('medigo_active_order', JSON.stringify({
        orderId: order.id,
        orderNumber: order.orderNumber,
        branchId,
        confirmedAt: new Date().toISOString(),
      }))

      onSuccess(order)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'No se pudo confirmar el pedido. Intenta de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0)

  return (
    <div className="checkout-overlay" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="checkout-modal">
        <header className="checkout-modal__header">
          <div className="checkout-modal__icon">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <h2 id="checkout-title" className="checkout-modal__title">Confirmar pedido</h2>
            <p className="checkout-modal__subtitle">Ingresa la dirección de entrega</p>
          </div>
          <button type="button" className="checkout-modal__close" aria-label="Cerrar" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form className="checkout-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="checkout-form-row">
            <div className="checkout-field">
              <label htmlFor="co-street">Calle / Carrera</label>
              <input
                id="co-street"
                name="street"
                type="text"
                placeholder="Ej: Calle 94"
                value={form.street}
                onChange={handleChange}
                required
              />
            </div>
            <div className="checkout-field checkout-field--short">
              <label htmlFor="co-number">Número</label>
              <input
                id="co-number"
                name="streetNumber"
                type="text"
                placeholder="Ej: 13-55"
                value={form.streetNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="checkout-form-row">
            <div className="checkout-field">
              <label htmlFor="co-commune">Barrio / Localidad</label>
              <input
                id="co-commune"
                name="commune"
                type="text"
                placeholder="Ej: Chapinero"
                value={form.commune}
                onChange={handleChange}
                required
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="co-city">Ciudad</label>
              <input
                id="co-city"
                name="city"
                type="text"
                placeholder="Bogotá"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && (
            <p className="checkout-error" role="alert">{error}</p>
          )}

          <div className="checkout-modal__summary">
            <span>Total a pagar</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>

          <div className="checkout-modal__actions">
            <button type="button" className="checkout-btn--cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="checkout-btn--confirm" disabled={loading}>
              {loading
                ? <><span className="checkout-spinner" />Confirmando...</>
                : <><span className="material-symbols-outlined">check_circle</span>Confirmar pedido</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
