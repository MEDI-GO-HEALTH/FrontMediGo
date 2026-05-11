/**
 * CarritoPanel.jsx — Panel lateral del carrito de compras (HU-03 / HU-06)
 *
 * Panel deslizable que muestra los medicamentos en el carrito y permite
 * confirmar el pedido abriendo el CheckoutModal.
 *
 * Flujo:
 *  1. Usuario agrega ítems → aparecen aquí
 *  2. Pulsa "Confirmar pedido" → abre CheckoutModal
 *  3. CheckoutModal llama POST /api/orders/{branchId}/confirm
 *  4. Respuesta exitosa: guarda orderId en localStorage y muestra confirmación
 */

import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import CheckoutModal from './CheckoutModal'
import '../../styles/affiliate/carrito.css'

const formatPrice = (value) => {
  const num = Number(value)
  if (!num && num !== 0) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num)
}

export default function CarritoPanel({ branchId }) {
  const { items, totalPrice, isOpen, setIsOpen } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState(null)

  const handleCheckoutSuccess = (order) => {
    setShowCheckout(false)
    setConfirmedOrder(order)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Limpiar estado de confirmación al cerrar para un próximo pedido
    if (confirmedOrder) setConfirmedOrder(null)
  }

  return (
    <>
      {/* CheckoutModal — solo se monta cuando el usuario lo abre */}
      {showCheckout && (
        <CheckoutModal
          branchId={branchId}
          totalPrice={totalPrice}
          onSuccess={handleCheckoutSuccess}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* Overlay para cerrar el panel */}
      {isOpen && (
        <div className="carrito-overlay" aria-hidden="true" onClick={handleClose} />
      )}

      <aside
        className={`carrito-panel${isOpen ? ' open' : ''}`}
        aria-label="Panel del carrito de compras"
        role="complementary"
      >
        <header className="carrito-header">
          <div className="carrito-title-row">
            <span className="material-symbols-outlined carrito-icon">shopping_cart</span>
            <h3>Carrito de compras</h3>
          </div>
          <button type="button" className="carrito-close" aria-label="Cerrar carrito" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* ── Post-confirmación ───────────────────────────────────────── */}
        {confirmedOrder ? (
          <div className="carrito-confirmed">
            <div className="carrito-confirmed__icon">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <h4 className="carrito-confirmed__title">¡Pedido confirmado!</h4>
            <p className="carrito-confirmed__number">
              N.° <strong>{confirmedOrder.orderNumber ?? confirmedOrder.id}</strong>
            </p>
            <p className="carrito-confirmed__hint">
              Tu repartidor será asignado pronto. Puedes hacer seguimiento en el mapa de pedidos.
            </p>
            <button
              type="button"
              className="carrito-confirmed__btn"
              onClick={handleClose}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* ── Lista de ítems ──────────────────────────────────────── */}
            <div className="carrito-body">
              {items.length === 0 ? (
                <div className="carrito-empty">
                  <span className="material-symbols-outlined carrito-empty-icon">shopping_cart</span>
                  <p>Tu carrito está vacío</p>
                  <p className="carrito-empty-hint">Agrega medicamentos desde el catálogo</p>
                </div>
              ) : (
                <ul className="carrito-list" role="list">
                  {items.map((item) => (
                    <li key={item.medicationId} className="carrito-item">
                      <div className="carrito-item-name">{item.name}</div>
                      <div className="carrito-item-detail">
                        <span className="carrito-item-qty">
                          {item.cartQuantity} × {formatPrice(item.unitPrice)}
                        </span>
                        <span className="carrito-item-subtotal">
                          {formatPrice(item.cartQuantity * Number(item.unitPrice))}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Footer con total y botón de confirmar ──────────────── */}
            {items.length > 0 && (
              <footer className="carrito-footer">
                <div className="carrito-total">
                  <span>Total</span>
                  <span className="carrito-total-price">{formatPrice(totalPrice)}</span>
                </div>
                <p className="carrito-footer-hint">
                  {items.reduce((s, i) => s + i.cartQuantity, 0)} unidad(es) en el carrito
                </p>
                <button
                  type="button"
                  className="carrito-checkout-btn"
                  onClick={() => setShowCheckout(true)}
                >
                  <span className="material-symbols-outlined">local_shipping</span>
                  Confirmar pedido
                </button>
              </footer>
            )}
          </>
        )}
      </aside>
    </>
  )
}
