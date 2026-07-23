import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { playSound } from '../utils/sound';
import { useStore } from './StoreContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { products, showToast } = useStore();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('sweeto_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sweeto_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    playSound('cart_add');
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    if (showToast) {
      showToast(`${product.name} added to cart! 🛒✨`, 'success');
    }
  };

  const removeFromCart = (productId) => {
    const item = cartItems.find(i => i.id === productId);
    setCartItems(prev => prev.filter(item => item.id !== productId));
    if (showToast && item) {
      showToast(`${item.name} removed from cart.`, 'info');
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setCartItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    if (showToast) {
      showToast('Cart cleared.', 'info');
    }
  };

  const mappedCartItems = useMemo(() => {
    return cartItems.map(item => {
      const liveProduct = products.find(p => p.id === item.id);
      if (liveProduct) {
        return {
          ...item,
          price: liveProduct.price,
          original_price: liveProduct.original_price,
        };
      }
      return item;
    });
  }, [cartItems, products]);

  const cartCount = mappedCartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = mappedCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cartItems: mappedCartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
