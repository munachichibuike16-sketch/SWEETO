import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, ArrowRight, MapPin, Phone, User, Package, Award, UserCheck, Loader2, Compass, Home, Map, ChevronDown, Check, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { playSound } from '../utils/sound';
import { apiFetch } from '../utils/api';

const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY || '';

const cityAreas = {
  'Abidjan': ['Cocody', 'Marcory', 'Yopougon', 'Riviera', 'Adjamé', 'Plateau', 'Treichville', 'Koumassi', 'Angré', 'Abobo'],
  'Yamoussoukro': ['Centre-ville', 'Assabou', '220 Logements', 'Morofé', 'Dioulabou', 'Kokrenou'],
  'Bouaké': ['Centre-ville', 'Air France', 'N\'Gattakro', 'Kennedy', 'Dar-Es-Salam', 'Nimbo', 'Broukro'],
  'San Pédro': ['Cité', 'Bardot', 'Seweke', 'Balmer', 'Nanhon'],
  'Daloa': ['Tazibouo', 'Orly', 'Kennedy', 'Labia'],
  'Korhogo': ['Koko', 'Petit Paris', 'Soba', 'Tchelekaha'],
  'Man': ['Gbépleu', 'Grand Gbapleu', 'Belleville', 'Dompleu'],
  'Gagnoa': ['Babré', 'Gbaroko', 'Garahio', 'Dioulabou'],
  'Grand-Bassam': ['Quartier France', 'Moossou', 'Impérial', 'Nsa'],
  'Assinie': ['Assinie-Mafia', 'Terminal', 'Km 11', 'Assouindé'],
  'Abengourou': ['Agnikro', 'Dioulakro', 'Plateau', 'Lobikro']
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { settings, showToast } = useStore();
  const { t, isRTL, lang } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [waMessage, setWaMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState('direct'); // 'direct' | 'manual'
  const [formData, setFormData] = useState({
    name: '', phone: '', city: 'Abidjan', address: '', street: '', junction: '', landmark: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) {
      setCurrentUser(session);
      setFormData({
        name: session.name || '',
        phone: session.phoneNumber || session.phone || '',
        city: session.city || 'Abidjan',
        address: session.address || '',
        street: session.street || '',
        junction: session.junction || '',
        landmark: session.landmark || ''
      });
    }
    fetchGPSLocation();
  }, []);
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [shippingZones, setShippingZones] = useState([]);
  const [shippingFee, setShippingFee] = useState(1500);
  const [isFreeShippingApplied, setIsFreeShippingApplied] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Click & Collect states
  const [deliveryMethod, setDeliveryMethod] = useState('home'); // 'home' | 'pickup'
  const [pickupLocation, setPickupLocation] = useState('cocody'); // 'cocody' | 'yopougon' | 'marcory'
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [customCoords, setCustomCoords] = useState(null);

  // Address Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionField, setSuggestionField] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSuggestions(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Debounced search suggest handler
  const [searchTimer, setSearchTimer] = useState(null);

  const fetchSuggestions = (query, field) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    setSuggestionField(field);

    if (searchTimer) clearTimeout(searchTimer);

    const timer = setTimeout(() => {
      // Append city context for better search accuracy
      const fullQuery = field === 'street' ? `${formData.city} ${query}` : query;

      const userCountry = localStorage.getItem('sweeto_user_country') || "Cote D'Ivoire";
      const countryCodesMap = {
        "Burkina Faso": "bf",
        "Benin": "bj",
        "Cote D'Ivoire": "ci",
        "France": "fr",
        "Mali": "ml",
        "Senegal": "sn",
        "Togo": "tg",
        "United States": "us"
      };
      const cc = countryCodesMap[userCountry] || "ci";

      const url = LOCATIONIQ_KEY
        ? `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(fullQuery)}&limit=5&countrycodes=${cc}&accept-language=${lang}`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=5&countrycodes=${cc}`;

      const headers = LOCATIONIQ_KEY 
        ? {} 
        : { 'Accept-Language': lang === 'fr' ? 'fr' : 'en', 'User-Agent': 'Sweeto-Hub-Web-App' };

      fetch(url, { headers })
      .then(res => res.json())
      .then(data => {
        // LocationIQ has same structure as Nominatim (an array of place objects)
        setSuggestions(data || []);
        setShowSuggestions(data && data.length > 0);
        setSearchLoading(false);
      })
      .catch(err => {
        console.warn('Search autocomplete error:', err);
        setSearchLoading(false);
      });
    }, 400);

    setSearchTimer(timer);
  };

  const handleSelectSuggestion = (place) => {
    if (!place) return;
    const addr = place.address || {};
    
    const roadVal = addr.road || addr.pedestrian || addr.cycleway || addr.footway || '';
    const suburbVal = addr.suburb || addr.neighbourhood || addr.quarter || addr.subdivision || '';
    const rawCity = addr.city || addr.town || addr.village || addr.county || 'Abidjan';
    
    const matchedCity = ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San Pédro', 'Daloa', 'Korhogo', 'Man', 'Gagnoa', 'Grand-Bassam', 'Assinie', 'Abengourou'].find(
      c => c.toLowerCase() === rawCity.toLowerCase()
    ) || formData.city;

    setFormData(prev => {
      const updated = { ...prev };
      
      if (matchedCity) updated.city = matchedCity;
      
      if (suggestionField === 'address') {
        updated.address = suburbVal || place.display_name.split(',')[0];
        if (roadVal) updated.street = roadVal;
      } else if (suggestionField === 'street') {
        updated.street = roadVal || place.display_name.split(',')[0];
        if (suburbVal) updated.address = suburbVal;
      }
      
      // Auto-set landmark to display details
      const landmarkVal = addr.amenity || addr.tourism || addr.shop || addr.building || '';
      if (landmarkVal) {
        updated.landmark = `${landmarkVal} (${place.display_name.split(',')[0]})`;
      } else {
        updated.landmark = place.display_name.split(',').slice(0, 2).join(', ');
      }
      
      return updated;
    });

    if (place.lat && place.lon) {
      setCustomCoords({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
      setGpsSuccess(true);
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  const fetchGPSLocation = () => {
    if (!navigator.geolocation) {
      showToast(lang === 'fr' ? "La géolocalisation n'est pas supportée par votre navigateur." : "Geolocation is not supported by this browser.", "error");
      return;
    }

    setGpsLoading(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCustomCoords({ lat, lng });
        setGpsSuccess(true);
        setGpsLoading(false);

        // Fetch reverse geocoding from LocationIQ (or fallback to Nominatim)
        const url = LOCATIONIQ_KEY
          ? `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`
          : `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

        const headers = LOCATIONIQ_KEY
          ? {}
          : { 'Accept-Language': lang === 'fr' ? 'fr' : 'en', 'User-Agent': 'Sweeto-Hub-Web-App' };

        fetch(url, { headers })
        .then(res => res.json())
        .then(data => {
          if (data && data.address) {
            const addr = data.address;
            
            // Extract road / street
            const roadVal = addr.road || addr.pedestrian || addr.cycleway || addr.footway || '';
            
            // Extract suburb / neighborhood
            const suburbVal = addr.suburb || addr.neighbourhood || addr.quarter || addr.subdivision || '';
            
            // Extract landmark details
            const landmarkVal = addr.amenity || addr.tourism || addr.shop || addr.building || addr.railway || addr.highway || addr.historic || '';
            
            // Extract city
            const rawCity = addr.city || addr.town || addr.village || addr.county || 'Abidjan';
            
            // Try to match selected city with our dropdown options (case-insensitive)
            const matchedCity = ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San Pédro', 'Daloa', 'Korhogo', 'Man', 'Gagnoa', 'Grand-Bassam', 'Assinie', 'Abengourou'].find(
              c => c.toLowerCase() === rawCity.toLowerCase()
            ) || 'Abidjan';

            setFormData(prev => ({
              ...prev,
              city: matchedCity,
              address: suburbVal || prev.address || (lang === 'fr' ? 'Ma position GPS' : 'My GPS Position'),
              street: roadVal || prev.street,
              landmark: landmarkVal ? `${landmarkVal} (${data.display_name.split(',')[0]})` : (data.display_name ? data.display_name.split(',').slice(0, 2).join(', ') : prev.landmark)
            }));
          }
        })
        .catch(err => {
          console.warn('Reverse geocoding error:', err);
          if (!formData.address) {
            setFormData(prev => ({
              ...prev,
              address: lang === 'fr' ? 'Ma position GPS' : 'My GPS Position'
            }));
          }
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGpsLoading(false);
        let msg = lang === 'fr' ? "Impossible de récupérer votre position." : "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = lang === 'fr' ? "Accès à la localisation refusé." : "Location access denied.";
        }
        showToast(msg, "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      playSound('celebrate');
    }
  }, [isSuccess]);

  const subtotal = cartTotal;
  const tax = 0;
  const hasUnsetPrice = cartItems.some(item => !item.price || Number(item.price) === 0);
  const shipping = (hasUnsetPrice || isFreeShippingApplied || deliveryMethod === 'pickup') ? 0 : shippingFee;
  const grandTotal = subtotal + shipping - promoDiscount;

  const ADMIN_WHATSAPP_NUMBER = settings?.contactPhone?.replace(/\D/g, '') || "2250500619923";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);



  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const { data, error } = await supabase
          .from('shipping_zones')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          setShippingZones(data);
          const abidjan = data.find(z => z.name === 'Abidjan');
          if (abidjan) setShippingFee(abidjan.price);
        }
      } catch (e) { console.error(e); }
    };
    fetchShipping();
  }, []);

  useEffect(() => {
    const zone = shippingZones.find(z => z.name === formData.city);
    if (zone) setShippingFee(zone.price);
  }, [formData.city, shippingZones]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const applyPromo = async () => {
    const codeUpper = promoInput.toUpperCase().trim();
    if (!codeUpper) return;
    
    setPromoError('');
    
    // Check against admin-configured free delivery promo code
    const adminFreeShipCode = settings?.free_delivery_code?.toUpperCase().trim();
    if (adminFreeShipCode && codeUpper === adminFreeShipCode) {
      setIsFreeShippingApplied(true);
      setPromoDiscount(0);
      setPromoApplied(true);
      setPromoError('');
      showToast(
        lang === 'fr' 
          ? "Livraison gratuite appliquée !" 
          : "Free shipping applied!",
        "success"
      );
      return;
    }

    try {
      let promoData = null;
      
      if (supabase) {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('code', codeUpper)
          .single();
        if (!error && data) {
          promoData = data;
        }
      } else {
        // Local fallback
        const res = await apiFetch(`/promos/${encodeURIComponent(codeUpper)}`);
        if (res.ok) {
          promoData = await res.json();
        }
      }
      
      if (!promoData) {
        setPromoError('Code promo invalide / Invalid promo code.');
        return;
      }
      
      // Check if code has already been used
      const isUsed = Number(promoData.is_used) === 1 || promoData.is_used === true || promoData.is_used === 'true';
      if (isUsed) {
        setPromoError('Ce code a déjà été utilisé / This code has already been used.');
        return;
      }
      
      // Apply discount
      const pct = Number(promoData.discount_percent) || 10;
      setPromoDiscount(cartTotal * (pct / 100));
      setPromoApplied(true);
      setPromoError('');
    } catch (e) {
      console.error(e);
      setPromoError('Erreur de validation / Validation error.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      showToast(
        lang === 'fr' 
          ? "Veuillez lire et accepter les Conditions Générales de Vente pour finaliser votre commande." 
          : "Please read and accept the Terms & Conditions to complete your order.", 
        "error"
      );
      return;
    }

    setIsProcessing(true);
    
    try {
      const selectedZone = shippingZones.find(z => z.name === formData.city);
      const destLat = customCoords ? customCoords.lat : (selectedZone ? selectedZone.lat : 5.3484);
      const destLng = customCoords ? customCoords.lng : (selectedZone ? selectedZone.lng : -3.9788);

      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      
      const locations = {
        cocody: 'Cocody Depot (Carrefour Saint Jean, face pharmacie)',
        yopougon: 'Yopougon Retail Point (Face Cosmos Yopougon)',
        marcory: 'Marcory Warehouse (Zone 4, Rue du Canal)'
      };

      const fullAddress = deliveryMethod === 'pickup'
        ? `RETRAIT EN MAGASIN | Point: ${locations[pickupLocation]} | Date: ${pickupDate} | Heure: ${pickupTime}`
        : [
            formData.address,
            formData.street ? `${lang === 'fr' ? 'Rue' : 'Street'}: ${formData.street}` : '',
            formData.junction ? `${lang === 'fr' ? 'Carrefour' : 'Junction'}: ${formData.junction}` : '',
            formData.landmark ? `${lang === 'fr' ? 'Repère' : 'Landmark'}: ${formData.landmark}` : ''
          ].filter(Boolean).join(' | ');

      const paymentMethodText = paymentOption === 'direct' ? 'Wave Direct' : paymentOption === 'manual' ? 'Wave Manual' : 'Paiement à la Livraison';
      const contactInfo = [
        formData.phone,
        fullAddress || '',
        paymentMethodText,
        session?.email || '',
        session?.id || ''
      ].join(' | ');

      const orderPayload = {
        customer_name: formData.name,
        customer_contact: contactInfo,
        customer_phone: formData.phone,
        items: JSON.stringify(cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }))),
        total_amount: grandTotal,
        total: grandTotal,
        total_items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        status: 'pending',
        promo_code: promoApplied ? promoInput.toUpperCase() : null,
        city: deliveryMethod === 'pickup' ? `Retrait (${pickupLocation})` : formData.city,
        address: fullAddress,
        destination_lat: destLat,
        destination_lng: destLng
      };

      let newOrderId = null;

      if (supabase) {
        const { data, error } = await supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single();
        if (error) throw error;
        newOrderId = data?.id;
      } else {
        // Fallback to local Express/SQLite server
        const response = await apiFetch('/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        if (!response.ok) throw new Error('Local database placement failed');
        const resData = await response.json();
        newOrderId = resData.id;
      }

      // Mark promo code as used if applied
      if (promoApplied) {
        const codeUpper = promoInput.toUpperCase().trim();
        if (supabase) {
          await supabase
            .from('promo_codes')
            .update({ 
              is_used: 1, 
              used_by: `${formData.name} (${formData.phone})`, 
              used_at: new Date().toISOString() 
            })
            .eq('code', codeUpper);
        } else {
          // Local fallback
          await apiFetch(`/promos/${encodeURIComponent(codeUpper)}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: `${formData.name} (${formData.phone})` })
          }).catch(() => {});
        }
      }

      // Send WhatsApp (French formatted order details)
      const itemsList = cartItems.map(item => `- ${item.name} (Qté: ${item.quantity})`).join('\n');
      const currency = settings?.currency || 'FCFA';

      let addressDetails = `${formData.city}, ${formData.address}`;
      if (formData.street) addressDetails += `\nRue : ${formData.street}`;
      if (formData.junction) addressDetails += `\nCarrefour : ${formData.junction}`;
      if (formData.landmark) addressDetails += `\nRepère : ${formData.landmark}`;

      const rawMessage = `Bonjour Sweeto-Hub, je souhaite valider ma commande :\n` +
        `${itemsList}\n\n` +
        `Total : ${grandTotal.toLocaleString()} ${currency}\n` +
        `Moyen de Paiement : ${paymentOption === 'direct' ? 'Wave (Direct App/QR)' : paymentOption === 'manual' ? 'Transfert Wave Manuel' : 'Paiement à la Livraison'}\n` +
        `Destinataire : ${formData.name}\n` +
        `Téléphone : ${formData.phone}\n` +
        `Adresse de Livraison : ${addressDetails}\n\n` +
        `ID Commande : #${newOrderId}`;
      
      const message = encodeURIComponent(rawMessage);
      
      setWaMessage(message);
      setOrderId(newOrderId);
      clearCart();
      setIsProcessing(false);
      setIsSuccess(true);

      // Open Wave payment link in a new tab if selected
      if (paymentOption === 'direct') {
        try {
          const res = await apiFetch('/api/payments/wave/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: newOrderId })
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.checkoutUrl) {
              window.location.href = data.checkoutUrl;
              return;
            }
          }
          
          // Fallback to configured merchant payment link
          if (settings?.wave_payment_url && settings.wave_payment_url.trim()) {
            window.location.href = settings.wave_payment_url;
            return;
          }
          
          // Final fallback: show the manual/simulation page
          navigate(`/wave-pay/${newOrderId}`);
        } catch (e) {
          console.warn('Failed to start Wave session from checkout:', e);
          if (settings?.wave_payment_url && settings.wave_payment_url.trim()) {
            window.location.href = settings.wave_payment_url;
          } else {
            navigate(`/wave-pay/${newOrderId}`);
          }
        }
      } else {
        // Open WhatsApp to finalize checkout (use window.location for reliability)
        const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`;
        setTimeout(() => {
          window.location.href = whatsappUrl;
        }, 500);
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setIsProcessing(false);
      // Still clear cart and show success to prevent duplicate orders from user retrying
      setIsSuccess(true);
      clearCart();
    }
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-eas-dark flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,82,255,0.15),transparent_70%)]"></div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="max-w-lg w-full bg-eas-dark/50 backdrop-blur-3xl rounded-[3rem] p-12 text-center border border-white/10 shadow-[0_0_100px_rgba(0,82,255,0.2)] relative z-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-28 h-28 bg-eas-blue rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(0,82,255,0.5)]"
          >
            <CheckCircle2 size={56} className="text-white" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">{t('order_received') || 'Order Received'}</h2>
          <p className="text-slate-400 font-medium mb-12 leading-relaxed text-sm md:text-base">
            {t('thank_you_order') || 'Thank you for your order! Our team in'} <span className="text-white font-black">{formData.city}</span> {t('will_contact_you') || 'will contact you shortly at'} <span className="text-blue-300 font-black">{formData.phone}</span> {t('to_confirm_delivery') || 'to confirm the delivery time.'}
          </p>
          
          <div className="space-y-4">
             {orderId && (
               <button 
                 onClick={() => navigate(`/order-tracking/${orderId}`)}
                 className="w-full bg-eas-blue text-white font-black py-5 rounded-[2rem] uppercase tracking-[0.2em] shadow-xl hover:bg-[#0043d0] transition-all hover:scale-[1.02] active:scale-[0.98]"
               >
                 {t('track_order') || 'Track Order'}
               </button>
             )}
              {waMessage && (
                <button 
                  onClick={() => window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${waMessage}`, '_blank')}
                  className="w-full bg-[#25D366] text-white font-black py-5 rounded-[2rem] uppercase tracking-[0.2em] shadow-xl hover:bg-[#1DA851] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.116-2.887-6.98C15.782 1.896 13.313.864 10.68.864 5.244.864.827 5.285.823 10.724c0 1.687.445 3.328 1.29 4.767l-.992 3.62 3.71-.973zm11.365-6.86c-.302-.15-1.786-.882-2.057-.98-.27-.1-.468-.15-.665.15-.198.3-.765.98-.937 1.18-.173.2-.347.225-.65.075-.302-.15-1.276-.47-2.43-1.498-.897-.8-1.503-1.787-1.68-2.087-.177-.3-.02-.46.13-.61.137-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.24-.575-.48-.5-.665-.51-.173-.007-.37-.01-.568-.01-.198 0-.52.075-.79.37-.27.3-1.035 1.01-1.035 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.085 3.18 5.05 4.464.707.306 1.258.489 1.69.626.71.226 1.356.194 1.866.118.57-.085 1.786-.73 2.037-1.435.25-.705.25-1.31.175-1.435-.075-.125-.27-.2-.57-.35z"/>
                  </svg>
                  {lang === 'fr' ? 'Ouvrir WhatsApp pour finaliser' : 'Open WhatsApp to Finalize'}
                </button>
              )}
              {paymentOption === 'direct' && (
                <button 
                  onClick={() => window.open(settings?.wave_payment_url || 'https://pay.wave.com/m/M_ci_fZ7c2kHGPRKo/c/ci/', '_blank')}
                  className="w-full bg-[#0052FF] text-white font-black py-5 rounded-[2rem] uppercase tracking-[0.2em] shadow-xl hover:bg-[#0043d0] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M4 4h6v6H4V4zm2 2v2h2V6H6zm8-2h6v6h-6V4zm2 2v2h2V6h-2zM4 14h6v6H4v-6zm2 2v2h2v-2H6zm10 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 4h2v2h-2v-2zm2 2h2v-2h-2v2zm0-4h2v-2h-2v2zm-4-2h2v4h-2v-4zm0 6h2v-2h-2v2z"/>
                  </svg>
                  {lang === 'fr' ? 'Payer via Wave (App/QR)' : 'Pay via Wave (App/QR)'}
                </button>
              )}
             <button 
               onClick={() => navigate('/')}
               className={`w-full ${orderId ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-900 hover:bg-slate-100'} font-black py-5 rounded-[2rem] uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
             >
               {t('back_to_shop') || 'Return to Store'}
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // CHECKOUT SCREEN
  return (
    <div className="min-h-screen w-full bg-eas-light flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden lg:h-screen">
      {/* LEFT SIDE - ORDER SUMMARY (DARK) */}
      <div className="lg:w-[45%] bg-eas-dark p-8 lg:p-16 flex flex-col relative text-white min-h-[50vh] lg:h-screen lg:overflow-y-auto overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,82,255,0.2),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-eas-blue/10 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 flex flex-col h-full">
           <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all mb-12">
             <ArrowLeft size={20} />
           </button>

           <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">{t('order_summary') || 'Order Summary'}</h2>
           <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black mb-12">{cartItems.length} {t('items') || 'Items'}</p>

           <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6 mb-12">
             <AnimatePresence>
                {cartItems.map(item => (
                  <motion.div key={item.id} layout className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] p-3 border border-white/10 shrink-0">
                      <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-xs uppercase tracking-widest text-white/90 line-clamp-2">{item.name}</h4>
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-2">{t('qty') || 'Qty'}: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                       <span className="font-black text-sm text-blue-300">{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
             </AnimatePresence>
           </div>

           <div className="pt-8 border-t border-white/10 space-y-4">
              <div className="flex justify-between text-white/50 text-[10px] font-black uppercase tracking-widest">
                 <span>{t('subtotal') || 'Subtotal'}</span>
                 <span>{subtotal.toLocaleString()} {settings?.currency || 'FCFA'}</span>
              </div>

              <div className="flex justify-between text-white/50 text-[10px] font-black uppercase tracking-widest">
                 <span>{t('shipping') || 'Shipping'}</span>
                  <span className={shipping === 0 ? "text-emerald-400" : ""}>
                    {shipping === 0 ? (t('free') || 'FREE') : `${shipping.toLocaleString()} ${settings?.currency || 'FCFA'}`}
                  </span>
              </div>
              


              {promoApplied && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between text-blue-300 text-[10px] font-black uppercase tracking-widest bg-eas-blue/10 p-3 rounded-xl border border-eas-blue/20"
                >
                   <span className="flex items-center gap-2"><Award size={14} /> Promo: {promoInput.toUpperCase()}</span>
                   <span>-{promoDiscount.toLocaleString()} {settings?.currency || 'FCFA'}</span>
                </motion.div>
              )}
              
              <div className="flex justify-between items-end pt-6 mt-6 border-t border-white/10">
                 <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">{t('total_to_pay') || 'Total'}</span>
                 <span className="text-4xl font-black italic tracking-tighter text-white">{grandTotal.toLocaleString()} <span className="text-lg text-eas-blue">{settings?.currency || 'FCFA'}</span></span>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE - CHECKOUT FORM (LIGHT) */}
      <div className="lg:w-[55%] bg-white p-8 lg:p-12 xl:p-16 flex items-start justify-center lg:h-screen lg:overflow-y-auto">
         <div className="w-full max-w-lg">
            <div className="mb-12">
               <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{t('delivery_details') || 'Delivery Details'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{t('where_send_package') || 'Where should we send your package?'}</p>
            </div>



            <form onSubmit={handleCheckout} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('recipient_name') || 'Recipient Name'}</label>
                 <div className="relative">
                   <input required name="name" value={formData.name} onChange={handleInputChange} placeholder={t('eg_name') || "Yao Kouassi"} className="w-full bg-white border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-eas-dark outline-none focus:border-eas-blue focus:bg-white transition-all pl-14" />
                   <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('contact_phone') || 'Contact Phone'}</label>
                 <div className="relative">
                   <input required type="tel" inputMode="numeric" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07 XX XX XX XX" className="w-full bg-white border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-eas-dark outline-none focus:border-eas-blue focus:bg-white transition-all pl-14" />
                   <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
               </div>

               {/* PROMO CODE BOX */}
               <div className="p-6 bg-white rounded-[1.5rem] border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Promo Code</label>
                  <div className="flex gap-3">
                    <input 
                      value={promoInput} 
                      onChange={(e) => setPromoInput(e.target.value)} 
                      placeholder="Enter code (e.g. SWEETO10)" 
                      disabled={promoApplied}
                      className="flex-1 bg-eas-light border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-eas-dark outline-none focus:border-eas-blue disabled:opacity-50" 
                    />
                    <button 
                      type="button"
                      onClick={applyPromo}
                      disabled={!promoInput || promoApplied}
                      className="px-6 py-3 bg-eas-dark text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      {promoApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-[9px] font-bold mt-2 ml-1 uppercase">{promoError}</p>}
                </div>

                 {/* Shipping Method Selector */}
                 <div className="grid grid-cols-2 gap-3 mb-6">
                   <button
                     type="button"
                     onClick={() => setDeliveryMethod('home')}
                     className={`py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                       deliveryMethod === 'home'
                         ? 'bg-eas-blue text-white border-eas-blue shadow-md'
                         : 'bg-white border-slate-100 hover:border-slate-350 text-slate-700 dark:bg-slate-900 dark:border-white/5 dark:text-slate-350'
                     }`}
                   >
                     <span>🚚 {lang === 'fr' ? 'À Domicile' : 'Home Delivery'}</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => {
                       setDeliveryMethod('pickup');
                       if (!pickupDate) {
                         const tomorrow = new Date();
                         tomorrow.setDate(tomorrow.getDate() + 1);
                         setPickupDate(tomorrow.toISOString().split('T')[0]);
                       }
                     }}
                     className={`py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                       deliveryMethod === 'pickup'
                         ? 'bg-eas-blue text-white border-eas-blue shadow-md'
                         : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-white/5 dark:text-slate-350'
                     }`}
                   >
                     <span>🏪 {lang === 'fr' ? 'Retrait Magasin' : 'Store Pickup'}</span>
                   </button>
                 </div>

                 {/* Click & Collect Scheduler */}
                 {deliveryMethod === 'pickup' && (
                   <div className="space-y-4 p-6 bg-white rounded-[2rem] border border-slate-100 mb-6 text-left">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                       {lang === 'fr' ? 'Planifier le Retrait' : 'Schedule Pickup'}
                     </h3>
                     
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                         {lang === 'fr' ? 'Point de Retrait' : 'Pickup Location'}
                       </label>
                       <select
                         value={pickupLocation}
                         onChange={(e) => setPickupLocation(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-eas-blue"
                       >
                         <option value="cocody">Cocody Depot (Carrefour Saint Jean, face pharmacie)</option>
                         <option value="yopougon">Yopougon Retail Point (Face Cosmos Yopougon)</option>
                         <option value="marcory">Marcory Warehouse (Zone 4, Rue du Canal)</option>
                       </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                           {lang === 'fr' ? 'Date de Retrait' : 'Pickup Date'}
                         </label>
                         <input
                           type="date"
                           value={pickupDate}
                           onChange={(e) => setPickupDate(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-eas-blue"
                         />
                       </div>
                       
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                           {lang === 'fr' ? 'Heure de Retrait' : 'Pickup Time'}
                         </label>
                         <select
                           value={pickupTime}
                           onChange={(e) => setPickupTime(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-eas-blue"
                         >
                           <option value="09:00">09:00</option>
                           <option value="10:30">10:30</option>
                           <option value="12:00">12:00</option>
                           <option value="14:00">14:00</option>
                           <option value="15:30">15:30</option>
                           <option value="17:00">17:00</option>
                           <option value="18:30">18:30</option>
                         </select>
                       </div>
                     </div>
                   </div>
                 )}

                {/* Quick Hub Locks (Dynamic City & Area selection) */}
                {deliveryMethod === 'home' && (
                <>
                <div className="space-y-4 p-5 bg-white dark:bg-eas-dark/40 rounded-[2rem] border border-slate-100 dark:border-white/5 mb-6">
                  {/* City Select Row */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">
                      {lang === 'fr' ? '🌍 Choisir une Ville' : '🌍 Select a City'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Abidjan', 'Yamoussoukro', 'Bouaké', 'San Pédro', 'Daloa', 'Korhogo', 'Man', 'Gagnoa', 'Grand-Bassam', 'Assinie', 'Abengourou'].map((city) => {
                        const isSelected = formData.city === city;
                        return (
                          <motion.button
                            key={city}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                city: city,
                                address: '' // Reset address when changing city
                              }));
                            }}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                              isSelected
                                ? 'bg-eas-blue text-white border-eas-blue shadow-md shadow-eas-blue/20'
                                : 'bg-eas-light hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-eas-dark dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                          >
                            {city}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Area Select Row */}
                  {cityAreas[formData.city] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t border-slate-100 dark:border-white/5"
                    >
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-2">
                        {lang === 'fr' ? `📍 Quartiers / Secteurs de ${formData.city}` : `📍 Neighborhoods / Sectors of ${formData.city}`}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cityAreas[formData.city].map((area) => {
                          const isSelected = formData.address === area;
                          return (
                            <motion.button
                              key={area}
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  address: area
                                }));
                              }}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                  isSelected
                                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                  : 'bg-eas-light hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-eas-dark dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              {area}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
 
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('city') || 'City'}</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCityDropdown(!showCityDropdown)}
                          className="w-full bg-white border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-eas-dark text-left outline-none focus:border-eas-blue transition-all cursor-pointer pl-12 pr-4 flex justify-between items-center"
                        >
                          <span>{formData.city || 'Select City'}</span>
                          <ChevronDown size={16} className="text-slate-400" />
                        </button>
                        <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        
                        <AnimatePresence>
                          {showCityDropdown && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto"
                              >
                                <div className="p-2 space-y-1">
                                  {(shippingZones.length === 0 
                                    ? [
                                        { name: 'Abidjan' },
                                        { name: 'Yamoussoukro' },
                                        { name: 'Bouaké' },
                                        { name: 'San Pédro' },
                                        { name: 'Daloa' },
                                        { name: 'Korhogo' },
                                        { name: 'Man' },
                                        { name: 'Gagnoa' },
                                        { name: 'Grand-Bassam' },
                                        { name: 'Assinie' },
                                        { name: 'Abengourou' }
                                      ] 
                                    : shippingZones
                                  ).map((z, idx) => {
                                    const isSelected = formData.city === z.name;
                                    return (
                                      <button
                                        key={z.id || idx}
                                        type="button"
                                        onClick={() => {
                                          setFormData({ ...formData, city: z.name });
                                          setShowCityDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex justify-between items-center cursor-pointer ${
                                          isSelected 
                                            ? 'bg-eas-blue/10 text-eas-blue' 
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span>{z.name}</span>
                                        {isSelected && <Check size={14} strokeWidth={3} className="text-eas-blue" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                  </div>             
                 <div className="space-y-2 relative">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('precise_address') || 'Address'}</label>
                     <div className="relative">
                       <input 
                         required 
                         name="address" 
                         value={formData.address} 
                         onChange={(e) => {
                           handleInputChange(e);
                           fetchSuggestions(e.target.value, 'address');
                         }} 
                         placeholder="Cocody, Block 4" 
                         className="w-full bg-white border border-slate-100/80 rounded-[1.5rem] px-6 py-5 pl-12 text-sm font-bold text-eas-dark outline-none focus:border-eas-blue focus:bg-white transition-all" 
                       />
                       <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                     </div>
                     {/* Render suggestions for address */}
                     {showSuggestions && suggestionField === 'address' && (
                       <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                         {suggestions.map((p, idx) => (
                           <button
                             key={idx}
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleSelectSuggestion(p);
                             }}
                             className="w-full px-5 py-3.5 text-left text-xs font-bold text-eas-dark hover:bg-slate-50 border-b border-slate-50 last:border-none flex items-start gap-2.5 transition-all"
                           >
                             <MapPin size={14} className="text-eas-blue shrink-0 mt-0.5" />
                             <div>
                               <p className="font-extrabold text-eas-dark">{p.display_name.split(',')[0]}</p>
                               <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">{p.display_name}</p>
                             </div>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                </div>

                {/* Detailed delivery location details */}
                <div className="p-6 bg-white dark:bg-eas-dark/40 rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                     <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                       {lang === 'fr' ? '📍 Précisions pour le Livreur (Optionnel)' : '📍 Delivery Details for Rider (Optional)'}
                     </span>
                     
                     <button
                       type="button"
                       onClick={fetchGPSLocation}
                       disabled={gpsLoading}
                       className="px-4 py-2.5 bg-eas-blue/10 hover:bg-eas-blue/20 text-eas-blue dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 border border-eas-blue/20 shrink-0 self-start sm:self-auto"
                     >
                       {gpsLoading ? (
                         <Loader2 size={12} className="animate-spin" />
                       ) : gpsSuccess ? (
                         <CheckCircle2 size={12} className="text-emerald-500" />
                       ) : (
                         <MapPin size={12} />
                       )}
                       {gpsLoading
                         ? (lang === 'fr' ? 'Localisation...' : 'Locating...')
                         : gpsSuccess
                         ? (lang === 'fr' ? 'Auto-rempli ✓' : 'Auto-filled ✓')
                         : (lang === 'fr' ? 'Remplir via mon GPS' : 'Auto-fill using GPS')}
                     </button>
                   </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === 'fr' ? 'Rue / Avenue' : 'Street / Avenue'}
                      </label>
                      <div className="relative">
                        <input 
                          name="street" 
                          value={formData.street} 
                          onChange={(e) => {
                            handleInputChange(e);
                            fetchSuggestions(e.target.value, 'street');
                          }} 
                          placeholder={lang === 'fr' ? 'Ex: Rue L12, Boulevard Latrille' : 'e.g. Rue L12, Latrille Blvd'} 
                          className="w-full bg-eas-light dark:bg-eas-dark border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 pl-12 text-xs font-bold text-eas-dark dark:text-white outline-none focus:border-eas-blue transition-all" 
                        />
                        <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      </div>
                      {/* Render suggestions for street */}
                      {showSuggestions && suggestionField === 'street' && (
                        <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-eas-dark border border-slate-100 dark:border-white/5 shadow-2xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                          {suggestions.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSuggestion(p);
                              }}
                              className="w-full px-4 py-3 text-left text-xs font-bold text-eas-dark dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-eas-dark border-b border-slate-50 dark:border-white/5 last:border-none flex items-start gap-2.5 transition-all"
                            >
                              <Map size={14} className="text-eas-blue shrink-0 mt-0.5" />
                              <div>
                                <p className="font-extrabold text-eas-dark dark:text-white">{p.display_name.split(',')[0]}</p>
                                <p className="text-[9px] text-slate-400 font-medium line-clamp-1 mt-0.5">{p.display_name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {lang === 'fr' ? 'Carrefour / Rond-point' : 'Junction / Roundabout'}
                      </label>
                      <div className="relative">
                        <input 
                          name="junction" 
                          value={formData.junction} 
                          onChange={handleInputChange} 
                          placeholder={lang === 'fr' ? 'Ex: Carrefour Samaké' : 'e.g. Samake Junction'} 
                          className="w-full bg-white dark:bg-eas-dark border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 pl-12 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-eas-blue transition-all" 
                        />
                        <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      </div>
                    </div>
                  </div>
 
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {lang === 'fr' ? 'Point de repère / Détails maison' : 'Landmark / Building Description'}
                    </label>
                    <div className="relative">
                      <input 
                        name="landmark" 
                        value={formData.landmark} 
                        onChange={handleInputChange} 
                        placeholder={lang === 'fr' ? 'Ex: En face de la pharmacie, portail beige' : 'e.g. Opposite the pharmacy, beige gate'} 
                        className="w-full bg-white dark:bg-eas-dark border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 pl-12 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-eas-blue transition-all" 
                      />
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    </div>
                  </div>
                </div>
                </>
                )}

                <div className="mt-10 space-y-4">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] ml-2">
                    {t('payment_method') || 'Payment Method'}
                  </h4>

                  {/* Option A: Direct Mobile Money payment */}
                  <div 
                    onClick={() => setPaymentOption('direct')}
                    className={`p-5 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between gap-4 ${paymentOption === 'direct' ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/5' : 'bg-eas-light dark:bg-slate-905/40 border-slate-100 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${paymentOption === 'direct' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M4 4h6v6H4V4zm2 2v2h2V6H6zm8-2h6v6h-6V4zm2 2v2h2V6h-2zM4 14h6v6H4v-6zm2 2v2h2v-2H6zm10 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 4h2v2h-2v-2zm2 2h2v-2h-2v2zm0-4h2v-2h-2v2zm-4-2h2v4h-2v-4zm0 6h2v-2h-2v2z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          {lang === 'fr' ? 'Paiement Mobile Money Direct' : 'Direct Mobile Money Payment'}
                        </h5>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-normal mt-0.5">
                          {lang === 'fr' ? 'Paiement automatique instantané (Wave, Orange, MTN)' : 'Instant automated payment (Wave, Orange, MTN)'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentOption === 'direct' ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700'}`}>
                        {paymentOption === 'direct' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Option B: Manual Mobile Money Transfer */}
                  <div 
                    onClick={() => setPaymentOption('manual')}
                    className={`p-5 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between gap-4 ${paymentOption === 'manual' ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/5' : 'bg-eas-light dark:bg-slate-905/40 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${paymentOption === 'manual' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <Phone size={18} />
                      </div>
                      <div className="text-left">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          {lang === 'fr' ? 'Transfert Mobile Money Manuel' : 'Manual Mobile Money Transfer'}
                        </h5>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-normal mt-0.5">
                          {lang === 'fr' ? 'Envoyez les fonds manuellement à nos numéros marchands' : 'Send funds manually to our merchant numbers'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentOption === 'manual' ? 'border-cyan-500' : 'border-slate-300 dark:border-slate-700'}`}>
                        {paymentOption === 'manual' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Manual details card (conditional) */}
                  {paymentOption === 'manual' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-[2rem] bg-cyan-500/5 border border-cyan-500/10 flex flex-col items-center gap-2.5 text-center mt-2"
                    >
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                        {lang === 'fr' ? 'Effectuez le transfert au numéro de votre choix :' : 'Please perform the transfer to the phone number of your choice:'}
                      </p>
                      <div className="flex flex-col gap-2 w-full max-w-xs">
                        <span className="px-4 py-2.5 rounded-2xl text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-between">
                          <span>Wave:</span>
                          <span className="select-all">{settings?.wave_number || '+225 05 00 61 99 23'}</span>
                        </span>
                        <span className="px-4 py-2.5 rounded-2xl text-[10px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center justify-between">
                          <span>Orange Money:</span>
                          <span className="select-all">{settings?.loc_phone || '+225 07 07 07 07 07'}</span>
                        </span>
                        <span className="px-4 py-2.5 rounded-2xl text-[10px] font-black bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 flex items-center justify-between">
                          <span>MTN MoMo:</span>
                          <span className="select-all">{settings?.admin_phone || '+225 05 05 05 05 05'}</span>
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Option C: Pay on Delivery */}
                  <div 
                    onClick={() => setPaymentOption('cod')}
                    className={`p-5 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between gap-4 ${paymentOption === 'cod' ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/5' : 'bg-eas-light dark:bg-slate-905/40 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${paymentOption === 'cod' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <Truck size={18} />
                      </div>
                      <div className="text-left">
                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          {lang === 'fr' ? 'Payer à la Livraison' : 'Pay on Delivery'}
                        </h5>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-normal mt-0.5">
                          {lang === 'fr' ? 'Payez en espèces ou par Wave lors de la réception' : 'Pay with cash or Wave money upon receiving your order'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentOption === 'cod' ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-700'}`}>
                        {paymentOption === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="mt-8 flex items-start gap-3 p-5 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[1.5rem] text-left">
                  <input 
                    type="checkbox" 
                    id="terms-checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4.5 h-4.5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <label htmlFor="terms-checkbox" className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                    {lang === 'fr' ? (
                      <>
                        J'ai lu et j'accepte les{' '}
                        <a href="#/legal?tab=terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 font-black underline">
                          Conditions Générales de Vente
                        </a>{' '}
                        et la{' '}
                        <a href="#/legal?tab=refund" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 font-black underline">
                          Politique de Retour
                        </a>.
                      </>
                    ) : (
                      <>
                        I have read and agree to the{' '}
                        <a href="#/legal?tab=terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 font-black underline">
                          Terms & Conditions
                        </a>{' '}
                        and the{' '}
                        <a href="#/legal?tab=refund" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 font-black underline">
                          Return Policy
                        </a>.
                      </>
                    )}
                  </label>
                </div>

                <motion.button 
                  type="submit"
                  disabled={isProcessing}
                  whileHover={!isProcessing ? { scale: 1.02 } : {}}
                  whileTap={!isProcessing ? { scale: 0.98 } : {}}
                  className="w-full mt-8 bg-[#25D366] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-[#25D366]/20 flex items-center justify-center gap-3 hover:bg-[#20ba5a] transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.116-2.887-6.98C15.782 1.896 13.313.864 10.68.864 5.244.864.827 5.285.823 10.724c0 1.687.445 3.328 1.29 4.767l-.992 3.62 3.71-.973zm11.365-6.86c-.302-.15-1.786-.882-2.057-.98-.27-.1-.468-.15-.665.15-.198.3-.765.98-.937 1.18-.173.2-.347.225-.65.075-.302-.15-1.276-.47-2.43-1.498-.897-.8-1.503-1.787-1.68-2.087-.177-.3-.02-.46.13-.61.137-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.24-.575-.48-.5-.665-.51-.173-.007-.37-.01-.568-.01-.198 0-.52.075-.79.37-.27.3-1.035 1.01-1.035 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.085 3.18 5.05 4.464.707.306 1.258.489 1.69.626.71.226 1.356.194 1.866.118.57-.085 1.786-.73 2.037-1.435.25-.705.25-1.31.175-1.435-.075-.125-.27-.2-.57-.35z"/>
                      </svg>
                      <span>{lang === 'fr' ? 'Confirmer & Commander via WhatsApp' : 'Confirm & Order via WhatsApp'}</span>
                    </>
                  )}
                </motion.button>
               
               <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Secure checkout process
               </p>
            </form>
         </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
