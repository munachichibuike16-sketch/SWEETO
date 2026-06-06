import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { playSound } from '../utils/sound';
import { API_BASE_URL, apiFetch, isLocalHost } from '../utils/api';

const normalizeProductTitle = (title) => {
  if (!title) return '';
  let cleaned = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const acronyms = ['jbl', 'hp', 'lg', 'tv', 'anc', 'ssd', 'ram', 'usb', 'cpu', 'gpu', 'probook', 'fcfa', 'otg', 'hdmi'];
  return cleaned.split(' ').map(word => {
    const lowerWord = word.toLowerCase();
    if (acronyms.includes(lowerWord)) return word.toUpperCase();
    if (/^[a-z]+\d+$/i.test(word) || /^\d+$/.test(word)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [videoAds, setVideoAds] = useState([]);
  const [sections, setSections] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track previous products for native notification comparison
  const prevProductsRef = useRef(null);
  const hasInitialLoadRef = useRef(false);
  const notifiedProductIdsRef = useRef(new Set());

  const [settings, setSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [realtimeNotification, setRealtimeNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestConfirm = (options) => {
    setConfirmDialog(options);
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  // Helper: Convert URL-safe base64 string to Uint8Array for VAPID subscription
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Request browser notification permission on storefront mount (not on admin pages)
  useEffect(() => {
    const isAdminPage = window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/admin') || window.location.hash.includes('/dashboard') || window.location.hash.includes('/admin');
    if (isAdminPage) return;
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      // Small delay so it doesn't fire immediately on page load
      const timer = setTimeout(() => {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            window.location.reload();
          }
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Register Service Worker and subscribe to closed-tab background push notifications
  useEffect(() => {
    const isAdminPage = window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/admin') || window.location.hash.includes('/dashboard') || window.location.hash.includes('/admin');
    if (isAdminPage) return;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(async (registration) => {
          console.log('✅ Service Worker registered successfully.');

          // Listen for route messages from Service Worker (to open specific product details)
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'ROUTE_TO') {
              console.log('Routing to Service Worker destination:', event.data.url);
              window.location.hash = event.data.url.replace(/^\/?#?/, '#');
            }
          });

          // Check for push subscription permission
          if (Notification.permission === 'granted') {
            try {
              // 1. Fetch public VAPID key from Supabase settings table
              const { data: settingData, error: settingErr } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'vapid_public_key')
                .single();
              
              if (settingErr) throw settingErr;
              const publicKey = settingData?.value;
              
              if (!publicKey) return;
              
              const applicationServerKey = urlBase64ToUint8Array(publicKey);

              // 2. Subscribe the user device to the push service
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
              });

              console.log('✅ Successfully subscribed to closed-tab Web Push API:', subscription);

              // 3. Post subscription keys directly to Supabase push_subscriptions table
              const rawSub = subscription.toJSON();
              const { error: subErr } = await supabase
                .from('push_subscriptions')
                .upsert({
                  endpoint: subscription.endpoint,
                  p256dh: rawSub.keys?.p256dh || '',
                  auth: rawSub.keys?.auth || '',
                  role: 'customer'
                }, { onConflict: 'endpoint' });

              if (subErr) throw subErr;
              console.log('✅ Registered Web Push subscription with Supabase database.');
            } catch (err) {
              console.warn('⚠️ Web Push subscription failed:', err);
            }
          }
        })
        .catch((err) => {
          console.error('❌ Service Worker registration failed:', err);
        });
    }
  }, []);

  // Helper: fire a native browser notification
  const fireNativeNotification = useCallback((title, body, url) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(title, {
        body,
        tag: `store-${Date.now()}`,
        requireInteraction: false
      });
      notification.onclick = () => {
        window.focus();
        if (url) window.location.href = url;
        notification.close();
      };

      // WhatsApp Style: Auto-dismiss from native notification drawer after 10 minutes if unread
      setTimeout(() => {
        notification.close();
      }, 10 * 60 * 1000); // 10 minutes
    } catch (err) {
      console.log('Native notification error:', err);
    }
  }, []);

  // Trigger in-app visual banner notification for online users
  const triggerInAppNotification = useCallback((product) => {
    if (!product || !product.id) return;
    if (notifiedProductIdsRef.current.has(product.id)) return;

    // Track recently notified IDs to prevent duplicate alerts
    notifiedProductIdsRef.current.add(product.id);

    // Play latency-free chime sound effect and trigger haptics
    playSound('chime');

    // Trigger visual pop-up state
    setRealtimeNotification(product);

    // Auto-dismiss the visual in-app banner after 8 seconds
    setTimeout(() => {
      setRealtimeNotification(prev => prev?.id === product.id ? null : prev);
    }, 8000);
  }, []);

  // Detect new products and price drops, fire native and in-app notifications
  useEffect(() => {
    const isAdminPage = window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/admin') || window.location.hash.includes('/dashboard') || window.location.hash.includes('/admin');
    if (isAdminPage) return;

    if (!products || products.length === 0) return;

    // Skip the very first load — only notify on subsequent updates
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      prevProductsRef.current = new Map(products.map(p => [p.id, p]));
      return;
    }

    const prevMap = prevProductsRef.current;
    if (!prevMap) {
      prevProductsRef.current = new Map(products.map(p => [p.id, p]));
      return;
    }

    // Helper: persist a notification to localStorage for the Notifications page
    const persistNotification = (notif) => {
      try {
        const stored = JSON.parse(localStorage.getItem('product_notifications') || '[]');
        // Prevent duplicates by checking id
        if (!stored.find(n => n.id === notif.id)) {
          stored.unshift(notif);
          // Keep max 50 notifications
          if (stored.length > 50) stored.length = 50;
          localStorage.setItem('product_notifications', JSON.stringify(stored));
        }
      } catch (e) { console.warn('Failed to persist notification:', e); }
    };

    // Detect new arrivals
    const newProducts = products.filter(p => !prevMap.has(p.id));
    if (newProducts.length > 0) {
      const first = newProducts[0];
      const title = newProducts.length === 1
        ? `🆕 New Arrival: ${first.name}`
        : `🆕 ${newProducts.length} New Products Just Arrived!`;
      const body = newProducts.length === 1
        ? `Check out the new ${first.category || 'product'} now available in store!`
        : `${newProducts.map(p => p.name).slice(0, 3).join(', ')}${newProducts.length > 3 ? '...' : ''} just dropped!`;
      
      fireNativeNotification(title, body, `/#/product/${first.id}`);
      triggerInAppNotification(first);

      // Persist each new product as an in-app notification
      newProducts.forEach(p => {
        persistNotification({
          id: `new-product-${p.id}`,
          type: 'new_arrival',
          category: 'promos',
          title: `🆕 New Arrival: ${p.name}`,
          message: `Check out the new ${p.category || 'product'} now available in store!`,
          productId: p.id,
          image_url: p.image_url,
          price: p.price,
          productName: p.name,
          productCategory: p.category,
          timestamp: new Date().toISOString(),
          accentColor: '#f59e0b'
        });
      });
    }

    // Detect price drops
    const priceDrops = products.filter(p => {
      const prev = prevMap.get(p.id);
      return prev && Number(p.price) < Number(prev.price);
    });
    if (priceDrops.length > 0) {
      const first = priceDrops[0];
      const prevPrice = prevMap.get(first.id)?.price;
      const dropPercent = prevPrice ? Math.round(((prevPrice - first.price) / prevPrice) * 100) : 0;
      const title = priceDrops.length === 1
        ? `🔥 Price Drop: ${first.name}`
        : `🔥 ${priceDrops.length} Products Just Got Cheaper!`;
      const body = priceDrops.length === 1
        ? `Now ${dropPercent}% off! Don't miss this deal.`
        : `${priceDrops.map(p => p.name).slice(0, 3).join(', ')} and more!`;
      
      fireNativeNotification(title, body, `/#/product/${first.id}`);
      triggerInAppNotification(first);

      // Persist each price drop as an in-app notification
      priceDrops.forEach(p => {
        const prev = prevMap.get(p.id);
        const pct = prev ? Math.round(((prev.price - p.price) / prev.price) * 100) : 0;
        persistNotification({
          id: `price-drop-${p.id}-${Date.now()}`,
          type: 'price_drop',
          category: 'promos',
          title: `🔥 Price Drop: ${p.name}`,
          message: `Now ${pct}% off! Was ${Number(prev?.price || 0).toLocaleString()}, now ${Number(p.price).toLocaleString()}.`,
          productId: p.id,
          image_url: p.image_url,
          price: p.price,
          originalPrice: prev?.price,
          productName: p.name,
          productCategory: p.category,
          timestamp: new Date().toISOString(),
          accentColor: '#ef4444'
        });
      });
    }

    // Update the snapshot
    prevProductsRef.current = new Map(products.map(p => [p.id, p]));
  }, [products, fireNativeNotification, triggerInAppNotification]);

  const fetchStoreData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [
        { data: catData },
        { data: prodData },
        { data: settingsData },
        { data: adsData },
        { data: sectionsData },
        { data: brandsData },
        { data: ordersData },
        { data: reviewsData }
      ] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
        supabase.from('settings').select('*'),
        supabase.from('video_ads').select('*'),
        supabase.from('sections').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('reviews').select('*').eq('is_approved', 1)
      ]);

      if (catData) {
        const formattedCats = catData.map(c => ({
          ...c,
          image_url: c.image_url || c.icon || ''
        }));
        setCategories(prev => JSON.stringify(prev) !== JSON.stringify(formattedCats) ? formattedCats : prev);
      }
      
      if (prodData) {
        const formattedProducts = prodData.map(p => {
          let colors = [];
          let related_products = [];
          let placements = [];
          let additional_images = [];
          try { colors = typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []); } catch(e) {}
          try { related_products = typeof p.related_products === 'string' ? JSON.parse(p.related_products) : (p.related_products || []); } catch(e) {}
          try { placements = typeof p.placements === 'string' ? JSON.parse(p.placements) : (p.placements || []); } catch(e) {}
          try { additional_images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch(e) {}
          
          const productReviews = Array.isArray(reviewsData) 
            ? reviewsData.filter(r => String(r.product_id) === String(p.id) && (r.status === 'approved' || r.is_approved === 1 || r.is_approved === undefined))
            : [];

          return {
            ...p,
            name: normalizeProductTitle(p.name),
            // Support both old schema (stock_quantity/cost_price) and new schema (stock/bought_price)
            stock: p.stock ?? p.stock_quantity ?? 0,
            bought_price: p.bought_price ?? p.cost_price ?? 0,
            status: p.status || (p.is_active ? 'active' : 'inactive'),
            is_daily_deal: p.is_deal,
            is_new_arrival: 1,
            is_trending: 1,
            is_featured: p.is_featured,
            colors,
            related_products,
            placements,
            additional_images,
            images: additional_images,
            reviews: productReviews
          };
        });
        setProducts(prev => JSON.stringify(prev) !== JSON.stringify(formattedProducts) ? formattedProducts : prev);
      }
      
      if (settingsData) {
        const settingsObj = {};
        settingsData.forEach(s => { 
          try {
            settingsObj[s.key] = JSON.parse(s.value);
          } catch (e) {
            settingsObj[s.key] = s.value;
          }
        });
        setSettings(prev => JSON.stringify(prev) !== JSON.stringify(settingsObj) ? settingsObj : prev);
      }
      
      if (adsData) {
        const formattedAds = adsData.map(ad => {
          // Parse JSON-encoded title to support description and linked product in Supabase
          let displayTitle = ad.title || '';
          let description = '';
          let productId = null;
          let ctaText = 'Shop Now';

          try {
            if (ad.title && ad.title.startsWith('{')) {
              const parsed = JSON.parse(ad.title);
              displayTitle = parsed.t || '';
              description = parsed.d || '';
              productId = parsed.p || null;
              ctaText = parsed.c || 'Shop Now';
            }
          } catch (e) {
            // Title is not JSON-encoded, use as-is
          }

          // Auto-detect type (video vs image) based on file extension
          const isVideoFile = ad.video_url && (
            ad.video_url.toLowerCase().includes('.mp4') || 
            ad.video_url.toLowerCase().includes('.webm') || 
            ad.video_url.toLowerCase().includes('.ogg') ||
            ad.video_url.toLowerCase().includes('.mov')
          );
          const type = isVideoFile ? 'video' : 'image';

          return {
            ...ad,
            title: displayTitle,
            description,
            productId,
            ctaText,
            type,
            isActive: ad.is_active === 1 || ad.is_active === true,
            videoUrl: type === 'video' ? ad.video_url : null,
            imageUrl: type === 'image' ? ad.video_url : null,
            views: ad.views || 0,
            clicks: ad.clicks || 0
          };
        });
        setVideoAds(prev => JSON.stringify(prev) !== JSON.stringify(formattedAds) ? formattedAds : prev);
      }

      if (sectionsData) {
        const formattedSections = sectionsData.map(s => ({
          ...s,
          isActive: s.is_active === 1 || s.is_active === true,
          isDual: s.is_dual === 1 || s.is_dual === true || s.isdual === 1 || s.isdual === true || s.isDual === 1 || s.isDual === true,
          showViewAll: s.show_view_all === 1 || s.show_view_all === true || s.showviewall === 1 || s.showviewall === true || s.showViewAll === 1 || s.showViewAll === true,
          maxProducts: s.max_products || s.maxproducts || s.maxProducts || 8,
          headerStyle: s.header_style || s.headerstyle || s.headerStyle || 'gradient',
          headerImage: s.header_image || s.headerimage || s.headerImage,
          category: s.category || 'All',
          role: s.role || 'custom',
          titleB: s.titleb || s.titleB,
          subtitleB: s.subtitleb || s.subtitleB,
          categoryB: s.categoryb || s.categoryB || 'All',
          roleB: s.roleb || s.roleB || 'custom',
          headerStyleB: s.headerstyleb || s.headerStyleB || 'bold',
          headerImageB: s.headerimageb || s.headerImageB
        }));
        // Sort by position just in case
        formattedSections.sort((a, b) => (a.position || 0) - (b.position || 0));
        setSections(prev => JSON.stringify(prev) !== JSON.stringify(formattedSections) ? formattedSections : prev);
      }

      if (brandsData) {
        const formattedBrands = brandsData.map(b => ({
          ...b,
          logo_url: b.logo_url || b.logo || ''
        }));
        setBrands(prev => JSON.stringify(prev) !== JSON.stringify(formattedBrands) ? formattedBrands : prev);
      }
      if (ordersData) setOrders(prev => JSON.stringify(prev) !== JSON.stringify(ordersData) ? ordersData : prev);

      setError(null);
    } catch (err) {
      console.error('Error fetching store data from Supabase:', err);
      // Fallback to SQLite local server if on localhost or local network
      if (isLocalHost()) {
        console.log('Attempting local SQLite database fallback...');
        try {
          const localFetch = async (path) => {
            const res = await apiFetch(path);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return res.json();
          };

          const [
            catData,
            prodData,
            settingsData,
            adsData,
            sectionsData,
            brandsData,
            ordersData,
            reviewsData
          ] = await Promise.all([
            localFetch('/api/categories').catch(() => []),
            localFetch('/api/products').catch(() => []),
            localFetch('/api/settings').catch(() => ({})),
            localFetch('/api/video-ads').catch(() => []),
            localFetch('/api/sections').catch(() => []),
            localFetch('/api/brands').catch(() => []),
            localFetch('/api/orders').catch(() => []),
            localFetch('/api/reviews').catch(() => [])
          ]);

          if (catData) {
            const formattedCats = catData.map(c => ({
              ...c,
              image_url: c.image_url || c.icon || ''
            }));
            setCategories(formattedCats);
          }
          
          if (prodData) {
            const formattedProducts = prodData.map(p => {
              let colors = [];
              let related_products = [];
              let placements = [];
              let additional_images = [];
              try { colors = typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []); } catch(e) {}
              try { related_products = typeof p.related_products === 'string' ? JSON.parse(p.related_products) : (p.related_products || []); } catch(e) {}
              try { placements = typeof p.placements === 'string' ? JSON.parse(p.placements) : (p.placements || []); } catch(e) {}
              try { additional_images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || p.additional_images || []); } catch(e) {}
              
              const productReviews = Array.isArray(reviewsData) 
                ? reviewsData.filter(r => String(r.product_id) === String(p.id) && (r.status === 'approved' || r.is_approved === 1 || r.is_approved === undefined))
                : [];

              return {
                ...p,
                name: normalizeProductTitle(p.name),
                stock: p.stock ?? p.stock_quantity ?? 0,
                bought_price: p.bought_price ?? p.cost_price ?? 0,
                status: p.status || (p.is_active ? 'active' : 'inactive'),
                is_daily_deal: p.is_deal || p.is_daily_deal,
                is_new_arrival: 1,
                is_trending: 1,
                is_featured: p.is_featured,
                colors,
                related_products,
                placements,
                additional_images,
                images: additional_images,
                reviews: productReviews
              };
            });
            setProducts(formattedProducts);
          }
          
          if (settingsData) {
            setSettings(settingsData);
          }
          
          if (adsData) {
            const formattedAds = adsData.map(ad => {
              let displayTitle = ad.title || '';
              let description = '';
              let productId = null;
              let ctaText = 'Shop Now';
              try {
                if (ad.title && ad.title.startsWith('{')) {
                  const parsed = JSON.parse(ad.title);
                  displayTitle = parsed.t || '';
                  description = parsed.d || '';
                  productId = parsed.p || null;
                  ctaText = parsed.c || 'Shop Now';
                }
              } catch (e) {}

              const isVideoFile = ad.video_url && (
                ad.video_url.toLowerCase().includes('.mp4') || 
                ad.video_url.toLowerCase().includes('.webm') || 
                ad.video_url.toLowerCase().includes('.ogg') ||
                ad.video_url.toLowerCase().includes('.mov')
              );
              const type = isVideoFile ? 'video' : 'image';

              return {
                ...ad,
                title: displayTitle,
                description,
                productId,
                ctaText,
                type,
                isActive: ad.is_active === 1 || ad.is_active === true,
                videoUrl: type === 'video' ? ad.video_url : null,
                imageUrl: type === 'image' ? ad.video_url : null,
                views: ad.views || 0,
                clicks: ad.clicks || 0
              };
            });
            setVideoAds(formattedAds);
          }

          if (sectionsData) {
            const formattedSections = sectionsData.map(s => ({
              ...s,
              isActive: s.is_active === 1 || s.is_active === true || s.isActive === 1 || s.isActive === true,
              isDual: s.is_dual === 1 || s.is_dual === true || s.isdual === 1 || s.isdual === true || s.isDual === 1 || s.isDual === true,
              showViewAll: s.show_view_all === 1 || s.show_view_all === true || s.showviewall === 1 || s.showviewall === true || s.showViewAll === 1 || s.showViewAll === true,
              maxProducts: s.max_products || s.maxproducts || s.maxProducts || 8,
              headerStyle: s.header_style || s.headerstyle || s.headerStyle || 'gradient',
              headerImage: s.header_image || s.headerimage || s.headerImage,
              category: s.category || 'All',
              role: s.role || 'custom',
              titleB: s.titleb || s.titleB,
              subtitleB: s.subtitleb || s.subtitleB,
              categoryB: s.categoryb || s.categoryB || 'All',
              roleB: s.roleb || s.roleB || 'custom',
              headerStyleB: s.headerstyleb || s.headerStyleB || 'bold',
              headerImageB: s.headerimageb || s.headerImageB
            }));
            formattedSections.sort((a, b) => (a.position || 0) - (b.position || 0));
            setSections(formattedSections);
          }

          if (brandsData) {
            const formattedBrands = brandsData.map(b => ({
              ...b,
              logo_url: b.logo_url || b.logo || ''
            }));
            setBrands(formattedBrands);
          }
          if (ordersData) setOrders(ordersData);

          setError(null);
          return;
        } catch (localErr) {
          console.error('Error fetching store data from SQLite:', localErr);
        }
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
    // Only poll when NOT on the admin/dashboard pages to prevent input focus loss
    const isAdminPage = window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/admin') || window.location.hash.includes('/dashboard') || window.location.hash.includes('/admin');
    if (isAdminPage) return; // No polling on admin pages
    
    // Poll every 30 seconds for near real-time updates on the storefront
    const pollInterval = setInterval(() => {
      fetchStoreData(true);
    }, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // Subscribe to real-time changes in Supabase products table
  useEffect(() => {
    const isAdminPage = window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/admin') || window.location.hash.includes('/dashboard') || window.location.hash.includes('/admin');
    if (isAdminPage) return;
    if (!supabase) return;

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Realtime change received:', payload);
          const newProduct = payload.new;
          
          const title = `🆕 New Arrival: ${newProduct.name}`;
          const body = `Check out the new ${newProduct.category || 'product'} now available in store!`;
          
          // 1. Native device notification
          fireNativeNotification(title, body, `/#/product/${newProduct.id}`);
          
          // 2. In-app floating clickable notification
          triggerInAppNotification(newProduct);
          
          // 3. Immediately refresh local products state
          fetchStoreData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fireNativeNotification, triggerInAppNotification]);

  useEffect(() => {
    if (settings?.language) {
      document.documentElement.lang = settings.language;
    }
  }, [settings?.language]);

  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem('recently_viewed');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      const tenMins = 10 * 60 * 1000;
      const now = Date.now();
      return parsed.filter(p => (now - (p.viewed_at || 0)) < tenMins);
    } catch (e) { return []; }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentlyViewed(prev => {
        const tenMins = 10 * 60 * 1000;
        const now = Date.now();
        const filtered = prev.filter(p => (now - (p.viewed_at || 0)) < tenMins);
        if (filtered.length !== prev.length) {
          localStorage.setItem('recently_viewed', JSON.stringify(filtered));
          return filtered;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToRecent = (product) => {
    if (!product) return;
    setRecentlyViewed(prev => {
      const now = Date.now();
      const itemWithTime = { ...product, viewed_at: now };
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [itemWithTime, ...filtered].slice(0, 10);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <StoreContext.Provider value={{ 
      products, 
      categories, 
      brands,
      orders,
      settings,
      videoAds,
      sections,
      loading, 
      error, 
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      selectedBrand,
      setSelectedBrand,
      recentlyViewed,
      addToRecent,
      toast,
      showToast,
      confirmDialog,
      requestConfirm,
      closeConfirm,
      realtimeNotification,
      setRealtimeNotification,
      refreshData: () => fetchStoreData(true) 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
