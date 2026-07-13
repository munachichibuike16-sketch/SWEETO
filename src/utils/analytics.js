import { supabase } from '../lib/supabase';

// Browser detection helper
const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Edg")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Other";
};

// PWA detection helper
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || false;
};

// Device name detection helper
const detectDeviceName = () => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "iPhone/iPad";
  if (/Android/.test(ua)) {
    const match = ua.match(/Android\s+([^\;]+);\s+([^\;]+)\)/);
    if (match && match[2]) {
      return match[2].trim();
    }
    return "Android Device";
  }
  if (/Windows NT/.test(ua)) {
    if (/Windows NT 10.0/.test(ua)) return "Windows 10/11 PC";
    if (/Windows NT 6.3/.test(ua)) return "Windows 8.1 PC";
    if (/Windows NT 6.2/.test(ua)) return "Windows 8 PC";
    if (/Windows NT 6.1/.test(ua)) return "Windows 7 PC";
    return "Windows PC";
  }
  if (/Macintosh/.test(ua)) return "Macintosh";
  if (/Linux/.test(ua)) return "Linux PC";
  return "Unknown Device";
};

// Referrer detection helper
const detectReferrer = () => {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || params.get('ref') || params.get('source');
  if (utmSource) {
    if (utmSource.toLowerCase().includes('facebook') || utmSource.toLowerCase().includes('fb')) return 'Facebook';
    if (utmSource.toLowerCase().includes('whatsapp') || utmSource.toLowerCase().includes('wa')) return 'WhatsApp';
    if (utmSource.toLowerCase().includes('instagram') || utmSource.toLowerCase().includes('ig')) return 'Instagram';
    if (utmSource.toLowerCase().includes('google')) return 'Google';
    return utmSource;
  }
  
  const ref = document.referrer;
  if (!ref) return 'Direct';
  
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes('facebook.com') || host.includes('fb.me')) return 'Facebook';
    if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('google.com')) return 'Google';
    if (host.includes('t.co') || host.includes('twitter.com') || host.includes('x.com')) return 'Twitter/X';
    if (host.includes(window.location.hostname)) return 'Direct';
    return url.hostname;
  } catch (e) {
    return 'Direct';
  }
};

export const logVisitorEvent = async (pagePath, eventType, optionalProductName = '') => {
  if (!supabase) return;

  try {
    let country = window.localStorage.getItem('user_country');
    let geoCached = window.localStorage.getItem('user_geo_data');
    let city = '';

    if (!country || !geoCached) {
      try {
        const res = await fetch('https://ipwho.is/');
        if (res.ok) {
          const info = await res.json();
          if (info && info.success !== false) {
            country = info.country_code || 'Unknown';
            city = info.city || '';
            window.localStorage.setItem('user_country', country);
            window.localStorage.setItem('user_geo_data', JSON.stringify(info));
          }
        }
      } catch (e) {
        console.error("Geo lookup failed:", e);
      }
    } else {
      try {
        const geo = JSON.parse(geoCached);
        city = geo.city || '';
      } catch (e) {}
    }

    country = country || 'Unknown';

    const browser = isPWA() ? "PWA" : detectBrowser();
    const deviceName = detectDeviceName();
    const referrer = detectReferrer();

    const metaObj = {
      browser,
      device: deviceName,
      referrer,
      city,
      product: optionalProductName
    };

    const userAgentStr = "METADATA:" + JSON.stringify(metaObj);

    await supabase.from('visitor_log').insert([{
      page_path: pagePath,
      event_type: eventType,
      country: country,
      user_agent: userAgentStr
    }]);

    // Also send locally if needed (optional backend sync)
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: pagePath,
        country: country,
        event_type: eventType,
        user_agent: userAgentStr
      })
    }).catch(() => {});

  } catch (err) {
    console.error("Failed to log visitor event:", err);
  }
};
