"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
interface CartItem {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
  link?: string;        // ✅ Product URL
  condition?: string;   // ✅ Good, Average, Bad
  description?: string; // ✅ Product details
}
interface CartContextType { items: CartItem[]; addToCart: (item: CartItem) => void; removeFromCart: (id: string) => void; updateQty: (id: string, q: number) => void; clearCart: () => void; totalItems: number; totalPrice: number }
const CartContext = createContext<CartContextType | undefined>(undefined)
const CART_STORAGE_KEY = 'ab_cart_items'
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch (error) {
      console.error('Failed to load cart from storage', error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save cart to storage', error)
    }
  }, [items])

  const addToCart = (item: CartItem) => setItems(prev => { const e = prev.find(p => p.id === item.id); if (e) return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p); return [...prev, { ...item, quantity: 1 }] })
  const removeFromCart = (id: string) => setItems(prev => prev.filter(p => p.id !== id))
  const updateQty = (id: string, q: number) => { if (q < 1) { removeFromCart(id); return } setItems(prev => prev.map(p => p.id === id ? { ...p, quantity: q } : p)) }
  const clearCart = () => setItems([])
  const totalItems = items.reduce((s, p) => s + p.quantity, 0)
  const totalPrice = items.reduce((s, p) => s + (Number((p.price || "").replace(/[^\d]/g, "")) || 0) * p.quantity, 0)
  return <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>{children}</CartContext.Provider>
}
export function useCart() { const c = useContext(CartContext); if (!c) throw new Error("useCart must be inside CartProvider"); return c }