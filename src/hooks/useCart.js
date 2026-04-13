/**
 * useCart.js - Hook personalizado para gestionar el carrito de compras
 *
 * Proporciona funcionalidad reactiva del carrito con validaciones automáticas
 */

import { useEffect, useState } from 'react'
import {
  getCart,
  addToCart as addToCartService,
  updateCartQuantity as updateQuantityService,
  removeFromCart as removeFromCartService,
  calculateCartTotal,
  clearCart as clearCartService,
  getCartItemCount,
  getCartUnitsCount,
} from '../api/carritoService'

export default function useCart() {
  const [cart, setCart] = useState([])
  const [total, setTotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [unitsCount, setUnitsCount] = useState(0)

  // Sincronizar carrito desde localStorage
  const refreshCart = () => {
    const currentCart = getCart()
    setCart(currentCart)
    setTotal(calculateCartTotal(currentCart))
    setItemCount(getCartItemCount())
    setUnitsCount(getCartUnitsCount())
  }

  useEffect(() => {
    refreshCart()

    // Escuchar cambios en otra pestaña
    const handleStorageChange = (event) => {
      if (event.key === 'medigo_shopping_cart') {
        refreshCart()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const addToCart = (medication, quantity = 1, maxStock = 0) => {
    const result = addToCartService(medication, quantity, maxStock)
    if (result.success) {
      refreshCart()
    }
    return result
  }

  const updateQuantity = (medicationId, newQuantity, maxStock = 0) => {
    const result = updateQuantityService(medicationId, newQuantity, maxStock)
    if (result.success) {
      refreshCart()
    }
    return result
  }

  const removeFromCart = (medicationId) => {
    const result = removeFromCartService(medicationId)
    if (result.success) {
      refreshCart()
    }
    return result
  }

  const clearCart = () => {
    const result = clearCartService()
    if (result.success) {
      refreshCart()
    }
    return result
  }

  return {
    cart,
    total,
    itemCount,
    unitsCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  }
}
