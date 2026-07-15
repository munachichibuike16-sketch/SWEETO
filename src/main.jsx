// Auto-redirect legacy non-hash URLs to HashRouter format
(function() {
  const pathname = window.location.pathname;
  if (!window.location.hash) {
    const knownRoutes = [
      '/dashboard', '/admin', '/product/', '/wishlist', '/notifications',
      '/login', '/register', '/auth', '/deals', '/trending', '/new-arrivals',
      '/featured', '/visit', '/privacy', '/terms', '/security', '/refund', '/checkout',
      '/order-tracking/', '/swto-deliver', '/category/'
    ];

    for (const route of knownRoutes) {
      if (pathname.includes(route)) {
        const routeIndex = pathname.indexOf(route);
        const basePath = pathname.substring(0, routeIndex);
        const routePath = pathname.substring(routeIndex);
        const targetRoute = routePath.startsWith('/admin') ? '/dashboard' : routePath;
        const newUrl = window.location.origin + basePath + '/#' + targetRoute + window.location.search;
        window.location.replace(newUrl);
        break;
      }
    }
  }
})();

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
  const targetManifest = isAdminRoute ? '/admin-manifest.json' : '/manifest.json';
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
  const targetFavicon = isAdminRoute ? '/admin-favicon.svg' : '/favicon.svg';
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
  const targetAppleIcon = isAdminRoute ? '/admin-apple-touch-icon.png' : '/apple-touch-icon.png';
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

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
