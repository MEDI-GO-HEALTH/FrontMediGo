/**
 * carritoService.js — Gestión del Carrito de Compras
 *
 * Manejo de carrito local (localStorage) con validaciones de stock
 */

const CART_STORAGE_KEY = 'medigo_shopping_cart'

/**
 * Obtiene el carrito actual del localStorage
 * @returns {Array} Array de items del carrito
 */
export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Guarda el carrito en localStorage
 * @param {Array} cart - Items del carrito
 */
const saveCart = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // Ignorar errores de localStorage (modo privado, etc)
  }
}

/**
 * Agrega un medicamento al carrito
 * @param {Object} medication - Datos del medicamento
 * @param {Number} quantity - Cantidad a agregar (default: 1)
 * @param {Number} maxStock - Stock disponible máximo
 * @returns {Object} { success, message, cartItem, cartTotal }
 */
export const addToCart = (medication, quantity = 1, maxStock = 0) => {
  if (!medication) {
    return { success: false, message: 'Medicamento no válido' }
  }

  if (maxStock <= 0) {
    return { success: false, message: 'No hay stock disponible' }
  }

  const medicationId = Number(medication.medicationId ?? medication.id ?? 0)
  if (medicationId <= 0) {
    return { success: false, message: 'ID de medicamento no válido' }
  }

  const addQuantity = Math.max(1, Number(quantity || 1))

  const cart = getCart()
  const existingItem = cart.find((item) => item.medicationId === medicationId)

  if (existingItem) {
    const newQuantity = existingItem.quantity + addQuantity

    if (newQuantity > maxStock) {
      return {
        success: false,
        message: `No hay suficiente stock disponible. Máximo: ${maxStock} unidades`,
      }
    }

    existingItem.quantity = newQuantity
    existingItem.lastUpdated = new Date().toISOString()
  } else {
    if (addQuantity > maxStock) {
      return {
        success: false,
        message: `No hay suficiente stock disponible. Máximo: ${maxStock} unidades`,
      }
    }

    cart.push({
      medicationId,
      name: medication.name || medication.medicationName || `Medicamento #${medicationId}`,
      unit: medication.unit || 'unidad',
      price: Number(medication.price ?? medication.unitPrice ?? 0),
      quantity: addQuantity,
      maxStock,
      branchId: Number(medication.branchId ?? 0),
      addedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    })
  }

  saveCart(cart)

  const cartItem = cart.find((item) => item.medicationId === medicationId)
  const cartTotal = calculateCartTotal(cart)

  return {
    success: true,
    message: existingItem
      ? `Cantidad actualizada a ${cartItem.quantity} unidades`
      : `"${cartItem.name}" agregado al carrito`,
    cartItem,
    cartTotal,
  }
}

/**
 * Actualiza la cantidad de un medicamento en el carrito
 * @param {Number} medicationId - ID del medicamento
 * @param {Number} newQuantity - Nueva cantidad
 * @param {Number} maxStock - Stock máximo disponible
 * @returns {Object} { success, message, cartItem }
 */
export const updateCartQuantity = (medicationId, newQuantity, maxStock = 0) => {
  const quantity = Math.max(0, Number(newQuantity || 0))

  if (quantity > maxStock) {
    return {
      success: false,
      message: `No hay suficiente stock disponible. Máximo: ${maxStock} unidades`,
    }
  }

  const cart = getCart()
  const item = cart.find((i) => i.medicationId === medicationId)

  if (!item) {
    return { success: false, message: 'Medicamento no encontrado en carrito' }
  }

  if (quantity === 0) {
    const index = cart.indexOf(item)
    cart.splice(index, 1)
    saveCart(cart)
    return { success: true, message: 'Producto removido del carrito' }
  }

  item.quantity = quantity
  item.lastUpdated = new Date().toISOString()
  saveCart(cart)

  return {
    success: true,
    message: 'Cantidad actualizada',
    cartItem: item,
  }
}

/**
 * Remueve un medicamento del carrito
 * @param {Number} medicationId - ID del medicamento
 * @returns {Object} { success, message }
 */
export const removeFromCart = (medicationId) => {
  const cart = getCart()
  const initialLength = cart.length
  const filtered = cart.filter((item) => item.medicationId !== medicationId)

  if (filtered.length === initialLength) {
    return { success: false, message: 'Producto no encontrado en carrito' }
  }

  saveCart(filtered)
  return { success: true, message: 'Producto removido del carrito' }
}

/**
 * Calcula el total del carrito
 * @param {Array} cart - Items del carrito (si no se proporciona, obtiene del localStorage)
 * @returns {Number} Total en pesos
 */
export const calculateCartTotal = (cart = null) => {
  const items = cart || getCart()
  return items.reduce((total, item) => {
    const itemPrice = Number(item.price ?? 0)
    const itemQuantity = Number(item.quantity ?? 0)
    return total + itemPrice * itemQuantity
  }, 0)
}

/**
 * Vacía completamente el carrito
 * @returns {Object} { success, message }
 */
export const clearCart = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY)
    return { success: true, message: 'Carrito vaciado' }
  } catch {
    return { success: false, message: 'Error al vaciar carrito' }
  }
}

/**
 * Obtiene el número de items diferentes en el carrito
 * @returns {Number} Cantidad de items
 */
export const getCartItemCount = () => {
  return getCart().length
}

/**
 * Obtiene la cantidad total de unidades en el carrito
 * @returns {Number} Total de unidades
 */
export const getCartUnitsCount = () => {
  return getCart().reduce((total, item) => total + Number(item.quantity ?? 0), 0)
}
