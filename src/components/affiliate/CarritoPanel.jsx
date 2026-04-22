/**
 * CarritoPanel.jsx — Panel lateral del carrito de compras (HU-03)
 *
 * Panel deslizable que muestra los medicamentos agregados al carrito,
 * cantidades, precios unitarios, subtotales y el total final.
 */

import { useCart } from '../../context/CartContext'
import '../../styles/affiliate/carrito.css'

const formatPrice = (value) => {
  const num = Number(value)
  if (!num && num !== 0) {
    return '—'
  }
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num)
}

export default function CarritoPanel() {
  const { items, totalPrice, isOpen, setIsOpen } = useCart()

  return (
    <>
      {/* Overlay para cerrar el panel al hacer clic fuera */}
      {isOpen ? (
        <div
          className="carrito-overlay"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

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
          <button
            type="button"
            className="carrito-close"
            aria-label="Cerrar carrito"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

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

        {items.length > 0 ? (
          <footer className="carrito-footer">
            <div className="carrito-total">
              <span>Total</span>
              <span className="carrito-total-price">{formatPrice(totalPrice)}</span>
            </div>
            <p className="carrito-footer-hint">
              {items.reduce((s, i) => s + i.cartQuantity, 0)} unidad(es) en el carrito
            </p>
          </footer>
        ) : null}
      </aside>
    </>
  )
}
