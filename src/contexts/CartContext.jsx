import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { playSound } from '../utils/sound';
import { useStore } from './StoreContext';

const CartContext = createContext();

const areColorsEqual = (c1, c2) => {
  if (c1 === undefined || c2 === undefined) return true; // Wildcard if omitted
  if (!c1 && !c2) return true;
  if (!c1 || !c2) return false;
  if (typeof c1 === 'string' && typeof c2 === 'string') return c1 === c2;
  const hex1 = typeof c1 === 'object' ? c1.hex : c1;
  const hex2 = typeof c2 === 'object' ? c2.hex : c2;
  return hex1 === hex2;
};

const areSizesEqual = (s1, s2) => {
  if (s1 === undefined || s2 === undefined) return true; // Wildcard if omitted
  if (!s1 && !s2) return true;
  if (!s1 || !s2) return false;
  return s1.toString() === s2.toString();
};

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
      const existingIndex = prev.findIndex(item => 
        item.id.toString() === product.id.toString() &&
        areColorsEqual(item.selectedColor, product.selectedColor) &&
        areSizesEqual(item.selectedSize, product.selectedSize)
      );
      if (existingIndex !== -1) {
        return prev.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    if (showToast) {
      showToast(`${product.name} added to cart! 🛒✨`, 'success');
    }
  };

  const removeFromCart = (productId, selectedColor, selectedSize) => {
    let removedItem = null;
    setCartItems(prev => {
      let targetIndex = prev.findIndex(item => 
        item.id.toString() === productId.toString() &&
        areColorsEqual(item.selectedColor, selectedColor) &&
        areSizesEqual(item.selectedSize, selectedSize)
      );
      if (targetIndex === -1 && selectedColor === undefined && selectedSize === undefined) {
        targetIndex = prev.findIndex(item => item.id.toString() === productId.toString());
      }
      if (targetIndex !== -1) {
        removedItem = prev[targetIndex];
        return prev.filter((_, idx) => idx !== targetIndex);
      }
      return prev;
    });
    if (showToast && removedItem) {
      showToast(`${removedItem.name} removed from cart.`, 'info');
    }
  };

  const updateQuantity = (productId, quantity, selectedColor, selectedSize) => {
    if (quantity < 1) return removeFromCart(productId, selectedColor, selectedSize);
    setCartItems(prev => {
      let targetIndex = prev.findIndex(item => 
        item.id.toString() === productId.toString() &&
        areColorsEqual(item.selectedColor, selectedColor) &&
        areSizesEqual(item.selectedSize, selectedSize)
      );
      if (targetIndex === -1 && selectedColor === undefined && selectedSize === undefined) {
        targetIndex = prev.findIndex(item => item.id.toString() === productId.toString());
      }
      if (targetIndex !== -1) {
        return prev.map((item, idx) => 
          idx === targetIndex ? { ...item, quantity } : item
        );
      }
      return prev;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (showToast) {
      showToast('Cart cleared.', 'info');
    }
  };

  const mappedCartItems = useMemo(() => {
    return cartItems.map(item => {
      const liveProduct = products.find(p => p.id.toString() === item.id.toString());
      if (liveProduct) {
        const hasVariant = item.name && item.name.includes('(') && item.name.includes(')');
        return {
          ...item,
          price: hasVariant ? item.price : liveProduct.price,
          original_price: liveProduct.original_price || item.original_price,
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
