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
  getCartBranch,
} from '../api/carritoService'

export default function useCart() {
  const [cart, setCart] = useState([])
  const [total, setTotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [unitsCount, setUnitsCount] = useState(0)
  const [branchId, setBranchId] = useState(null)

  // Sincronizar carrito desde localStorage
  const refreshCart = () => {
    const currentCart = getCart()
    setCart(currentCart)
    setTotal(calculateCartTotal(currentCart))
    setItemCount(getCartItemCount())
    setUnitsCount(getCartUnitsCount())
    setBranchId(getCartBranch(currentCart))
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

  const addToCart = (medication, quantity = 1, maxStock = 0, cartBranchId = 0) => {
    const result = addToCartService(medication, quantity, maxStock, cartBranchId)
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
    branchId,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  }
}
