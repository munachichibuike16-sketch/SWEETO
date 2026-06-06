import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import webpush from "https://esm.sh/web-push@3.6.7"

// VAPID keys loaded from environment variables (Secrets)
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@sweeto.com"

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const payload = await req.json()
    let pushTitle = ""
    let pushBody = ""
    let pushUrl = "/#/"
    let pushImage = null
    let targetRole = "customer"

    // 1. Check if request is a Database Webhook payload
    if (payload.table && payload.type) {
      const { table, type, record, old_record } = payload

      if (table === 'orders' && type === 'INSERT') {
        // New order -> Notify admins
        pushTitle = "🛍️ New Order Received!"
        pushBody = `Order SWT-${record.id} from ${record.customer_name || 'Customer'} — ${Number(record.total || 0).toLocaleString()} FCFA`
        pushUrl = "/#/dashboard"
        targetRole = "admin"
      } 
      else if (table === 'orders' && type === 'UPDATE') {
        // Status/tracking change -> Notify customers
        if (record.status !== old_record.status || record.tracking_stage !== old_record.tracking_stage) {
          const statusLabel = record.status || record.tracking_stage || 'updated'
          pushTitle = `📦 Order SWT-${record.id} Update`
          pushBody = `Your order status has been updated to: ${statusLabel.toUpperCase()}`
          pushUrl = `/#/track/${record.id}`
          targetRole = "customer"
        } else {
          return new Response(JSON.stringify({ message: "No relevant order update" }), { status: 200, headers: corsHeaders })
        }
      } 
      else if (table === 'products' && type === 'INSERT') {
        // New arrival -> Notify customers
        if (record.is_new_arrival) {
          pushTitle = `🆕 New Arrival: ${record.name}`
          pushBody = `Check out the new ${record.category || 'product'} now available!`
          pushUrl = `/#/product/${record.id}`
          pushImage = record.image_url
          targetRole = "customer"
        } else {
          return new Response(JSON.stringify({ message: "Not a new arrival product" }), { status: 200, headers: corsHeaders })
        }
      } 
      else if (table === 'products' && type === 'UPDATE') {
        // Price drop or Low Stock check
        if (record.price < old_record.price) {
          const dropPercent = Math.round(((old_record.price - record.price) / old_record.price) * 100)
          pushTitle = `🔥 Price Drop: ${record.name}`
          pushBody = `Now ${dropPercent}% off! Down to ${Number(record.price).toLocaleString()} FCFA from ${Number(old_record.price).toLocaleString()} FCFA.`
          pushUrl = `/#/product/${record.id}`
          pushImage = record.image_url
          targetRole = "customer"
        } 
        else if (record.stock <= 5 && old_record.stock > 5) {
          pushTitle = `⚠️ Low Stock: ${record.name}`
          pushBody = `Only ${record.stock} units remaining! Restock soon.`
          pushUrl = "/#/dashboard"
          targetRole = "admin"
        } else {
          return new Response(JSON.stringify({ message: "No triggerable product update" }), { status: 200, headers: corsHeaders })
        }
      }
    } 
    // 2. Direct HTTP custom payload (Test notifications / Admin manual pushes)
    else {
      pushTitle = payload.title || "🔔 SWEETO HUB"
      pushBody = payload.body || "Notification alert!"
      pushUrl = payload.url || "/#/"
      pushImage = payload.image || null
      targetRole = payload.targetRole || "customer"
    }

    if (!pushTitle || !pushBody) {
      return new Response(JSON.stringify({ error: "Missing title or body" }), { status: 400, headers: corsHeaders })
    }

    // Fetch matching subscriptions from Supabase
    let query = supabase.from('push_subscriptions').select('*')
    if (targetRole && targetRole !== 'all') {
      query = query.eq('role', targetRole)
    }
    const { data: subscriptions, error: dbErr } = await query

    if (dbErr) throw dbErr
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sentCount: 0, message: "No subscribers found" }), { status: 200, headers: corsHeaders })
    }

    const pushPayload = JSON.stringify({
      title: pushTitle,
      body: pushBody,
      url: pushUrl,
      image: pushImage
    })

    const promises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      return webpush.sendNotification(pushSubscription, pushPayload)
        .catch(async (err: any) => {
          // Clean up expired subscriptions (like when permission is revoked or browser cleans up SW)
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ Removing expired subscription: ${sub.endpoint}`)
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          } else {
            console.error('Push notification failed for endpoint:', sub.endpoint, err)
          }
        })
    })

    await Promise.all(promises)

    return new Response(JSON.stringify({ success: true, sentCount: subscriptions.length }), { status: 200, headers: corsHeaders })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
