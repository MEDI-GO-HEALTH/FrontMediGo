/**
 * CartContext.jsx — Estado global del carrito de compras (HU-03)
 *
 * Provee:
 * - items: lista de medicamentos en el carrito con cantidad y precio
 * - totalPrice: precio total calculado
 * - cartCount: total de unidades en el carrito
 * - addItem(medication, branchId): agrega 1 unidad al carrito con validaciones
 * - notification: { type: 'success'|'error', message } o null
 * - isOpen / setIsOpen: controla visibilidad del panel del carrito
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { addToCart, getCart } from '../api/cartService'

const CartContext = createContext(null)

const getAffiliateId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('medigo_user') || '{}')
    return Number(user?.id) || null
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  /**
   * items: Array<{ medicationId, name, cartQuantity, unitPrice, stockAvailable }>
   * cartQuantity: cuántas unidades hay en el carrito
   * stockAvailable: cuántas unidades hay en la sucursal (para validar límite)
   */
  const [items, setItems] = useState([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [notification, setNotification] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentBranchId, setCurrentBranchId] = useState(null)

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message })
    const timer = setTimeout(() => setNotification(null), 3500)
    return () => clearTimeout(timer)
  }, [])

  // Carga el carrito desde el backend cuando cambia la sucursal
  const loadCart = useCallback(async (branchId) => {
    const affiliateId = getAffiliateId()
    if (!affiliateId || !branchId) {
      return
    }

    try {
      const result = await getCart({ affiliateId, branchId: Number(branchId) })
      if (result?.items?.length > 0) {
        setItems((prev) => {
          return result.items.map((serverItem) => {
            const existing = prev.find((i) => i.medicationId === serverItem.medicationId)
            return {
              medicationId: serverItem.medicationId,
              name: existing?.name || `Medicamento ${serverItem.medicationId}`,
              cartQuantity: serverItem.quantity,
              unitPrice: serverItem.unitPrice,
              stockAvailable: existing?.stockAvailable ?? Infinity,
            }
          })
        })
        setTotalPrice(Number(result.totalPrice) || 0)
      }
    } catch {
      // No carrito existente — estado vacío es correcto
    }
  }, [])

  const syncBranch = useCallback(
    (branchId) => {
      if (branchId && branchId !== currentBranchId) {
        setCurrentBranchId(branchId)
        setItems([])
        setTotalPrice(0)
        loadCart(branchId)
      }
    },
    [currentBranchId, loadCart]
  )

  /**
   * Agrega 1 unidad de un medicamento al carrito.
   *
   * Validaciones:
   * 1. Si cartQuantity + 1 > stockAvailable → "No hay suficiente stock disponible"
   * 2. Si la API falla → muestra mensaje del backend
   *
   * @param {{ medicationId, name, quantity (stock), unitPrice }} medication
   * @param {number} branchId
   */
  const addItem = useCallback(
    async (medication, branchId) => {
      const affiliateId = getAffiliateId()
      if (!affiliateId) {
        showNotification('error', 'No se pudo identificar al usuario.')
        return
      }

      const existing = items.find((i) => i.medicationId === medication.medicationId)
      const currentCartQty = existing?.cartQuantity ?? 0

      // Escenario 4: no permite superar el stock disponible
      if (currentCartQty + 1 > medication.quantity) {
        showNotification('error', 'No hay suficiente stock disponible')
        return
      }

      try {
        const result = await addToCart({
          affiliateId,
          branchId: Number(branchId),
          medicationId: medication.medicationId,
          quantity: 1,
        })

        // Actualizar estado local con la respuesta del backend
        setItems((prev) => {
          const serverItemMap = {}
          ;(result?.items ?? []).forEach((i) => {
            serverItemMap[i.medicationId] = i
          })

          const updated = prev.map((item) => {
            const serverItem = serverItemMap[item.medicationId]
            return serverItem ? { ...item, cartQuantity: serverItem.quantity } : item
          })

          // Si no estaba en el carrito antes, agregarlo
          if (!existing) {
            const serverItem = serverItemMap[medication.medicationId]
            updated.push({
              medicationId: medication.medicationId,
              name: medication.name,
              cartQuantity: serverItem?.quantity ?? 1,
              unitPrice: medication.unitPrice ?? 0,
              stockAvailable: medication.quantity,
            })
          }

          return updated
        })

        setTotalPrice(Number(result?.totalPrice) || 0)
        // Escenario 1 y 2: mensaje de confirmación
        showNotification('success', `"${medication.name}" agregado al carrito`)
      } catch (err) {
        const backendMsg = err?.response?.data?.message
        const msg = backendMsg || 'No se pudo agregar al carrito'
        showNotification('error', msg)
      }
    },
    [items, showNotification]
  )

  const cartCount = items.reduce((sum, item) => sum + item.cartQuantity, 0)

  return (
    <CartContext.Provider
      value={{ items, totalPrice, cartCount, addItem, notification, isOpen, setIsOpen, syncBranch }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return ctx
}
