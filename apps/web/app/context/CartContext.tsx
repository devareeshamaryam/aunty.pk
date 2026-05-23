'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
  slug?: string
  maxStock?: number
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isLoading: boolean
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variant?: string) => void
  updateQuantity: (productId: string, quantity: number, variant?: string) => void
  clearCart: () => void
  getItemQuantity: (productId: string, variant?: string) => number
  isItemInCart: (productId: string, variant?: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setItems(Array.isArray(parsedCart) ? parsedCart : [])
      } catch (error) {
        console.error('Failed to load cart:', error)
        setItems([])
      }
    }
    setIsLoading(false)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, isLoading])

  const getItemKey = (productId: string, variant?: string) => {
    return variant ? `${productId}-${variant}` : productId
  }

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const itemKey = getItemKey(item.productId, item.variant)
      const existing = prev.find((i) => getItemKey(i.productId, i.variant) === itemKey)
      
      if (existing) {
        const newQuantity = existing.quantity + item.quantity
        const maxStock = item.maxStock || 999
        
        if (newQuantity > maxStock) {
          console.log(`Only ${maxStock} items available in stock`)
          return prev.map((i) =>
            getItemKey(i.productId, i.variant) === itemKey
              ? { ...i, quantity: maxStock }
              : i
          )
        }
        
        return prev.map((i) =>
          getItemKey(i.productId, i.variant) === itemKey
            ? { ...i, quantity: newQuantity }
            : i
        )
      }
      
      return [...prev, item]
    })
  }

  const removeItem = (productId: string, variant?: string) => {
    const itemKey = getItemKey(productId, variant)
    setItems((prev) => prev.filter((i) => getItemKey(i.productId, i.variant) !== itemKey))
  }

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variant)
      return
    }
    
    const itemKey = getItemKey(productId, variant)
    setItems((prev) =>
      prev.map((i) => {
        if (getItemKey(i.productId, i.variant) === itemKey) {
          const maxStock = i.maxStock || 999
          if (quantity > maxStock) {
            return { ...i, quantity: maxStock }
          }
          return { ...i, quantity }
        }
        return i
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getItemQuantity = (productId: string, variant?: string) => {
    const itemKey = getItemKey(productId, variant)
    const item = items.find((i) => getItemKey(i.productId, i.variant) === itemKey)
    return item ? item.quantity : 0
  }

  const isItemInCart = (productId: string, variant?: string) => {
    return getItemQuantity(productId, variant) > 0
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        isItemInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}