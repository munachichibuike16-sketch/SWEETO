// Monkey-patch Node.prototype.removeChild and insertBefore to handle Google Translate crashes in React
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('Prevented React removeChild error on translated DOM:', child, 'parent:', this);
      }
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('Prevented React insertBefore error on translated DOM:', newNode, 'ref:', referenceNode, 'parent:', this);
      }
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

// Clean URLs are natively supported by BrowserRouter. Legacy hash URLs are handled in App.jsx.

// Dynamic PWA Manifest & Favicon Switcher (Storefront vs Admin Dashboard)
function updatePWAManifestAndIcons() {
  const hash = window.location.hash || '';
  const isAdminRoute = hash.includes('/dashboard') || hash.includes('/admin') || hash.includes('/chat');

  // 1. Update manifest link
  let manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  const targetManifest = isAdminRoute ? '/admin-manifest.json?v=2' : '/manifest.json?v=2';
  if (manifestLink.getAttribute('href') !== targetManifest) {
    manifestLink.setAttribute('href', targetManifest);
  }

  // 2. Update favicon link
  let faviconLink = document.querySelector('link[rel="icon"]');
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  const targetFavicon = isAdminRoute ? '/admin-favicon.png?v=2' : '/sweeto_logo.png?v=2';
  if (faviconLink.getAttribute('href') !== targetFavicon) {
    faviconLink.setAttribute('href', targetFavicon);
  }

  // 3. Update apple touch icon link
  let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleIconLink) {
    appleIconLink = document.createElement('link');
    appleIconLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleIconLink);
  }
  const targetAppleIcon = isAdminRoute ? '/admin-apple-touch-icon.png?v=2' : '/apple-touch-icon.png?v=2';
  if (appleIconLink.getAttribute('href') !== targetAppleIcon) {
    appleIconLink.setAttribute('href', targetAppleIcon);
  }

  // 4. Update title/theme-color meta tags
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isAdminRoute ? '#150E28' : '#020617');
  }
  
  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', isAdminRoute ? 'SWEETO ADMIN' : 'SWEETO');
  }
}

// Run immediately on page load
updatePWAManifestAndIcons();

// Listen for subsequent hash navigation changes
window.addEventListener('hashchange', updatePWAManifestAndIcons);

import React, { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DesktopApp from './DesktopApp.jsx'

import { StoreProvider } from './contexts/StoreContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <StoreProvider>
          <CartProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </CartProvider>
        </StoreProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
