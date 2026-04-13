import { useEffect, useState } from 'react'
import useCart from '../../hooks/useCart'
import '../../styles/affiliate/carrito-compras.css'

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

export default function CarritoCompras() {
  const cart = useCart()
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [notification, setNotification] = useState('')

  const handleQuantityChange = (medicationId, newQuantity, maxStock, branchId = 0) => {
    const result = cart.updateQuantity(medicationId, newQuantity, maxStock)

    if (!result.success) {
      setNotification({
        type: 'error',
        message: result.message,
      })
      setTimeout(() => setNotification(''), 3000)
    }
  }

  const handleRemoveItem = (medicationId, branchId) => {
    const result = cart.removeFromCart(medicationId, branchId)
    if (result.success) {
      setDeleteConfirm(null)
      setNotification({
        type: 'success',
        message: result.message,
      })
      setTimeout(() => setNotification(''), 2000)
    }
  }

  const handleClearCart = () => {
    if (window.confirm('¿Está seguro que desea vaciar el carrito completamente?')) {
      const result = cart.clearCart()
      if (result.success) {
        setShowModal(false)
        setNotification({
          type: 'success',
          message: result.message,
        })
        setTimeout(() => setNotification(''), 2000)
      }
    }
  }

  if (!showModal) {
    return (
      <button
        type="button"
        className="carrito-floating-btn"
        onClick={() => setShowModal(true)}
        aria-label={`Abrir carrito (${cart.unitsCount} unidades)`}
        title={`Carrito: ${cart.unitsCount} unidades`}
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {cart.unitsCount > 0 && <span className="carrito-badge">{cart.unitsCount}</span>}
      </button>
    )
  }

  return (
    <div className="carrito-modal-backdrop">
      <div className="carrito-modal">
        <header className="carrito-modal-header">
          <h2>Mi Carrito</h2>
          <button
            type="button"
            className="close-btn"
            onClick={() => setShowModal(false)}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </header>

        {notification && (
          <div className={`carrito-notification notification-${notification.type}`}>
            <span>{notification.message}</span>
          </div>
        )}

        <div className="carrito-content">
          {cart.cart.length === 0 ? (
            <div className="carrito-empty">
              <span className="material-symbols-outlined">shopping_cart</span>
              <p>Tu carrito está vacío</p>
              <small>Agrega medicamentos desde el inventario</small>
            </div>
          ) : (
            <>
              <table className="carrito-table">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Unidad</th>
                    <th className="center">Cantidad</th>
                    <th className="right">Precio Unitario</th>
                    <th className="right">Subtotal</th>
                    <th className="center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.cart.map((item) => {
                    const itemSubtotal = item.price * item.quantity
                    return (
                      <tr key={`${item.medicationId}-${item.branchId}`}>
                        <td className="med-name">
                          <strong>{item.name}</strong>
                          <div className="medication-branch-tag">
                            <span className="material-symbols-outlined">location_on</span>
                            {item.branchName || `Sede #${item.branchId}`}
                          </div>
                        </td>
                        <td>{item.unit}</td>
                        <td className="center">
                          <div className="quantity-control">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item.medicationId,
                                  Math.max(1, item.quantity - 1),
                                  item.maxStock,
                                  item.branchId
                                )
                              }
                              aria-label="Disminuir cantidad"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.medicationId,
                                  Number(e.target.value),
                                  item.maxStock,
                                  item.branchId
                                )
                              }
                              min="1"
                              max={item.maxStock}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(
                                  item.medicationId,
                                  item.quantity + 1,
                                  item.maxStock,
                                  item.branchId
                                )
                              }
                              disabled={item.quantity >= item.maxStock}
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="right">{formatCurrency(item.price)}</td>
                        <td className="right">
                          <strong>{formatCurrency(itemSubtotal)}</strong>
                        </td>
                        <td className="center">
                          {deleteConfirm === `${item.medicationId}-${item.branchId}` ? (
                            <div className="delete-confirm">
                              <button
                                type="button"
                                className="confirm-btn"
                                onClick={() => handleRemoveItem(item.medicationId, item.branchId)}
                              >
                                Sí
                              </button>
                              <button type="button" className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => setDeleteConfirm(`${item.medicationId}-${item.branchId}`)}
                              aria-label={`Eliminar ${item.name}`}
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="carrito-summary">
                <div className="summary-row">
                  <span>Subtotal ({cart.unitsCount} unidades):</span>
                  <strong>{formatCurrency(cart.total)}</strong>
                </div>
                <div className="summary-row">
                  <span>Impuesto (IVA 19%):</span>
                  <strong>{formatCurrency(cart.total * 0.19)}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <strong>{formatCurrency(cart.total * 1.19)}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="carrito-modal-footer">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowModal(false)}
          >
            Seguir comprando
          </button>

          {cart.cart.length > 0 && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearCart}
              >
                Vaciar carrito
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  // Aquí irá la lógica de procesar pedido
                  setNotification({
                    type: 'info',
                    message: 'Funcionalidad de pedidos en desarrollo...',
                  })
                }}
              >
                Procesar pedido
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
