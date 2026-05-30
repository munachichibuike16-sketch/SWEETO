// Auto-redirect legacy non-hash URLs to HashRouter format
(function() {
  const pathname = window.location.pathname;
  if (!window.location.hash) {
    const knownRoutes = [
      '/dashboard', '/admin', '/product/', '/wishlist', '/notifications',
      '/login', '/register', '/auth', '/deals', '/trending', '/new-arrivals',
      '/featured', '/visit', '/privacy', '/terms', '/security', '/checkout',
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
