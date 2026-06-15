import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, ArrowRight, MapPin, Phone, User, Package, Award, UserCheck, Loader2, Compass, Home, Map, ChevronDown, Check } from 'lucide-react';
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
  const { settings } = useStore();
  const { t, isRTL, lang } = useLanguage();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [waMessage, setWaMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', city: 'Abidjan', address: '', street: '', junction: '', landmark: ''
  });
  const [currentUser, setCurrentUser] = useState(null);

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
  const [showCityDropdown, setShowCityDropdown] = useState(false);

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

      const url = LOCATIONIQ_KEY
        ? `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(fullQuery)}&limit=5&countrycodes=ci&accept-language=${lang}`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&addressdetails=1&limit=5&countrycodes=ci`;

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
      alert(lang === 'fr' ? "La géolocalisation n'est pas supportée par votre navigateur." : "Geolocation is not supported by this browser.");
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
        alert(msg);
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
  const shipping = hasUnsetPrice ? 0 : shippingFee;
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
    setIsProcessing(true);
    
    try {
      const selectedZone = shippingZones.find(z => z.name === formData.city);
      const destLat = customCoords ? customCoords.lat : (selectedZone ? selectedZone.lat : 5.3484);
      const destLng = customCoords ? customCoords.lng : (selectedZone ? selectedZone.lng : -3.9788);

      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      
      const fullAddress = [
        formData.address,
        formData.street ? `${lang === 'fr' ? 'Rue' : 'Street'}: ${formData.street}` : '',
        formData.junction ? `${lang === 'fr' ? 'Carrefour' : 'Junction'}: ${formData.junction}` : '',
        formData.landmark ? `${lang === 'fr' ? 'Repère' : 'Landmark'}: ${formData.landmark}` : ''
      ].filter(Boolean).join(' | ');

      const contactInfo = [
        formData.phone,
        fullAddress || '',
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
        city: formData.city,
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

      // Immediately redirect user to WhatsApp for checkout execution
      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      setIsProcessing(false);
      setIsSuccess(true);
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
                   <input required type="tel" inputmode="numeric" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07 XX XX XX XX" className="w-full bg-white border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-eas-dark outline-none focus:border-eas-blue focus:bg-white transition-all pl-14" />
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

                {/* Quick Hub Locks (Dynamic City & Area selection) */}
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

                <div className="mt-10 p-6 rounded-[2rem] bg-eas-light border border-eas-blue/20 flex items-center gap-4">
                  <div className="w-12 h-12 bg-eas-blue text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-eas-blue/20">
                     <Package size={20} />
                  </div>
                  <div>
                     <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm italic">{t('pay_on_delivery') || 'Pay on Delivery'}</h4>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('payment_collected_doorstep') || 'Payment collected at doorstep'}</p>
                  </div>
               </div>
 
               {/* Local Mobile Money Trust Badge Card */}
                <div className="mt-4 p-6 rounded-[2rem] bg-eas-light dark:bg-eas-dark/60 border border-slate-100/50 dark:border-white/5 flex flex-col">
                   <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] mb-2">{t('payment_method') || 'Payment Method'}</h4>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 font-bold">
                      {lang === 'fr' ? 'Payez à la livraison en espèces ou par transfert mobile :' : 'Pay upon delivery using cash or mobile transfer:'}
                   </p>
                   <div className="flex flex-wrap gap-2">
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-eas-blue/10 text-eas-blue dark:text-blue-400 border border-eas-blue/20">Wave</span>
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">Orange Money</span>
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-eas-blue/10 text-eas-blue dark:text-blue-400 border border-eas-blue/20">Moov Money</span>
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">MTN MoMo</span>
                   </div>
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
