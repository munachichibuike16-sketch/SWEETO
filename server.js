import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// ESM fix for __dirname
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase server-side client for token verification
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAdmin = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseAdmin) {
  console.warn('⚠️  Supabase credentials not found — admin auth will reject all requests.');
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const app = express();
const port = 3000;

// ── Supabase Auth Middleware ──────────────────────────────────────
async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server auth not configured' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Retrieve admin email from SQLite to compare with JWT email
    let adminEmail = '';
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_email'").get();
      if (row) {
        try {
          adminEmail = JSON.parse(row.value);
        } catch (e) {
          adminEmail = row.value;
        }
      }
    } catch (dbErr) {
      console.error('Error fetching admin email from database:', dbErr);
    }

    const adminEmailEnv = process.env.ADMIN_EMAIL;
    if (user.email !== adminEmail && (!adminEmailEnv || user.email !== adminEmailEnv)) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized as an admin' });
    }

    req.admin = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}

// Optional: check if request has a valid admin token (non-blocking)
async function getAdminFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || !supabaseAdmin) return null;
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;

    // Retrieve admin email from SQLite to compare with JWT email
    let adminEmail = '';
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_email'").get();
      if (row) {
        try {
          adminEmail = JSON.parse(row.value);
        } catch (e) {
          adminEmail = row.value;
        }
      }
    } catch (dbErr) {
      console.error('Error fetching admin email from database:', dbErr);
    }

    const adminEmailEnv = process.env.ADMIN_EMAIL;
    if (user.email !== adminEmail && (!adminEmailEnv || user.email !== adminEmailEnv)) return null;

    return user;
  } catch {
    return null;
  }
}

console.log('Starting server...');
// Database Setup
console.log('Initializing database...');
const db = new Database('shop.db', { verbose: console.log });
console.log('Database connected.');

// Clean up legacy default admin email from settings
try {
  db.prepare("UPDATE settings SET value = '' WHERE key = 'admin_email' AND (value = 'admin@sweetohub.com' OR value = '\"admin@sweetohub.com\"')").run();
} catch (err) {
  console.error('Failed to clean up legacy admin email:', err);
}

// Create tables if they don't exist
console.log('Creating tables...');
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    parent_id INTEGER,
    description TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    image_url TEXT,
    show_daily_deals INTEGER DEFAULT 1,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    is_featured INTEGER DEFAULT 0,
    is_trending INTEGER DEFAULT 0,
    is_daily_deal INTEGER DEFAULT 0,
    is_new_arrival INTEGER DEFAULT 0,
    colors TEXT DEFAULT '[]',
    related_products TEXT DEFAULT '[]',
    additional_images TEXT DEFAULT '[]',
    discount REAL DEFAULT 0,
    original_price REAL,
    smartphones_placement INTEGER DEFAULT 0,
    home_cinema_placement INTEGER DEFAULT 0,
    speakers_placement INTEGER DEFAULT 0,
    refrigerators_placement INTEGER DEFAULT 0,
    brand_id INTEGER,
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    condition TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_contact TEXT,
    items TEXT, -- JSON array of products sold
    total REAL,
    total_items INTEGER DEFAULT 1,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS video_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    product_id INTEGER,
    video_url TEXT,
    image_url TEXT,
    type TEXT DEFAULT 'video',
    description TEXT,
    is_active INTEGER DEFAULT 1,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visitor_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    user_agent TEXT,
    page_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS successful_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE NOT NULL,
    search_count INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS failed_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE NOT NULL,
    search_count INTEGER DEFAULT 1,
    bounce_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    zone TEXT,
    pin TEXT DEFAULT '1234',
    status TEXT DEFAULT 'available',
    rating REAL DEFAULT 5.0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    category TEXT DEFAULT 'All',
    maxProducts INTEGER DEFAULT 8,
    position INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    headerStyle TEXT DEFAULT 'modern',
    headerImage TEXT,
    isDual INTEGER DEFAULT 0,
    titleB TEXT,
    subtitleB TEXT,
    categoryB TEXT DEFAULT 'All',
    roleB TEXT,
    headerStyleB TEXT DEFAULT 'bold',
    headerImageB TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shipping_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, flagged
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_by TEXT,
    used_at TEXT,
    code_type TEXT DEFAULT 'custom',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('Tables created.');

// Migrations
console.log('Running migrations...');
try { db.exec('ALTER TABLE promo_codes ADD COLUMN code_type TEXT DEFAULT \'custom\''); } catch (e) {}
try { db.exec('ALTER TABLE products ADD COLUMN brand_id INTEGER'); } catch (e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN customer_contact TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN items TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN total_items INTEGER DEFAULT 1'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN total_amount REAL'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN tracking_stage TEXT DEFAULT \'placed\''); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN tracking_number TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN eta TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN tracking_note TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE products ADD COLUMN bought_price REAL DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE categories ADD COLUMN image_url TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE categories ADD COLUMN show_daily_deals INTEGER DEFAULT 1'); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN isDual INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN titleB TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN subtitleB TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN categoryB TEXT DEFAULT \'All\''); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN roleB TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN headerStyleB TEXT DEFAULT \'bold\''); } catch (e) {}
try { db.exec('ALTER TABLE sections ADD COLUMN headerImageB TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE products ADD COLUMN placements TEXT DEFAULT "[]"'); } catch (e) {}
try { db.exec('ALTER TABLE products ADD COLUMN condition TEXT DEFAULT "new"'); } catch (e) {}

// Real-Time Delivery Tracking Migrations
try { db.exec('ALTER TABLE orders ADD COLUMN delivery_agent_id INTEGER'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN destination_lat REAL'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN destination_lng REAL'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN agent_lat REAL'); } catch(e) {}
try { db.exec('ALTER TABLE orders ADD COLUMN agent_lng REAL'); } catch(e) {}
try { db.exec('ALTER TABLE shipping_zones ADD COLUMN lat REAL'); } catch(e) {}
try { db.exec('ALTER TABLE shipping_zones ADD COLUMN lng REAL'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN pin TEXT DEFAULT "1234"'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN email TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN dob TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN address TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN plate_number TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN vehicle_name TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN photo_id TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE agents ADD COLUMN approval_status TEXT DEFAULT "approved"'); } catch(e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_location_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    agent_id INTEGER,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    accuracy REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Visitor tracking migrations
try { db.exec('ALTER TABLE visitor_log ADD COLUMN country TEXT DEFAULT "Unknown"'); } catch (e) {}
try { db.exec('ALTER TABLE visitor_log ADD COLUMN event_type TEXT DEFAULT "page_view"'); } catch (e) {}
try { db.exec('ALTER TABLE visitor_log ADD COLUMN device_id TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE push_subscriptions ADD COLUMN role TEXT DEFAULT "customer"'); } catch (e) {}

// Seed visitor logs removed - we only want real visitors
try {
  // Clear any existing logs on startup to clean out old mock logs
  db.prepare('DELETE FROM visitor_log').run();
  console.log('Cleared visitor_log table to remove mock/legacy entries.');
} catch (err) {
  console.error('Error clearing old visitor logs:', err);
}

// Initial Seeding
console.log('Initial check completed.');

const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
if (settingsCount === 0) {
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('store_name', 'SWEETO HUB');
  insertSetting.run('store_email', 'hello@sweeto.com');
  insertSetting.run('store_phone', '');
  insertSetting.run('currency', 'FCFA');
  insertSetting.run('language', 'en');
  insertSetting.run('tax_rate', '0');
  insertSetting.run('shipping_fee', '2000');
  insertSetting.run('admin_pin', '');
  insertSetting.run('admin_email', '');
  insertSetting.run('admin_key', 'admin123');
  insertSetting.run('enable_maintenance', 'false');
  insertSetting.run('hero_layout', 'grid');
  insertSetting.run('gemini_api_key', '');
} else {
  // Ensure all new keys exist even if settings table was already seeded
  const ensureSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  ensureSetting.run('store_phone', '');
  ensureSetting.run('language', 'en');
  ensureSetting.run('admin_pin', '');
  ensureSetting.run('admin_email', '');
  ensureSetting.run('admin_key', 'admin123');
  ensureSetting.run('enable_maintenance', 'false');
  ensureSetting.run('hero_layout', 'grid');
  ensureSetting.run('about_story', '');
  ensureSetting.run('about_mission', '');
  ensureSetting.run('social_instagram', '');
  ensureSetting.run('social_facebook', '');
  ensureSetting.run('social_twitter', '');
  ensureSetting.run('social_whatsapp', '');
  ensureSetting.run('loc_address', '');
  ensureSetting.run('loc_city', 'Abidjan');
  ensureSetting.run('loc_country', 'Côte d\'Ivoire');
  ensureSetting.run('loc_hours_weekday', '08:00 – 20:00');
  ensureSetting.run('loc_hours_sat', '09:00 – 18:00');
  ensureSetting.run('loc_hours_sun', 'Closed');
  ensureSetting.run('loc_map_embed', '');
  ensureSetting.run('policy_privacy', '');
  ensureSetting.run('policy_terms', '');
  ensureSetting.run('gemini_api_key', '');
}

// Seed standard Côte d'Ivoire shipping zones with coordinates if empty
try {
  const zonesCount = db.prepare('SELECT COUNT(*) as count FROM shipping_zones').get().count;
  if (zonesCount === 0) {
    console.log('🌍 Seeding standard Côte d\'Ivoire communes and shipping zones...');
    const defaultZones = [
      { name: 'Cocody', price: 1500, lat: 5.3484, lng: -3.9788 },
      { name: 'Yopougon', price: 2000, lat: 5.3484, lng: -4.0615 },
      { name: 'Marcory', price: 1500, lat: 5.3161, lng: -3.9937 },
      { name: 'Abobo', price: 2500, lat: 5.4161, lng: -4.0150 },
      { name: 'Treichville', price: 1500, lat: 5.3090, lng: -4.0130 },
      { name: 'Koumassi', price: 2000, lat: 5.2970, lng: -3.9630 },
      { name: 'Adjamé', price: 1500, lat: 5.3530, lng: -4.0200 },
      { name: 'Port-Bouët', price: 3000, lat: 5.2600, lng: -3.9550 },
      { name: 'Plateau', price: 1500, lat: 5.3200, lng: -4.0200 },
      { name: 'Attécoubé', price: 2000, lat: 5.3400, lng: -4.0400 },
      { name: 'Yamoussoukro', price: 5000, lat: 6.8161, lng: -5.2740 },
      { name: 'Bouaké', price: 6000, lat: 7.6900, lng: -5.0300 },
      { name: 'San-Pédro', price: 8000, lat: 4.7500, lng: -6.6400 }
    ];
    const insertZone = db.prepare('INSERT INTO shipping_zones (name, price, lat, lng) VALUES (?, ?, ?, ?)');
    defaultZones.forEach(z => {
      insertZone.run(z.name, z.price, z.lat, z.lng);
    });
    console.log('🌍 Seeding standard Côte d\'Ivoire communes completed successfully.');
  }
} catch (err) {
  console.error('Failed to seed standard shipping zones:', err);
}

// Seed default agents if empty
try {
  const agentsCount = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
  if (agentsCount === 0) {
    console.log('🏍️ Seeding default delivery agents...');
    const defaultAgents = [
      { name: 'Marcus Okafor', phone: '+225 0707123456', zone: 'Cocody', pin: '1234', avatar: 'https://i.pravatar.cc/100?img=11', rating: 4.8 },
      { name: 'Emeka Nwosu', phone: '+225 0505123456', zone: 'Marcory', pin: '2345', avatar: 'https://i.pravatar.cc/100?img=15', rating: 4.6 },
      { name: 'Chidi Adebayo', phone: '+225 0101123456', zone: 'Plateau', pin: '3456', avatar: 'https://i.pravatar.cc/100?img=18', rating: 4.9 }
    ];
    const insertAgent = db.prepare('INSERT INTO agents (name, phone, zone, pin, avatar, rating) VALUES (?, ?, ?, ?, ?, ?)');
    defaultAgents.forEach(a => {
      insertAgent.run(a.name, a.phone, a.zone, a.pin, a.avatar, a.rating);
    });
    console.log('🏍️ Seeding default delivery agents completed.');
  }
} catch (err) {
  console.error('Failed to seed default delivery agents:', err);
}

// Seed default promo codes
try {
  const promoCount = db.prepare('SELECT COUNT(*) as count FROM promo_codes').get().count;
  if (promoCount === 0) {
    console.log('🎟️ Seeding default single-use promo codes...');
    const defaultPromos = [
      { code: 'WELCOME10', discount: 10 },
      { code: 'SWEETO15', discount: 15 },
      { code: 'SWEETO20', discount: 20 },
      { code: 'SPECIAL25', discount: 25 },
      { code: 'VIP50', discount: 50 }
    ];
    const insertPromo = db.prepare('INSERT INTO promo_codes (code, discount_percent) VALUES (?, ?)');
    defaultPromos.forEach(p => {
      insertPromo.run(p.code, p.discount);
    });
    console.log('🎟️ Seeding default promo codes completed.');
  }
} catch (err) {
  console.error('Failed to seed default promo codes:', err);
}

// Sync ADMIN_EMAIL environment variable to database settings if provided
if (process.env.ADMIN_EMAIL) {
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_email', ?)").run(process.env.ADMIN_EMAIL);
    console.log(`📡 Dynamically synced ADMIN_EMAIL env (${process.env.ADMIN_EMAIL}) to settings database.`);
  } catch (err) {
    console.error('Failed to sync ADMIN_EMAIL env variable to SQLite database:', err);
  }
}

// Web Push VAPID Keys Setup
let vapidPublicKey = '';
let vapidPrivateKey = '';

try {
  let publicKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'vapid_public_key'").get();
  let privateKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'vapid_private_key'").get();

  if (!publicKeyRow || !privateKeyRow) {
    console.log('🔑 Generating new VAPID keys for background push notifications...');
    const keys = webpush.generateVAPIDKeys();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('vapid_public_key', ?)").run(keys.publicKey);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('vapid_private_key', ?)").run(keys.privateKey);
    vapidPublicKey = keys.publicKey;
    vapidPrivateKey = keys.privateKey;
  } else {
    vapidPublicKey = publicKeyRow.value;
    vapidPrivateKey = privateKeyRow.value;
  }

  // Configure Web Push with VAPID keys
  webpush.setVapidDetails(
    'mailto:hello@sweeto.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('📡 Web Push service configured.');

  // Set default admin phone number and enable alerts
  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_phone', '+2250500619923')").run();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('enable_admin_call_alerts', 'true')").run();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('wave_number', '+2250500619923')").run();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('wave_payment_url', 'https://pay.wave.com/m/M_ci_fZ7c2kHGPRKo/c/ci/')").run();
  } catch (e) {
    console.error('Failed to seed default admin phone settings:', e);
  }
} catch (err) {
  console.error('Failed to configure Web Push:', err);
}

// Helper: Send Web Push Notification to all active background subscribers
async function sendBackgroundPushNotification(title, body, url, image = null, targetRole = null) {
  try {
    let subscriptions = [];
    const endpointsSeen = new Set();

    // 1. Load from Supabase push_subscriptions if available
    if (supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('push_subscriptions').select('*');
        if (targetRole) {
          query = query.eq('role', targetRole);
        }
        const { data, error } = await query;
        if (error) {
          console.error('Failed to fetch subscriptions from Supabase:', error);
        } else if (data) {
          data.forEach(sub => {
            if (sub.endpoint && !endpointsSeen.has(sub.endpoint)) {
              endpointsSeen.add(sub.endpoint);
              subscriptions.push(sub);
            }
          });
        }
      } catch (err) {
        console.error('Failed querying Supabase push subscriptions:', err);
      }
    }

    // 2. Load from local SQLite push_subscriptions
    try {
      let localSubs = [];
      if (targetRole) {
        localSubs = db.prepare('SELECT * FROM push_subscriptions WHERE role = ?').all(targetRole);
      } else {
        localSubs = db.prepare('SELECT * FROM push_subscriptions').all();
      }
      localSubs.forEach(sub => {
        if (sub.endpoint && !endpointsSeen.has(sub.endpoint)) {
          endpointsSeen.add(sub.endpoint);
          subscriptions.push(sub);
        }
      });
    } catch (err) {
      console.error('Failed querying local SQLite push subscriptions:', err);
    }

    console.log(`📡 Sending background push to ${subscriptions.length} subscribers${targetRole ? ` (role: ${targetRole})` : ''}...`);
    
    const payload = JSON.stringify({ title, body, url, image });
    
    const promises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      return webpush.sendNotification(pushSubscription, payload)
        .catch((err) => {
          // If the subscription has expired or is no longer valid, delete it from databases
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ Removing expired push subscription: ${sub.endpoint}`);
            // Delete locally
            db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
            // Delete on Supabase
            if (supabaseAdmin) {
              supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint).then();
            }
          } else {
            console.error('Push notification error for endpoint:', sub.endpoint, err);
          }
        });
    });
    
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to send background push notifications:', err);
  }
}

// Twilio voice call notification for pending orders
async function triggerTwilioVoiceCall(adminPhone, orderId, customerName, total) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_FROM_PHONE;

  if (!accountSid || !authToken || !twilioPhone) {
    console.warn('⚠️ Twilio credentials are not configured in environment variables. Cannot make voice call.');
    return;
  }

  const twiml = `
    <Response>
      <Say voice="alice" language="en-US">
        Hello! You have a new pending order SWT-${orderId} on your Sweeto store from ${customerName || 'a customer'}. 
        The order total is ${total} FCFA. 
        Please review and check the order details on your admin screen. Thank you.
      </Say>
    </Response>
  `;

  try {
    const params = new URLSearchParams();
    params.append('To', adminPhone);
    params.append('From', twilioPhone);
    params.append('Twiml', twiml.trim());

    console.log(`📞 Placing Twilio Voice Call to ${adminPhone} for order SWT-${orderId}...`);
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const resData = await response.json();
    if (response.ok) {
      console.log(`✅ Phone call initiated successfully! Call SID: ${resData.sid}`);
    } else {
      console.error(`❌ Twilio API Error:`, resData);
    }
  } catch (err) {
    console.error(`❌ Failed to trigger Twilio voice call:`, err);
  }
}

function scheduleAdminCallBackup(orderId, customerName, total) {
  setTimeout(() => {
    try {
      // Check if order status is still 'pending' and voice calls are enabled
      const enabledSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('enable_admin_call_alerts');
      const isEnabled = enabledSetting && (enabledSetting.value === 'true' || enabledSetting.value === '1');
      
      if (!isEnabled) {
        console.log(`ℹ️ Admin phone call alerts are disabled. Skipping backup call check for order SWT-${orderId}.`);
        return;
      }

      const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
      if (order && order.status === 'pending') {
        console.log(`☎️ Order SWT-${orderId} is still pending after 1 minute! Initiating backup phone call to admin...`);
        
        // Call the admin's phone number!
        const adminPhoneSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_phone');
        const adminPhone = adminPhoneSetting ? adminPhoneSetting.value : null;
        
        if (adminPhone) {
          triggerTwilioVoiceCall(adminPhone, orderId, customerName, total);
        } else {
          console.warn('⚠️ Admin phone number setting (admin_phone) is not configured in settings. Cannot make backup call.');
        }
      } else {
        console.log(`✅ Order SWT-${orderId} status is "${order?.status || 'unknown'}" (not pending), no backup phone call needed.`);
      }
    } catch (err) {
      console.error('Failed checking pending order status for backup call:', err);
    }
  }, 60000); // 1 minute (60,000 milliseconds)
}


// Seed Sections if empty
const sectionCount = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;
if (sectionCount === 0) {
  console.log('Seeding default sections...');
  const insertSection = db.prepare(`
    INSERT INTO sections (role, title, subtitle, position, isActive, headerStyle)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertSection.run('hero', 'Main Hero', 'Welcome to Sweeto Hub', 0, 1, 'modern');
  insertSection.run('video_ad', 'Video Promotions', 'Featured Advertisements', 1, 1, 'modern');
  insertSection.run('deal_of_the_day', 'Daily Deals', 'Exclusive offers for 24 hours', 2, 1, 'glass');
  insertSection.run('featured', 'Featured Gear', 'Handpicked products for you', 3, 1, 'minimal');
  insertSection.run('trending', 'Trending Now', 'Most popular on our network', 4, 1, 'modern');
}

// Seed mock reviews if empty
try {
  const reviewsCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
  if (reviewsCount === 0) {
    const products = db.prepare('SELECT id FROM products LIMIT 3').all();
    if (products.length > 0) {
      const insertReview = db.prepare('INSERT INTO reviews (product_id, customer_name, rating, comment, status) VALUES (?, ?, ?, ?, ?)');
      insertReview.run(products[0].id, 'Alice Johnson', 5, 'Absolutely spectacular! This is premium build quality at its best.', 'approved');
      insertReview.run(products[0].id, 'David Miller', 4, 'Very good features. Satisfied with the performance, would buy again!', 'approved');
      if (products[1]) {
        insertReview.run(products[1].id, 'Kofi Anan', 3, 'Decent enough, but I expected slightly faster logistics.', 'approved');
      }
      console.log('Seeded default product reviews.');
    }
  }
} catch (e) {
  console.error('Failed to seed reviews:', e);
}


// Private Network Access (PNA) preflight middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.sendStatus(204);
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mp3', '.wav'].includes(ext)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));
console.log('Middleware configured.');

// Auth Login Route — handled entirely by Supabase Auth on the frontend.
// This endpoint is kept as a health-check / fallback.
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    return res.json({ success: true, token: data.session.access_token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Generic Upload Route (Admin only)
app.post('/api/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}`, success: true });
});

// Web Push Subscriptions API
app.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

app.post('/api/push/subscribe', (req, res) => {
  const { endpoint, keys, role } = req.body;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Subscription missing required fields.' });
  }
  
  try {
    db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth, role)
      VALUES (?, ?, ?, ?)
    `).run(endpoint, keys.p256dh, keys.auth, role || 'customer');
    res.json({ success: true, message: 'Push subscription saved successfully.' });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/push/test', (req, res) => {
  try {
    sendBackgroundPushNotification(
      '🔔 SWEETO HUB - Test Push Notification',
      'Awesome! If you are seeing this, push notifications are working perfectly on your mobile device.',
      '/#/'
    );
    res.json({ success: true, message: 'Test push notification triggered.' });
  } catch (err) {
    console.error('Error sending test push:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger push notification for a new product (called by admin frontend after Supabase save)
app.post('/api/push/notify-new-product', authenticateAdmin, (req, res) => {
  try {
    const { name, category, image_url, productId } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    sendBackgroundPushNotification(
      `🆕 New Arrival: ${name}`,
      `Check out the new ${category || 'product'} now available!`,
      `/#/product/${productId || ''}`,
      image_url || null,
      'customer'
    );
    res.json({ success: true, message: 'New product push notification sent.' });
  } catch (err) {
    console.error('Error sending new-product push:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger push notification for a chat message
app.post('/api/push/notify-chat-message', async (req, res) => {
  try {
    const { senderName, messageText, sessionId, targetRole } = req.body;
    if (!senderName || !messageText) {
      return res.status(400).json({ error: 'senderName and messageText are required' });
    }

    const role = targetRole || 'admin';
    const url = '/#/chat';
    const displayBody = messageText.startsWith('http') ? 'Sent a photo 📸' : messageText;

    await sendBackgroundPushNotification(
      `💬 ${senderName}`,
      displayBody,
      url,
      null,
      role
    );
    res.json({ success: true, message: 'Chat push notification triggered.' });
  } catch (err) {
    console.error('Error sending chat push notification:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/push/stats', authenticateAdmin, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM push_subscriptions').get().count;
    const admins = db.prepare("SELECT COUNT(*) as count FROM push_subscriptions WHERE role = 'admin'").get().count;
    const customers = db.prepare("SELECT COUNT(*) as count FROM push_subscriptions WHERE role = 'customer'").get().count;
    res.json({ total, admins, customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics & Event Tracking API
app.post('/api/analytics/search', (req, res) => {
  const { keyword, success } = req.body;
  if (!keyword) return res.status(400).json({ error: 'Keyword is required' });
  const cleaned = keyword.trim().toLowerCase();
  try {
    if (success) {
      db.prepare(`
        INSERT INTO successful_searches (keyword, search_count)
        VALUES (?, 1)
        ON CONFLICT(keyword) DO UPDATE SET search_count = search_count + 1, updated_at = CURRENT_TIMESTAMP
      `).run(cleaned);
    } else {
      db.prepare(`
        INSERT INTO failed_searches (keyword, search_count, bounce_count)
        VALUES (?, 1, 0)
        ON CONFLICT(keyword) DO UPDATE SET search_count = search_count + 1, updated_at = CURRENT_TIMESTAMP
      `).run(cleaned);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analytics/bounce', (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ error: 'Keyword is required' });
  const cleaned = keyword.trim().toLowerCase();
  try {
    db.prepare(`
      UPDATE failed_searches
      SET bounce_count = bounce_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE keyword = ?
    `).run(cleaned);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/successful-searches', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM successful_searches ORDER BY search_count DESC LIMIT 10').all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/failed-searches', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM failed_searches ORDER BY search_count DESC LIMIT 10').all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/visitor-logs', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM visitor_log ORDER BY created_at DESC LIMIT 100').all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/promos', (req, res) => {
  try {
    const promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/promos', (req, res) => {
  const { code, discount_percent, code_type } = req.body;
  if (!code || !discount_percent) {
    return res.status(400).json({ error: 'Promo code and discount percent are required' });
  }
  try {
    const codeUpper = code.toUpperCase().trim();
    const exists = db.prepare('SELECT 1 FROM promo_codes WHERE UPPER(code) = ?').get(codeUpper);
    if (exists) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    const typeVal = code_type || 'custom';
    db.prepare('INSERT INTO promo_codes (code, discount_percent, code_type) VALUES (?, ?, ?)').run(codeUpper, discount_percent, typeVal);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/promos/:code', (req, res) => {
  const { code } = req.params;
  try {
    const result = db.prepare('DELETE FROM promo_codes WHERE UPPER(code) = ?').run(code.toUpperCase());
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Promo code not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/promos/:code', (req, res) => {
  const { code } = req.params;
  try {
    const promo = db.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = ?').get(code.toUpperCase());
    if (promo) {
      res.json(promo);
    } else {
      res.status(404).json({ error: 'Promo code not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/promos/:code/redeem', (req, res) => {
  const { code } = req.params;
  const { phone } = req.body;
  try {
    const result = db.prepare('UPDATE promo_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE UPPER(code) = ? AND is_used = 0').run(phone || null, code.toUpperCase());
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Promo code already used or invalid' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer API Routes
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

// Sections API
app.get('/api/sections', (req, res) => {
  try {
    const sections = db.prepare('SELECT * FROM sections ORDER BY position ASC, created_at DESC').all();
    res.json(sections.map(s => ({
      ...s,
      isActive: s.isActive === 1,
      isDual: s.isDual === 1
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sections', authenticateAdmin, (req, res) => {
  const { 
    role, title, subtitle, category, maxProducts, position, isActive, headerStyle, headerImage,
    isDual, titleB, subtitleB, categoryB, roleB, headerStyleB, headerImageB
  } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO sections (
        role, title, subtitle, category, maxProducts, position, isActive, headerStyle, headerImage,
        isDual, titleB, subtitleB, categoryB, roleB, headerStyleB, headerImageB
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      role, title || null, subtitle || null, category || 'All', 
      maxProducts || 8, position || 0, isActive === false ? 0 : 1,
      headerStyle || 'modern', headerImage || null,
      isDual ? 1 : 0, titleB || null, subtitleB || null, categoryB || 'All',
      roleB || null, headerStyleB || 'bold', headerImageB || null
    );
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sections/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { 
    role, title, subtitle, category, maxProducts, position, isActive, headerStyle, headerImage,
    isDual, titleB, subtitleB, categoryB, roleB, headerStyleB, headerImageB
  } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE sections SET 
        role = ?, title = ?, subtitle = ?, category = ?, 
        maxProducts = ?, position = ?, isActive = ?,
        headerStyle = ?, headerImage = ?,
        isDual = ?, titleB = ?, subtitleB = ?, categoryB = ?, 
        roleB = ?, headerStyleB = ?, headerImageB = ?
      WHERE id = ?
    `);
    stmt.run(
      role, title, subtitle, category, 
      maxProducts, position, isActive === false ? 0 : 1,
      headerStyle, headerImage,
      isDual ? 1 : 0, titleB, subtitleB, categoryB, 
      roleB, headerStyleB, headerImageB,
      id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sections/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/brands', (req, res) => {
  const brands = db.prepare('SELECT * FROM brands').all();
  res.json(brands);
});

const getRealSoldCounts = () => {
  const soldCounts = {};
  try {
    const orders = db.prepare('SELECT items FROM orders').all();
    orders.forEach(order => {
      if (!order.items) return;
      try {
        const items = JSON.parse(order.items);
        if (Array.isArray(items)) {
          items.forEach(item => {
            const pid = item.id;
            const qty = parseInt(item.quantity) || 1;
            if (pid) {
              soldCounts[pid] = (soldCounts[pid] || 0) + qty;
            }
          });
        }
      } catch (e) {}
    });
  } catch (err) {
    console.error("Error calculating real sold counts:", err);
  }
  return soldCounts;
};

app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, b.name as brand 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id 
      ORDER BY p.created_at DESC
    `).all();
    
    const soldCounts = getRealSoldCounts();
    const formatted = products.map(p => {
      let colors = [];
      let related_products = [];
      let placements = [];
      let additional_images = [];
      try { colors = JSON.parse(p.colors || '[]'); } catch(e) {}
      try { related_products = JSON.parse(p.related_products || '[]'); } catch(e) {}
      try { placements = JSON.parse(p.placements || '[]'); } catch(e) {}
      try { additional_images = JSON.parse(p.additional_images || '[]'); } catch(e) {}
      
      const sold_count = soldCounts[p.id] || 0;
      return {
        ...p,
        colors,
        related_products,
        placements,
        additional_images,
        images: additional_images,
        sold_count
      };
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.post('/api/products/describe-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get();
    const apiKey = keyRow ? keyRow.value : '';
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Gemini API Key is not configured. Please add your free Gemini API Key in Store Settings to use this feature.' 
      });
    }

    let base64Data = '';
    let mimeType = 'image/jpeg';
    
    if (imageUrl.startsWith('http')) {
      const imgRes = await fetch(imageUrl);
      const contentType = imgRes.headers.get('content-type');
      if (contentType) mimeType = contentType;
      const buffer = await imgRes.arrayBuffer();
      base64Data = Buffer.from(buffer).toString('base64');
    } else {
      const localPath = path.join(__dirname, imageUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        base64Data = buffer.toString('base64');
        if (imageUrl.endsWith('.png')) mimeType = 'image/png';
        if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
      } else {
        return res.status(400).json({ error: 'Could not resolve image URL locally or online.' });
      }
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const apiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Analyse cette image de produit. Extrais tout texte écrit dessus (spécifications, marque, caractéristiques). Rédige une description de produit professionnelle, vendeuse et attrayante en Français. Structure la description avec des puces claires si nécessaire pour les caractéristiques clés. Donne uniquement le texte de la description rédigée."
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!apiRes.ok) {
      const errData = await apiRes.json();
      throw new Error(errData.error?.message || `Gemini API returned status ${apiRes.status}`);
    }

    const data = await apiRes.json();
    const descriptionText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    res.json({ description: descriptionText.trim() });
  } catch (err) {
    console.error('Image description generation failed:', err);
    res.status(550).json({ error: 'Failed to describe image: ' + err.message });
  }
});

app.get('/share/product/:id', (req, res) => {
  const { id } = req.params;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  
  // Resolve frontend URL
  let redirect = req.query.redirect;
  if (!redirect) {
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      redirect = 'http://localhost:5173';
    } else {
      redirect = 'https://swto.site'; // default frontend URL
    }
  }

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Get currency settings
    let currency = 'FCFA';
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'currency'").get();
      if (row) {
        try { currency = JSON.parse(row.value); } catch (e) { currency = row.value; }
      }
    } catch (e) {}
    
    // Resolve absolute image URL pointing to backend uploads
    let imageUrl = product.image_url || '';
    if (imageUrl && (imageUrl.startsWith('/') || !imageUrl.startsWith('http'))) {
      const cleanedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
      imageUrl = `${protocol}://${host}${cleanedPath}`;
    }

    const priceFormatted = product.price ? `${product.price.toLocaleString()} ${currency}` : '';
    const description = priceFormatted 
      ? `${priceFormatted} - Découvrez ce produit sur SWEETO!` 
      : 'Découvrez ce produit sur SWEETO!';

    const shareUrl = `${redirect}/#/product/${product.id}`;

    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} | SWEETO</title>
  
  <!-- Open Graph Meta Tags (WhatsApp, Facebook, Discord, etc.) -->
  <meta property="og:title" content="${product.name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SWEETO" />
  
  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${product.name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  
  <!-- Redirect immediately to frontend route -->
  <script>
    window.location.replace("${redirect}/#/product/${product.id}");
  </script>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background: #090d16; color: white;">
    <h2 style="margin-bottom: 8px;">Redirecting you to ${product.name}...</h2>
    <p style="color: #64748b; font-size: 14px;">If you are not redirected automatically, <a href="${redirect}/#/product/${product.id}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">click here</a>.</p>
  </div>
</body>
</html>`);
  } catch (err) {
    console.error(`Error in /share/product/${id}:`, err);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/products/${id} requested`);
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (product) {
      let colors = [];
      let related_products = [];
      let placements = [];
      let additional_images = [];
      try { colors = JSON.parse(product.colors || '[]'); } catch(e) {}
      try { related_products = JSON.parse(product.related_products || '[]'); } catch(e) {}
      try { placements = JSON.parse(product.placements || '[]'); } catch(e) {}
      try { additional_images = JSON.parse(product.additional_images || '[]'); } catch(e) {}
      
      const soldCounts = getRealSoldCounts();
      const sold_count = soldCounts[product.id] || 0;
      res.json({
        ...product,
        colors,
        related_products,
        placements,
        additional_images,
        images: additional_images,
        sold_count
      });
    } else {
      console.log(`Product ${id} not found in DB`);
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    console.error(`Error fetching product ${id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', authenticateAdmin, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  const { 
    customer_name, customer_contact, items, 
    total, total_items, status 
  } = req.body;
  
  try {
    const info = db.prepare(`
      INSERT INTO orders (
        customer_name, customer_contact, items, 
        total, total_items, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      customer_name, customer_contact || null, items || '[]', 
      total, total_items || 1, status || 'completed'
    );
    res.json({ id: info.lastInsertRowid, success: true });

    // Trigger admin push notification for new order
    sendBackgroundPushNotification(
      '🛍️ New Order Received!',
      `Order SWT-${info.lastInsertRowid} from ${customer_name || 'Customer'} — ${Number(total || 0).toLocaleString()} FCFA`,
      '/#/dashboard',
      null,
      'admin'
    );

    // Schedule 1-minute pending voice call backup notification
    scheduleAdminCallBackup(info.lastInsertRowid, customer_name, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/settings is defined later, this is a placeholder removed to prevent duplication

app.get('/api/video-ads', (req, res) => {
  try {
    const ads = db.prepare('SELECT * FROM video_ads WHERE is_active = 1 ORDER BY created_at DESC').all();
    res.json(ads.map(ad => ({
      ...ad,
      isActive: ad.is_active === 1,
      productId: ad.product_id,
      videoUrl: ad.video_url,
      imageUrl: ad.image_url,
      views: ad.views || 0,
      clicks: ad.clicks || 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/video-ads/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM video_ads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/video-ads/:id', authenticateAdmin, upload.single('file'), (req, res) => {
  const { id } = req.params;
  const { title, product_id, description, type, is_active } = req.body;
  let file_url = req.body.file_url;

  if (req.file) {
    file_url = `/uploads/${req.file.filename}`;
  }

  try {
    const active_val = (is_active === 'true' || is_active === 1 || is_active === true) ? 1 : 0;
    
    // Determine which URL to update based on type
    const stmt = db.prepare(`
      UPDATE video_ads SET 
        title = ?, product_id = ?, description = ?, type = ?, 
        video_url = CASE WHEN ? = 'video' AND ? IS NOT NULL THEN ? ELSE video_url END,
        image_url = CASE WHEN ? = 'image' AND ? IS NOT NULL THEN ? ELSE image_url END,
        is_active = ?
      WHERE id = ?
    `);
    
    stmt.run(
      title, product_id || null, description || null, type, 
      type, file_url, file_url,
      type, file_url, file_url,
      active_val, id
    );
    
    res.json({ success: true });
  } catch (err) { 
    console.error('Error updating ad:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/video-ads/:id/track-view', (req, res) => {
  try {
    db.prepare('UPDATE video_ads SET views = views + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/video-ads/:id/track-click', (req, res) => {
  try {
    db.prepare('UPDATE video_ads SET clicks = clicks + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Video Ad
app.post('/api/video-ads', authenticateAdmin, upload.single('file'), (req, res) => {
  const { title, product_id, description, type } = req.body;
  let file_url = req.body.file_url; // Fallback if no file uploaded

  if (req.file) {
    file_url = `/uploads/${req.file.filename}`;
  }

  try {
    const stmt = db.prepare('INSERT INTO video_ads (title, product_id, video_url, image_url, type, description) VALUES (?, ?, ?, ?, ?, ?)');
    // If it's a video type, put file in video_url. If image, put in image_url.
    const video_path = type === 'video' ? file_url : null;
    const image_path = type === 'image' ? file_url : null;
    
    const info = stmt.run(title, product_id || null, video_path, image_path, type || 'video', description || null);
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) { 
    console.error('Error creating video ad:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Create Category
app.post('/api/categories', authenticateAdmin, (req, res) => {
  const { id, name, slug, description, image_url, parent_id, show_daily_deals } = req.body;
  console.log('Adding category:', req.body);
  try {
    let info;
    const parentVal = parent_id ? Number(parent_id) : null;
    const dailyDealsVal = show_daily_deals !== undefined ? Number(show_daily_deals) : 1;
    if (id) {
      const stmt = db.prepare('INSERT INTO categories (id, name, slug, description, image_url, parent_id, show_daily_deals) VALUES (?, ?, ?, ?, ?, ?, ?)');
      info = stmt.run(id, name, slug || name.toLowerCase().replace(/ /g, '-'), description || null, image_url || null, parentVal, dailyDealsVal);
    } else {
      const stmt = db.prepare('INSERT INTO categories (name, slug, description, image_url, parent_id, show_daily_deals) VALUES (?, ?, ?, ?, ?, ?)');
      info = stmt.run(name, slug || name.toLowerCase().replace(/ /g, '-'), description || null, image_url || null, parentVal, dailyDealsVal);
    }
    console.log('Category added:', info);
    res.json({ id: id || info.lastInsertRowid, success: true });
  } catch (err) { 
    console.error('Error adding category:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Brand
app.post('/api/brands', authenticateAdmin, (req, res) => {
  const { id, name, logo_url, description } = req.body;
  console.log('Adding brand:', req.body);
  try {
    let info;
    if (id) {
      const stmt = db.prepare('INSERT INTO brands (id, name, logo_url, description) VALUES (?, ?, ?, ?)');
      info = stmt.run(id, name, logo_url || null, description || null);
    } else {
      const stmt = db.prepare('INSERT INTO brands (name, logo_url, description) VALUES (?, ?, ?)');
      info = stmt.run(name, logo_url || null, description || null);
    }
    console.log('Brand added:', info);
    res.json({ id: id || info.lastInsertRowid, success: true });
  } catch (err) { 
    console.error('Error adding brand:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/brands/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Product
app.post('/api/products', authenticateAdmin, upload.single('image'), (req, res) => {
  console.log('--- ADD PRODUCT REQUEST ---');
  console.log('Body:', req.body);
  console.log('File:', req.file);

  const { 
    name, price, category, brand, image_url, stock, description,
    original_price, discount, colors, bought_price,
    is_featured, is_trending, is_daily_deal, is_new_arrival,
    smartphones_placement, home_cinema_placement, speakers_placement, refrigerators_placement,
    placements, condition, additional_images
  } = req.body;

  let final_image_url = image_url;
  if (req.file) {
    final_image_url = `/uploads/${req.file.filename}`;
  }

  console.log('Adding product with image:', final_image_url);
  try {
    const stmt = db.prepare(`
      INSERT INTO products (
        name, price, category, brand_id, image_url, stock, description,
        original_price, discount, colors, bought_price,
        is_featured, is_trending, is_daily_deal, is_new_arrival,
        smartphones_placement, home_cinema_placement, speakers_placement, refrigerators_placement,
        placements, condition, additional_images
      ) 
      VALUES (?, ?, ?, (SELECT id FROM brands WHERE name = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const flags = {
      is_featured: (is_featured === 'true' || is_featured === 1 || is_featured === true) ? 1 : 0,
      is_trending: (is_trending === 'true' || is_trending === 1 || is_trending === true) ? 1 : 0,
      is_daily_deal: (is_daily_deal === 'true' || is_daily_deal === 1 || is_daily_deal === true) ? 1 : 0,
      is_new_arrival: (is_new_arrival === 'true' || is_new_arrival === 1 || is_new_arrival === true) ? 1 : 0,
      smartphones_placement: (smartphones_placement === 'true' || smartphones_placement === 1 || smartphones_placement === true) ? 1 : 0,
      home_cinema_placement: (home_cinema_placement === 'true' || home_cinema_placement === 1 || home_cinema_placement === true) ? 1 : 0,
      speakers_placement: (speakers_placement === 'true' || speakers_placement === 1 || speakers_placement === true) ? 1 : 0,
      refrigerators_placement: (refrigerators_placement === 'true' || refrigerators_placement === 1 || refrigerators_placement === true) ? 1 : 0
    };
    
    const info = stmt.run(
      name, 
      price || 0, 
      category, 
      brand || null, 
      final_image_url || null, 
      stock || 0, 
      description || null,
      original_price || null,
      discount || 0,
      colors || '[]',
      bought_price || 0,
      flags.is_featured,
      flags.is_trending,
      flags.is_daily_deal,
      flags.is_new_arrival,
      flags.smartphones_placement,
      flags.home_cinema_placement,
      flags.speakers_placement,
      flags.refrigerators_placement,
      placements || '[]',
      condition || 'new',
      additional_images || '[]'
    );
    
    console.log('Product added successfully:', info);
    res.json({ id: info.lastInsertRowid, success: true });

    // Trigger dynamic closed-tab background push notifications to customers
    sendBackgroundPushNotification(
      `🆕 New Arrival: ${name}`,
      `Check out the new ${category || 'product'} now available!`,
      `/#/product/${info.lastInsertRowid}`,
      final_image_url,
      'customer'
    );
  } catch (err) { 
    console.error('Error adding product:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/products/${id} requested`);
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    console.log(`Product ${id} deleted successfully`);
    res.json({ success: true });
  } catch (err) { 
    console.error(`Error deleting product ${id}:`, err);
    res.status(500).json({ error: err.message }); 
  }
});

app.put('/api/products/:id', authenticateAdmin, upload.single('image'), (req, res) => {
  const { id } = req.params;
  console.log(`PUT /api/products/${id} requested`);
  const { 
    name, price, category, brand, stock, description, original_price, discount, colors, bought_price, 
    is_featured, is_trending, is_daily_deal, is_new_arrival,
    smartphones_placement, home_cinema_placement, speakers_placement, refrigerators_placement,
    placements, condition, additional_images
  } = req.body;
  let final_image_url = req.body.image_url;

  if (req.file) {
    final_image_url = `/uploads/${req.file.filename}`;
  }

  try {
    const oldProduct = db.prepare('SELECT price, name, image_url, category FROM products WHERE id = ?').get(id);
    
    const flags = {
      is_featured: (is_featured === 'true' || is_featured === 1 || is_featured === true) ? 1 : 0,
      is_trending: (is_trending === 'true' || is_trending === 1 || is_trending === true) ? 1 : 0,
      is_daily_deal: (is_daily_deal === 'true' || is_daily_deal === 1 || is_daily_deal === true) ? 1 : 0,
      is_new_arrival: (is_new_arrival === 'true' || is_new_arrival === 1 || is_new_arrival === true) ? 1 : 0,
      smartphones_placement: (smartphones_placement === 'true' || smartphones_placement === 1 || smartphones_placement === true) ? 1 : 0,
      home_cinema_placement: (home_cinema_placement === 'true' || home_cinema_placement === 1 || home_cinema_placement === true) ? 1 : 0,
      speakers_placement: (speakers_placement === 'true' || speakers_placement === 1 || speakers_placement === true) ? 1 : 0,
      refrigerators_placement: (refrigerators_placement === 'true' || refrigerators_placement === 1 || refrigerators_placement === true) ? 1 : 0
    };

    const stmt = db.prepare(`
      UPDATE products SET 
        name = ?, price = ?, category = ?, brand_id = (SELECT id FROM brands WHERE name = ?), 
        image_url = ?, stock = ?, description = ?, original_price = ?, discount = ?, colors = ?,
        bought_price = ?, is_featured = ?, is_trending = ?, is_daily_deal = ?, is_new_arrival = ?,
        smartphones_placement = ?, home_cinema_placement = ?, speakers_placement = ?, refrigerators_placement = ?,
        placements = ?, condition = ?, additional_images = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(
      name, price, category, brand, final_image_url, stock, description, original_price, discount, colors, bought_price || 0, 
      flags.is_featured, flags.is_trending, flags.is_daily_deal, flags.is_new_arrival,
      flags.smartphones_placement, flags.home_cinema_placement, flags.speakers_placement, flags.refrigerators_placement,
      placements || '[]',
      condition || 'new',
      additional_images || '[]',
      id
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    console.log(`Product ${id} updated successfully`);
    res.json({ success: true });

    // Trigger dynamic closed-tab background push notifications on price drop
    if (oldProduct && Number(price) < Number(oldProduct.price)) {
      const prevPrice = oldProduct.price;
      const dropPercent = Math.round(((prevPrice - price) / prevPrice) * 100);
      sendBackgroundPushNotification(
        `🔥 Price Drop: ${name}`,
        `Now ${dropPercent}% off! Down to ${Number(price).toLocaleString()} FCFA from ${Number(prevPrice).toLocaleString()} FCFA.`,
        `/#/product/${id}`,
        final_image_url || oldProduct.image_url
      );
    }

    // Trigger admin push notification on low stock
    const lowStockThreshold = 5;
    if (stock !== undefined && Number(stock) <= lowStockThreshold && oldProduct && Number(oldProduct.stock) > lowStockThreshold) {
      sendBackgroundPushNotification(
        `⚠️ Low Stock: ${name}`,
        `Only ${Number(stock)} units remaining! Restock soon.`,
        '/#/dashboard',
        null,
        'admin'
      );
    }
  } catch (err) { 
    console.error(`Error updating product ${id}:`, err);
    res.status(500).json({ error: err.message }); 
  }
});

// Direct Product Stock/Price Quick Update Endpoint
app.patch('/api/products/:id/stock', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { stock, price, bought_price } = req.body;
  try {
    const sets = [];
    const params = [];
    if (stock !== undefined) { sets.push('stock = ?'); params.push(Number(stock)); }
    if (price !== undefined) { sets.push('price = ?'); params.push(Number(price)); }
    if (bought_price !== undefined) { sets.push('bought_price = ?'); params.push(Number(bought_price)); }
    
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    
    const stmt = db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/categories/:id', authenticateAdmin, (req, res) => {
  const { name, description, image_url, parent_id, show_daily_deals } = req.body;
  try {
    const parentVal = parent_id ? Number(parent_id) : null;
    const dailyDealsVal = show_daily_deals !== undefined ? Number(show_daily_deals) : 1;
    db.prepare('UPDATE categories SET name = ?, description = ?, image_url = ?, parent_id = ?, show_daily_deals = ? WHERE id = ?').run(name, description, image_url, parentVal, dailyDealsVal, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/categories/toggle-deals', authenticateAdmin, (req, res) => {
  const { show_daily_deals } = req.body;
  try {
    const dailyDealsVal = show_daily_deals !== undefined ? Number(show_daily_deals) : 1;
    db.prepare('UPDATE categories SET show_daily_deals = ?').run(dailyDealsVal);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/brands/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/brands/:id', authenticateAdmin, (req, res) => {
  const { name, logo_url, description } = req.body;
  try {
    db.prepare('UPDATE brands SET name = ?, logo_url = ?, description = ? WHERE id = ?').run(name, logo_url, description, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update order status/tracking
app.patch('/api/orders/:id/status', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { tracking_stage, tracking_number, eta, tracking_note, status } = req.body;
  
  try {
    const sets = [];
    const params = [];
    
    if (tracking_stage !== undefined) { sets.push('tracking_stage = ?'); params.push(tracking_stage); }
    if (tracking_number !== undefined) { sets.push('tracking_number = ?'); params.push(tracking_number); }
    if (eta !== undefined) { sets.push('eta = ?'); params.push(eta); }
    if (tracking_note !== undefined) { sets.push('tracking_note = ?'); params.push(tracking_note); }
    if (status !== undefined) { sets.push('status = ?'); params.push(status); }
    
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    params.push(id);
    const stmt = db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });

    // Push notification to customers when order status changes
    if (status || tracking_stage) {
      const statusLabel = status || tracking_stage || 'updated';
      sendBackgroundPushNotification(
        `📦 Order SWT-${id} Update`,
        `Your order status has been updated to: ${statusLabel.toUpperCase()}`,
        `/#/track/${id}`,
        null,
        'customer'
      );
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/stats', authenticateAdmin, (req, res) => {
  try {
    const totalRevenue = db.prepare('SELECT SUM(total) as total FROM orders').get().total || 0;
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const visitorCount = db.prepare('SELECT COUNT(*) as count FROM visitor_log').get().count;
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    
    // Get sales trend (last 7 days)
    const salesTrend = db.prepare(`
      SELECT date(created_at) as date, SUM(total) as revenue, COUNT(*) as count 
      FROM orders 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    res.json({
      totalRevenue,
      orderCount,
      visitorCount,
      productCount,
      salesTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery Agents API
app.get('/api/agents', authenticateAdmin, (req, res) => {
  try {
    const agents = db.prepare('SELECT * FROM agents').all();
    res.json(agents);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/agents', authenticateAdmin, (req, res) => {
  const { name, phone, zone, avatar } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO agents (name, phone, zone, avatar) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, phone, zone, avatar || `https://ui-avatars.com/api/?name=${name}&background=0f172a&color=fff`);
    res.json({ id: info.lastInsertRowid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/agents/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status, zone, phone } = req.body;
  try {
    const sets = [];
    const params = [];
    if (status) { sets.push('status = ?'); params.push(status); }
    if (zone) { sets.push('zone = ?'); params.push(zone); }
    if (phone) { sets.push('phone = ?'); params.push(phone); }
    params.push(id);
    db.prepare(`UPDATE agents SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/agents/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Shipping Zones API
app.get('/api/shipping_zones', (req, res) => {
  try {
    const zones = db.prepare('SELECT * FROM shipping_zones ORDER BY name ASC').all();
    res.json(zones);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/shipping_zones', authenticateAdmin, (req, res) => {
  const { name, price } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO shipping_zones (name, price) VALUES (?, ?)');
    const info = stmt.run(name, price);
    res.json({ id: info.lastInsertRowid, name, price, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/shipping_zones/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM shipping_zones WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Real-Time Delivery Tracking API

// GET /api/public/agents (Public list of available agents for selection in DeliverPage)
app.get('/api/public/agents', (req, res) => {
  try {
    const agents = db.prepare("SELECT id, name, zone, avatar, rating FROM agents WHERE approval_status = 'approved'").all();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/agents/login (Allows agents to log in by validating PIN)
app.post('/api/public/agents/login', (req, res) => {
  const { agent_id, pin } = req.body;
  if (!agent_id || !pin) {
    return res.status(400).json({ error: 'Missing parameter: agent_id, pin' });
  }
  try {
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent_id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.approval_status !== 'approved') {
      return res.status(403).json({ error: 'Account is pending approval or rejected.' });
    }
    if (agent.pin === pin) {
      // Exclude pin from response
      const { pin: _, ...safeAgent } = agent;
      res.json({ success: true, agent: safeAgent });
    } else {
      res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/agents/register (Allows agents to register a new account)
app.post('/api/public/agents/register', (req, res) => {
  const { name, phone, dob, email, address, plate_number, vehicle_name, photo_id } = req.body;
  if (!name || !phone || !dob || !email || !address || !plate_number || !vehicle_name || !photo_id) {
    return res.status(400).json({ error: 'Missing registration details' });
  }
  try {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
    const stmt = db.prepare(`
      INSERT INTO agents (name, phone, dob, email, address, plate_number, vehicle_name, photo_id, pin, approval_status, avatar, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 5.0, 'offline')
    `);
    const info = stmt.run(name, phone, dob, email, address, plate_number, vehicle_name, photo_id, randomPin, defaultAvatar);
    res.json({ success: true, id: info.lastInsertRowid, pin: randomPin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/ping-location (Allows agents to report coordinates)
app.post('/api/agents/ping-location', (req, res) => {
  const { order_id, agent_id, lat, lng, accuracy } = req.body;
  if (!order_id || !agent_id || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: order_id, agent_id, lat, lng' });
  }

  // Support both SWTO-N format and raw numerical N format
  const numericOrderId = typeof order_id === 'string' && order_id.includes('-') 
    ? parseInt(order_id.split('-')[1]) 
    : parseInt(order_id);

  try {
    // 1. Update order with latest agent position
    const updateOrder = db.prepare('UPDATE orders SET agent_lat = ?, agent_lng = ? WHERE id = ?');
    updateOrder.run(lat, lng, numericOrderId);

    // 2. Insert into coordinate history log
    const insertHistory = db.prepare('INSERT INTO agent_location_history (order_id, agent_id, lat, lng, accuracy) VALUES (?, ?, ?, ?, ?)');
    insertHistory.run(numericOrderId, agent_id, lat, lng, accuracy || null);

    res.json({ success: true, message: 'Position ping logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id/tracking (Fetch dynamic status, customer home, agent position, and path logs)
app.get('/api/orders/:id/tracking', (req, res) => {
  const { id } = req.params;
  const numericOrderId = typeof id === 'string' && id.includes('-') 
    ? parseInt(id.split('-')[1]) 
    : parseInt(id);

  try {
    // 1. Fetch order details
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(numericOrderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Fetch agent info if assigned
    let agent = null;
    if (order.delivery_agent_id) {
      agent = db.prepare('SELECT id, name, phone, zone, avatar, rating FROM agents WHERE id = ?').get(order.delivery_agent_id);
    }

    // 3. Fetch past route trail
    const history = db.prepare('SELECT lat, lng, created_at FROM agent_location_history WHERE order_id = ? ORDER BY created_at ASC').all(numericOrderId);

    // 4. Fallback for destination lat/lng based on city
    let destLat = order.destination_lat;
    let destLng = order.destination_lng;
    if ((!destLat || !destLng) && order.city) {
      const zone = db.prepare('SELECT lat, lng FROM shipping_zones WHERE name = ?').get(order.city);
      if (zone && zone.lat && zone.lng) {
        destLat = zone.lat;
        destLng = zone.lng;
      } else {
        destLat = 5.3484;
        destLng = -3.9788;
      }
    }

    res.json({
      order_id: order.id,
      customer_name: order.customer_name,
      customer_contact: order.customer_contact,
      status: order.status,
      tracking_stage: order.tracking_stage || 'placed',
      estimated_minutes: order.estimated_minutes || 20,
      destination_lat: destLat,
      destination_lng: destLng,
      agent_lat: order.agent_lat || null,
      agent_lng: order.agent_lng || null,
      agent,
      history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/assign-agent (Assigns a delivery courier to an order)
app.post('/api/orders/:id/assign-agent', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { agent_id } = req.body;
  if (!agent_id) {
    return res.status(400).json({ error: 'Missing parameter: agent_id' });
  }

  const numericOrderId = typeof id === 'string' && id.includes('-') 
    ? parseInt(id.split('-')[1]) 
    : parseInt(id);

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(numericOrderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent_id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Prepopulate destination coords if null based on city zone coordinates
    let destLat = order.destination_lat;
    let destLng = order.destination_lng;
    if ((!destLat || !destLng) && order.city) {
      const zone = db.prepare('SELECT lat, lng FROM shipping_zones WHERE name = ?').get(order.city);
      if (zone && zone.lat && zone.lng) {
        destLat = zone.lat;
        destLng = zone.lng;
      }
    }

    // Set initial agent position to their zone or standard coordinate center (e.g. Marcory)
    const agentZone = db.prepare('SELECT lat, lng FROM shipping_zones WHERE name = ?').get(agent.zone || '');
    const initialAgentLat = agentZone ? agentZone.lat : 5.3161;
    const initialAgentLng = agentZone ? agentZone.lng : -3.9937;

    const stmt = db.prepare(`
      UPDATE orders 
      SET delivery_agent_id = ?, 
          tracking_stage = 'assigned',
          destination_lat = COALESCE(destination_lat, ?),
          destination_lng = COALESCE(destination_lng, ?),
          agent_lat = ?,
          agent_lng = ?
      WHERE id = ?
    `);
    stmt.run(agent_id, destLat, destLng, initialAgentLat, initialAgentLng, numericOrderId);

    res.json({ success: true, message: 'Agent assigned and tracking coordinates initialized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Upload Endpoint
app.post('/api/upload', authenticateAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, success: true });
});

// Settings API — filters sensitive keys for unauthenticated visitors
const SENSITIVE_SETTINGS_KEYS = ['admin_key', 'admin_pin', 'admin_password', 'admin_email', 'admin_phone'];

app.get('/api/settings', async (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const config = {};
    settings.forEach(s => {
      try { config[s.key] = JSON.parse(s.value); } catch (e) { config[s.key] = s.value; }
    });

    // Check if request is from an authenticated admin
    const admin = await getAdminFromToken(req);
    if (!admin) {
      // Remove sensitive keys for public visitors
      SENSITIVE_SETTINGS_KEYS.forEach(k => delete config[k]);
    }

    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', authenticateAdmin, (req, res) => {
  const config = req.body;
  try {
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(config).forEach(([key, value]) => {
      const finalValue = (typeof value === 'object' && value !== null) 
        ? JSON.stringify(value) 
        : String(value);
      upsert.run(key, finalValue);
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', authenticateAdmin, (req, res) => {
  const config = req.body;
  try {
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(config).forEach(([key, value]) => {
      const finalValue = (typeof value === 'object' && value !== null) 
        ? JSON.stringify(value) 
        : String(value);
      upsert.run(key, finalValue);
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/social/facebook-post', authenticateAdmin, async (req, res) => {
  const { product, testPost = false } = req.body;
  try {
    const pageIdRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('facebook_page_id');
    const tokenRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('facebook_access_token');
    
    const pageId = pageIdRow ? pageIdRow.value : '';
    const token = tokenRow ? tokenRow.value : '';
    
    if (!pageId || !token) {
      return res.status(400).json({ error: 'Facebook integration is not configured. Please add your Page ID and Page Access Token in Store Settings.' });
    }
    
    const storeUrl = req.headers.origin || 'https://sweeto-hub.com';
    
    let caption = '';
    let productLink = '';
    let imageUrl = '';
    
    if (testPost) {
      caption = `🔔 Test auto-posting from SWEETO HUB Admin Dashboard!\n\nCheck out our boutique here: ${storeUrl}`;
    } else {
      if (!product) {
        return res.status(400).json({ error: 'Product details are required for posting.' });
      }
      const currency = 'FCFA';
      caption = `✨ NEW ARRIVAL: ${product.name} ✨\n\n${product.description || ''}\n\n🏷️ Price: ${product.price?.toLocaleString()} ${currency}\n\n🛒 View & Order here:\n${storeUrl}/#/product/${product.id}`;
      productLink = `${storeUrl}/#/product/${product.id}`;
      
      imageUrl = product.image_url || product.image || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${storeUrl}${imageUrl}`;
      }
    }
    
    let fbUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let bodyParams = {
      message: caption,
      access_token: token
    };
    
    if (!testPost && productLink) {
      bodyParams.link = productLink;
    }
    
    const isImageValid = imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('localhost') && !imageUrl.includes('127.0.0.1');
    if (isImageValid) {
      fbUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      bodyParams = {
        url: imageUrl,
        caption: caption,
        access_token: token
      };
    }
    
    const response = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyParams)
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'Facebook API error');
    }
    
    res.json({ success: true, postId: result.id || result.post_id });
  } catch (err) {
    console.error('Error posting to Facebook:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/track-visit', (req, res) => {
  const { page_path, country, event_type, device_id } = req.body;
  const ip = req.ip;
  const user_agent = req.get('User-Agent');
  
  try {
    db.prepare('INSERT INTO visitor_log (ip, user_agent, page_path, country, event_type, device_id) VALUES (?, ?, ?, ?, ?, ?)').run(
      ip, 
      user_agent, 
      page_path, 
      country || 'Unknown', 
      event_type || 'page_view', 
      device_id || `dev_sig_${ip.replace(/[^a-zA-Z0-9]/g, '')}`
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/analytics/clear-logs', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM visitor_log').run();
    res.json({ success: true, message: 'Local logs cleared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/analytics', authenticateAdmin, (req, res) => {
  try {
    // 1. Core traffic metrics
    const totalViews = db.prepare('SELECT COUNT(*) as count FROM visitor_log').get().count;
    const uniqueIPs = db.prepare('SELECT COUNT(DISTINCT COALESCE(device_id, ip)) as count FROM visitor_log').get().count;
    
    // 2. Sales metrics
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status = 'completed'").get();
    const completedCount = completedOrders.count || 0;
    const totalRevenue = completedOrders.revenue || 0;
    
    // Conversion Rate
    const conversionRate = uniqueIPs > 0 ? ((completedCount / uniqueIPs) * 100).toFixed(2) : 0;
    
    // 3. Traffic by page path
    const pageViews = db.prepare(`
      SELECT page_path, COUNT(*) as count 
      FROM visitor_log 
      GROUP BY page_path 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    // 4. Device detection using basic user_agent matching
    const logs = db.prepare('SELECT user_agent FROM visitor_log').all();
    let mobileCount = 0;
    let desktopCount = 0;
    let chromeCount = 0;
    let safariCount = 0;
    let firefoxCount = 0;
    let edgeCount = 0;
    
    logs.forEach(l => {
      const ua = (l.user_agent || '').toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        mobileCount++;
      } else {
        desktopCount++;
      }
      
      if (ua.includes('edg')) edgeCount++;
      else if (ua.includes('firefox')) firefoxCount++;
      else if (ua.includes('chrome')) chromeCount++;
      else if (ua.includes('safari')) safariCount++;
    });
    
    const devices = {
      mobile: mobileCount,
      desktop: desktopCount
    };
    
    const browsers = {
      Chrome: chromeCount,
      Safari: safariCount,
      Firefox: firefoxCount,
      Edge: edgeCount,
      Other: logs.length - (chromeCount + safariCount + firefoxCount + edgeCount)
    };

    // 5. Recent visitor logs
    const recentLogs = db.prepare(`
      SELECT id, ip, user_agent, page_path, country, event_type, created_at 
      FROM visitor_log 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();

    // 6. 7-day visit trend
    const trend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM visitor_log 
      WHERE created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();
    
    // 7. 7-day sales trend
    const salesTrend = db.prepare(`
      SELECT DATE(created_at) as date, SUM(total) as total, COUNT(*) as count 
      FROM orders 
      WHERE status = 'completed' AND created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // 8. Countries breakdown analytics dataset
    const countriesBreakdown = db.prepare(`
      SELECT 
        country, 
        COUNT(*) as events, 
        COUNT(DISTINCT COALESCE(device_id, ip)) as unique_devices,
        MAX(created_at) as last_active,
        (
          SELECT event_type 
          FROM visitor_log v2 
          WHERE v2.country = visitor_log.country 
          GROUP BY event_type 
          ORDER BY COUNT(*) DESC 
          LIMIT 1
        ) as top_event
      FROM visitor_log 
      WHERE country IS NOT NULL AND country != 'Unknown'
      GROUP BY country 
      ORDER BY events DESC
    `).all();

    // 9. Most Viewed Products ranking
    const topProductsRaw = db.prepare(`
      SELECT page_path, COUNT(*) as views 
      FROM visitor_log 
      WHERE event_type = 'product viewed' OR page_path LIKE '/product/%'
      GROUP BY page_path 
      ORDER BY views DESC 
      LIMIT 6
    `).all();
    
    const topViewedProducts = topProductsRaw.map(r => {
      const parts = r.page_path.split('/');
      const productId = parseInt(parts[parts.length - 1]);
      if (isNaN(productId)) return null;
      const product = db.prepare('SELECT name, image_url, price FROM products WHERE id = ?').get(productId);
      if (!product) return null;
      return {
        id: productId,
        name: product.name,
        image: product.image_url,
        price: product.price,
        views: r.views
      };
    }).filter(Boolean);

    res.json({
      summary: {
        totalViews,
        uniqueIPs,
        totalOrders,
        completedCount,
        totalRevenue,
        conversionRate
      },
      pageViews,
      devices,
      browsers,
      trend,
      salesTrend,
      recentLogs,
      countriesBreakdown,
      topViewedProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate analytics route removed — first definition at line ~596 is used
// Product Reviews API Endpoints
app.get('/api/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.image_url as product_image 
      FROM reviews r 
      LEFT JOIN products p ON r.product_id = p.id 
      ORDER BY r.created_at DESC
    `).all();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', (req, res) => {
  const { product_id, customer_name, rating, comment } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO reviews (product_id, customer_name, rating, comment, status) 
      VALUES (?, ?, ?, ?, 'approved')
    `).run(product_id, customer_name, rating, comment || null);
    
    // Update product rating and reviews_count
    const stats = db.prepare('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND status = \'approved\'').get(product_id);
    db.prepare('UPDATE products SET reviews_count = ?, rating = ? WHERE id = ?').run(stats.count, stats.avg_rating || 0, product_id);
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/reviews/:id/status', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);
    
    // Get product ID for this review to update global product averages
    const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(id);
    if (review) {
      const stats = db.prepare('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND status = \'approved\'').get(review.product_id);
      db.prepare('UPDATE products SET reviews_count = ?, rating = ? WHERE id = ?').run(stats.count, stats.avg_rating || 0, review.product_id);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  try {
    const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(id);
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    
    if (review) {
      const stats = db.prepare('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND status = \'approved\'').get(review.product_id);
      db.prepare('UPDATE products SET reviews_count = ?, rating = ? WHERE id = ?').run(stats.count, stats.avg_rating || 0, review.product_id);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Catch-all for 404s
app.use((req, res) => {
  console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SWEETO HUB Local Server running at http://localhost:${port}`);
  
  // Keep-alive / Heartbeat
  setInterval(() => {
    console.log(`Heartbeat: ${new Date().toISOString()} - Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
  }, 10000);
});
