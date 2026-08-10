import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, ArrowRight, MapPin, Phone, User, Package, Award, UserCheck, Loader2, Compass, Home, Map, ChevronDown, Check, Truck, Lock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { playSound } from '../utils/sound';
import { apiFetch } from '../utils/api';
import ProductCard from '../components/ProductCard';
import OrderNotificationFlow from '../components/OrderNotificationFlow';

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
  const { settings, showToast, products } = useStore();
  const { t, isRTL, lang } = useLanguage();
  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));
  
  const isCardEnabled = settings?.payment_method_card_enabled !== 'false' && settings?.payment_method_card_enabled !== false;
  const isWaveEnabled = settings?.payment_method_wave_enabled !== 'false' && settings?.payment_method_wave_enabled !== false;
  const isCodEnabled = settings?.payment_method_cod_enabled !== 'false' && settings?.payment_method_cod_enabled !== false;
  const activeMethodsCount = [isCardEnabled, isWaveEnabled, isCodEnabled].filter(Boolean).length;
  const gridColsClass = activeMethodsCount === 3 
    ? 'grid-cols-3' 
    : activeMethodsCount === 2 
      ? 'grid-cols-2' 
      : 'grid-cols-1';

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [waMessage, setWaMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState('card'); // 'card' | 'wave' | 'cod'

  useEffect(() => {
    setIsPaymentVerified(false);
  }, [paymentOption]);

  useEffect(() => {
    if (settings) {
      const cardActive = settings.payment_method_card_enabled !== 'false' && settings.payment_method_card_enabled !== false;
      const waveActive = settings.payment_method_wave_enabled !== 'false' && settings.payment_method_wave_enabled !== false;
      const codActive = settings.payment_method_cod_enabled !== 'false' && settings.payment_method_cod_enabled !== false;

      if (!cardActive && paymentOption === 'card') {
        if (waveActive) setPaymentOption('wave');
        else if (codActive) setPaymentOption('cod');
        else setPaymentOption('');
      } else if (!waveActive && paymentOption === 'wave') {
        if (cardActive) setPaymentOption('card');
        else if (codActive) setPaymentOption('cod');
        else setPaymentOption('');
      } else if (!codActive && paymentOption === 'cod') {

        if (cardActive) setPaymentOption('card');
        else if (waveActive) setPaymentOption('wave');
        else setPaymentOption('');
      } else if (!paymentOption) {
        if (cardActive) setPaymentOption('card');
        else if (waveActive) setPaymentOption('wave');
        else if (codActive) setPaymentOption('cod');
      }
    }
  }, [settings, paymentOption]);
  const [orderShipping, setOrderShipping] = useState(0);
  const [orderSubtotal, setOrderSubtotal] = useState(0);
  const [formData, setFormData] = useState({
    name: '', phone: '', city: 'Abidjan', address: '', street: '', junction: '', landmark: '', area: '', zipCode: '00225'
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [orderedItems, setOrderedItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [placedOrderData, setPlacedOrderData] = useState(null);
  const [waveLaunchUrl, setWaveLaunchUrl] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(true);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('00225');
  const [shippingSpeed, setShippingSpeed] = useState('standard'); // 'standard' | 'express'
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    if (formData.name) {
      const parts = formData.name.trim().split(/\s+/);
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setFirstName(parts[0]);
        setLastName('');
      }
    }
  }, [formData.name]);

  useEffect(() => {
    const combinedName = `${firstName} ${lastName}`.trim();
    if (combinedName !== formData.name) {
      setFormData(prev => ({
        ...prev,
        name: combinedName
      }));
    }
  }, [firstName, lastName]);

  useEffect(() => {
    const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMob);
  }, []);
  const [step, setStep] = useState(1); // checkout wizard step

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        showToast(lang === 'fr' ? "Veuillez entrer vos nom et prénom." : "Please enter your name.", "error");
        return false;
      }
      if (!email.trim()) {
        showToast(lang === 'fr' ? "Veuillez entrer votre adresse e-mail." : "Please enter your email address.", "error");
        return false;
      }
      if (!formData.phone.trim()) {
        showToast(lang === 'fr' ? "Veuillez entrer votre numéro de téléphone." : "Please enter your phone number.", "error");
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!paymentOption) {
        showToast(lang === 'fr' ? "Veuillez sélectionner un moyen de paiement." : "Please select a payment method.", "error");
        return false;
      }
      return true;
    }
    return true;
  };

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (!session) {
      showToast(lang === 'fr' ? "Veuillez vous connecter pour accéder à la caisse." : "Please login to access checkout.", "error");
      navigate('/login?redirect=/checkout');
      return;
    }
    setCurrentUser(session);
    if (session.email) {
      setEmail(session.email);
    }
    setFormData({
      name: session.name || '',
      phone: session.phoneNumber || session.phone || '',
      city: session.city || 'Abidjan',
      address: session.address || '',
      street: session.street || '',
      junction: session.junction || '',
      landmark: session.landmark || '',
      area: session.area || '',
      zipCode: session.zipCode || '00225'
    });
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
          : { 'Accept-Language': lang === 'fr' ? 'fr' : 'en' };

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
              address: suburbVal || prev.address || `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              street: roadVal || prev.street,
              landmark: landmarkVal ? `${landmarkVal} (${data.display_name.split(',')[0]})` : (data.display_name ? data.display_name.split(',').slice(0, 2).join(', ') : prev.landmark)
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              address: `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            }));
          }
        })
        .catch(err => {
          console.warn('Reverse geocoding error:', err);
          setFormData(prev => ({
            ...prev,
            address: `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }));
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
  const estimatedTax = 0;
  const tax = 0;
  const hasUnsetPrice = cartItems.some(item => !item.price || Number(item.price) === 0);
  const shipping = (hasUnsetPrice || isFreeShippingApplied || deliveryMethod === 'pickup') ? 0 : shippingFee;
  const grandTotal = subtotal + shipping - promoDiscount + tax;

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

      const paymentMethodText = paymentOption === 'card' ? 'Carte de Crédit' : paymentOption === 'wave' ? 'Wave Mobile' : 'Paiement à la Livraison';
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
        items: JSON.stringify(cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || item.image_url || (item.images && item.images[0]) || '',
          image_url: item.image_url || item.image || (item.images && item.images[0]) || '',
          color: item.selectedColor || item.color || '',
          size: item.selectedSize || item.size || ''
        }))),
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
        const { data, error } = await Promise.resolve(supabase
          .from('orders')
          .insert([orderPayload])
          .select()
          .single());
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
        `Moyen de Paiement : ${paymentOption === 'card' ? 'Carte de Crédit (Payée)' : paymentOption === 'wave' ? 'Wave Mobile (Payé)' : 'Paiement à la Livraison'}\n` +
        `Destinataire : ${formData.name}\n` +
        `Téléphone : ${formData.phone}\n` +
        `Adresse de Livraison : ${addressDetails}\n\n` +
        `ID Commande : #${newOrderId}`;
      
      const message = encodeURIComponent(rawMessage);
      const completedOrder = {
        id: newOrderId,
        customer_name: formData.name,
        customer_phone: formData.phone,
        address: addressDetails,
        city: formData.city,
        total_amount: grandTotal,
        currency: currency,
        items: [...cartItems],
        created_at: new Date().toISOString()
      };
      setPlacedOrderData(completedOrder);

      // Save order locally for realtime notification bell status & orders history tracking
      try {
        const storedOrders = JSON.parse(localStorage.getItem('customer_orders') || '[]');
        storedOrders.unshift(completedOrder);
        localStorage.setItem('customer_orders', JSON.stringify(storedOrders));
        window.dispatchEvent(new Event('notifications_updated'));
      } catch (e) {
        console.warn('Failed to save order to local list:', e);
      }

      // Prompt for push subscription
      try {
        pushManager.subscribe('customer').catch(() => {});
      } catch (e) {}

      setWaMessage(message);
      setOrderId(newOrderId);
      setOrderedItems([...cartItems]);
      setOrderTotal(grandTotal);
      setOrderShipping(shipping);
      setOrderSubtotal(subtotal);
      clearCart();
      setIsProcessing(false);
      setIsSuccess(true);

      // Get Wave payment link if selected
      if (paymentOption === 'direct') {
        try {
          const res = await apiFetch('/api/payments/wave/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: newOrderId })
          });
          
          let targetUrl = '';
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.checkoutUrl) {
              targetUrl = data.checkoutUrl;
            }
          }
          
          if (!targetUrl) {
            const baseLink = settings?.wave_payment_url?.trim() || 'https://pay.wave.com/m/M_ci_fZ7c2kHGPRKo/c/ci/';
            targetUrl = baseLink.includes('?') 
              ? `${baseLink}&amount=${grandTotal}` 
              : `${baseLink}?amount=${grandTotal}`;
          }

          setWaveLaunchUrl(targetUrl);
        } catch (e) {
          console.warn('Failed to start Wave session from checkout:', e);
          const baseLink = settings?.wave_payment_url?.trim() || 'https://pay.wave.com/m/M_ci_fZ7c2kHGPRKo/c/ci/';
          const waveLink = baseLink.includes('?') 
            ? `${baseLink}&amount=${grandTotal}` 
            : `${baseLink}?amount=${grandTotal}`;
          setWaveLaunchUrl(waveLink);
        }
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setIsProcessing(false);
      showToast(lang === 'fr' ? 'Échec de la validation. Veuillez vérifier votre connexion et réessayer.' : 'Order placement failed. Please check your connection and try again.', 'error');
    }
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    const currency = currencySymbol || settings?.currency || 'FCFA';

    const handleCopyOrderId = () => {
      if (orderId) {
        navigator.clipboard.writeText(`ORD-${orderId}`);
        showToast(lang === 'fr' ? 'ID Commande copié !' : 'Order ID copied!', 'success');
      }
    };

    const handleWhatsAppRedirect = () => {
      if (waMessage) {
        const waNumber = settings?.admin_phone?.replace(/\D/g, '') || settings?.contactPhone?.replace(/\D/g, '') || settings?.loc_phone?.replace(/\D/g, '') || "2250500619923";
        window.open(`https://wa.me/${waNumber}?text=${waMessage}`, '_blank');
      } else {
        handleConfirmWhatsAppOrder();
      }
    };

    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] font-sans antialiased text-slate-800 dark:text-slate-200">
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800/80 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#1f7cf6] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#1f7cf6]/20">
                <CheckCircle2 size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                {lang === 'fr' ? 'Confirmation' : 'Confirmation'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{lang === 'fr' ? 'Retour à la boutique' : 'Back to Store'}</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: Confirmation Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 shadow-sm text-center flex flex-col items-center">
            
            {/* Green Checkmark Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 bg-[#10b981] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#10b981]/25 mb-6"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            {/* Title & Subtitle */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3"
            >
              {lang === 'fr' ? 'Commande passée ! 🎉' : 'Order Placed! 🎉'}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 max-w-md"
            >
              {lang === 'fr' 
                ? 'Merci pour votre commande. Nous la confirmerons sous peu.' 
                : 'Thank you for your order. We will confirm it shortly.'}
            </motion.p>

            {/* Order ID Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={handleCopyOrderId}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-full cursor-pointer hover:bg-slate-200/70 transition-all mb-4"
              title={lang === 'fr' ? "Cliquer pour copier l'identifiant" : 'Click to copy order ID'}
            >
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Order #ORD-{orderId || 'SWT'}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </motion.div>

            {/* Confirmation Email Note */}
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-8">
              {lang === 'fr' 
                ? 'Une confirmation a été envoyée à votre adresse e-mail.' 
                : 'A confirmation has been sent to your email address.'}
            </p>

            {/* Two Side-by-Side Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1f7cf6] hover:bg-[#1361c4] text-white font-bold text-sm shadow-md shadow-[#1f7cf6]/20 transition-all cursor-pointer text-center"
              >
                {lang === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="w-full py-3.5 px-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-sm transition-all cursor-pointer text-center"
              >
                {lang === 'fr' ? 'Voir les commandes' : 'View Orders'}
              </button>
            </div>

            {/* Green WhatsApp Contact Button */}
            <button
              type="button"
              onClick={handleWhatsAppRedirect}
              className="w-full max-w-md py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-1"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>{lang === 'fr' ? 'Contacter le vendeur sur WhatsApp' : 'Contact seller on WhatsApp'}</span>
            </button>
          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          <div className="lg:col-span-1 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm sticky top-24">
            
            {/* Lock Icon + Header */}
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{lang === 'fr' ? 'Récapitulatif de la commande' : 'Order Summary'}</span>
            </h2>

            {/* Items list */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 mb-6">
              {(orderedItems.length > 0 ? orderedItems : cartItems).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                    {item.image_url || item.image ? (
                      <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={18} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate leading-snug">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white shrink-0 pl-2">
                    {currency} {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-slate-150 dark:bg-slate-800/80 my-4" />

            {/* Calculations breakdown */}
            <div className="space-y-3.5 text-xs text-left">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-semibold">
                <span>{lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {currency} {Number(orderSubtotal || subtotal).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-semibold">
                <span>{lang === 'fr' ? 'Frais de livraison' : 'Delivery Fee'}</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {(orderShipping ?? shipping) === 0 ? (
                    <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded">
                      {lang === 'fr' ? 'Gratuit' : 'Free'}
                    </span>
                  ) : (
                    `${currency} ${Number(orderShipping ?? shipping).toLocaleString()}`
                  )}
                </span>
              </div>

              <div className="h-px bg-slate-150 dark:bg-slate-800/80 my-4" />
              
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-black text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-black text-[#1f7cf6]">
                  {currency} {Number(orderTotal || grandTotal).toLocaleString()}
                </span>
              </div>
            </div>

            {/* WhatsApp button inside order summary */}
            <button
              type="button"
              onClick={handleWhatsAppRedirect}
              className="w-full mt-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>{lang === 'fr' ? 'Contacter le vendeur sur WhatsApp' : 'Contact seller on WhatsApp'}</span>
            </button>

          </div>

        </div>
      </div>
    );
  }

  const handleConfirmWhatsAppOrder = async () => {
    setIsProcessing(true);
    
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    const customerName = session?.full_name || session?.username || 'WhatsApp Customer';
    const customerPhone = session?.phone || session?.phoneNumber || 'WhatsApp';
    
    // Address Details
    const addressDetails = `WhatsApp Checkout`;
    const contactInfo = [
      customerPhone,
      addressDetails,
      'WhatsApp Checkout',
      session?.email || '',
      session?.id || ''
    ].join(' | ');

    const orderPayload = {
      customer_name: customerName,
      customer_contact: contactInfo,
      customer_phone: customerPhone,
      items: JSON.stringify(cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || item.image_url || (item.images && item.images[0]) || '',
        image_url: item.image_url || item.image || (item.images && item.images[0]) || '',
        color: item.selectedColor || item.color || '',
        size: item.selectedSize || item.size || ''
      }))),
      total_amount: grandTotal,
      total: grandTotal,
      total_items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      status: 'pending',
      promo_code: null,
      city: 'WhatsApp Checkout',
      address: addressDetails,
    };

    let newOrderId = null;

    try {
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
    } catch (err) {
      console.warn('Failed to record order to DB before WhatsApp redirect:', err);
    }

    const itemsText = cartItems.map(item => {
      return `• ${item.name} (${item.quantity}x) - ${settings?.currency || 'FCFA'} ${(item.price * item.quantity).toLocaleString()}`;
    }).join('\n');

    const totalText = `${settings?.currency || 'FCFA'} ${grandTotal.toLocaleString()}`;
    const productLinks = cartItems.map(item => {
      return `${window.location.origin}/product/${item.id}`;
    }).join('\n');

    const message = lang === 'fr' 
      ? `Bonjour ! Je souhaite valider la commande suivante :\n\n${itemsText}\n\nSous-total : ${settings?.currency || 'FCFA'} ${subtotal.toLocaleString()}\nFrais de transport : ${settings?.currency || 'FCFA'} ${shipping.toLocaleString()}\n*Total : ${totalText}*\n\nLiens des produits :\n${productLinks}`
      : `Hello! I would like to validate the following order:\n\n${itemsText}\n\nSubtotal: ${settings?.currency || 'FCFA'} ${subtotal.toLocaleString()}\nTransport fees: ${settings?.currency || 'FCFA'} ${shipping.toLocaleString()}\n*Total: ${totalText}*\n\nProduct links:\n${productLinks}`;

    const encodedMessage = encodeURIComponent(message);
    const waNumber = settings?.admin_phone?.replace(/\D/g, '') || settings?.contactPhone?.replace(/\D/g, '') || settings?.loc_phone?.replace(/\D/g, '') || "2250500619923";
    
    // Save order locally for realtime notification bell status & orders history tracking
    const completedOrder = {
      id: newOrderId || 'Pending',
      customer_name: customerName,
      customer_phone: customerPhone,
      address: addressDetails,
      city: 'WhatsApp Checkout',
      total_amount: grandTotal,
      currency: settings?.currency || 'FCFA',
      items: [...cartItems],
      created_at: new Date().toISOString()
    };
    setPlacedOrderData(completedOrder);

    try {
      const storedOrders = JSON.parse(localStorage.getItem('customer_orders') || '[]');
      storedOrders.unshift(completedOrder);
      localStorage.setItem('customer_orders', JSON.stringify(storedOrders));
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (e) {
      console.warn('Failed to save order to local list:', e);
    }

    // Try to trigger push subscription prompt
    try {
      pushManager.subscribe('customer').catch(() => {});
    } catch (e) {}

    showToast(lang === 'fr' ? 'Commande enregistrée ! Redirection vers WhatsApp...' : 'Order recorded! Redirecting to WhatsApp...', 'success');

    // Delay redirection to let notification drop and sound play
    setTimeout(() => {
      clearCart();
      setIsProcessing(false);
      window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, '_blank');
      navigate('/');
    }, 1800);
  };

  const renderWhatsAppCheckout = () => {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#080d19] py-8 sm:py-12 px-4 sm:px-6 md:px-8 overflow-y-auto flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-8 text-center relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-emerald-400 before:via-teal-400 before:to-emerald-500">
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pulse">
              <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {lang === 'fr' ? 'Valider sur WhatsApp' : 'Confirm via WhatsApp'}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold max-w-md mx-auto">
              {lang === 'fr' 
                ? 'Votre commande sera envoyée directement sur notre ligne WhatsApp afin de convenir du mode de livraison ou du retrait en magasin.'
                : 'Your order will be sent directly to our WhatsApp line to coordinate the delivery method or in-store pickup.'}
            </p>
          </div>

          {/* Cart Items List */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-3">
              {lang === 'fr' ? 'Articles dans votre panier' : 'Items in your cart'}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[300px] overflow-y-auto pr-2 space-y-3">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <img 
                    src={item.image_url || item.image || '/hero-banner.png'} 
                    alt={item.name} 
                    className="w-14 h-14 rounded-2xl object-contain bg-white dark:bg-slate-900 p-1 border border-slate-100 dark:border-white/5 shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-505 mt-0.5">
                      {item.quantity} x {settings?.currency || 'FCFA'} {item.price?.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-black text-slate-905 dark:text-white shrink-0">
                    {settings?.currency || 'FCFA'} {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Detailed Price Breakdown */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-2.5 text-xs font-bold font-mono">
              <div className="flex items-center justify-between text-slate-450 dark:text-slate-400">
                <span>{lang === 'fr' ? 'SOUS-TOTAL' : 'SUBTOTAL'}</span>
                <span>{settings?.currency || 'FCFA'} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-450 dark:text-slate-400">
                <span>{lang === 'fr' ? 'FRAIS DE TRANSPORT' : 'TRANSPORT FEES'}</span>
                <span>{settings?.currency || 'FCFA'} {shipping.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-100 dark:border-white/5 pt-2.5 flex items-center justify-between text-base font-black text-slate-900 dark:text-white">
                <span>{lang === 'fr' ? 'TOTAL ESTIMÉ' : 'ESTIMATED TOTAL'}</span>
                <span>{settings?.currency || 'FCFA'} {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleConfirmWhatsAppOrder}
              className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 text-center"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>{lang === 'fr' ? 'Confirmer sur WhatsApp' : 'Confirm Order on WhatsApp'}</span>
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3.5 bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {lang === 'fr' ? 'Retour au panier' : 'Back to Cart'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (settings?.checkout_mode === 'whatsapp') {
    return renderWhatsAppCheckout();
  }

  const labelPaiement = lang === 'fr' ? 'Paiement' : 'Payment';
  const labelRetour = lang === 'fr' ? 'Retour au panier' : 'Back to Cart';
  const labelLivraison = lang === 'fr' ? 'Informations de livraison' : 'Delivery Information';
  const labelNom = lang === 'fr' ? 'Nom complet' : 'Full Name';
  const labelEmail = lang === 'fr' ? 'Adresse e-mail' : 'Email Address';
  const labelTel = lang === 'fr' ? 'Numéro de téléphone' : 'Phone Number';
  const labelTelHelp = lang === 'fr' ? "Nous l'utiliserons pour vous contacter concernant vos commandes" : "We will use this to contact you regarding your orders";
  const labelAdresse = lang === 'fr' ? 'Adresse de livraison' : 'Delivery Address';
  const labelMethode = lang === 'fr' ? 'Méthode de paiement' : 'Payment Method';
  const labelSelectMethode = lang === 'fr' ? 'Sélectionnez une méthode de paiement' : 'Select a payment method';
  const labelTerms = lang === 'fr' ? "J'accepte les conditions d'utilisation et la politique de confidentialité." : "I accept the terms of use and the privacy policy.";
  const labelNotes = lang === 'fr' ? 'Notes de commande (Optionnel)' : 'Order Notes (Optional)';
  const labelNotesPlaceholder = lang === 'fr' ? 'Instructions spéciales pour la livraison...' : 'Special instructions for delivery...';
  const labelPasser = lang === 'fr' ? 'Passer la commande' : 'Place Order';
  const labelSummary = lang === 'fr' ? 'Récapitulatif de la commande' : 'Order Summary';
  const labelSubtotal = lang === 'fr' ? 'Sous-total' : 'Subtotal';
  const labelFrais = lang === 'fr' ? 'Frais de livraison' : 'Delivery Fee';
  const labelTotal = lang === 'fr' ? 'Total' : 'Total';
  const labelWhatsApp = lang === 'fr' ? 'Contacter le vendeur sur WhatsApp' : 'Contact seller on WhatsApp';
  const labelTraitement = lang === 'fr' ? 'Traitement...' : 'Processing...';

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] font-sans antialiased text-slate-800 dark:text-slate-200">
      {/* Header bar */}
      <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800/80 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1f7cf6] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#1f7cf6]/20">
              <CreditCard size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              {labelPaiement}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-355 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            {labelRetour}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Delivery Info Column */}
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1f7cf6]/10 text-[#1f7cf6] flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
                {labelLivraison}
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2 text-left">
                    {labelNom}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1f7cf6]/20 focus:border-[#1f7cf6] outline-none transition-all font-semibold text-slate-800 dark:text-white"
                    placeholder="Odinaka Chibuike"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-555 mb-2 text-left">
                    {labelEmail}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1f7cf6]/20 focus:border-[#1f7cf6] outline-none transition-all font-semibold text-slate-800 dark:text-white"
                    placeholder="codinaka26@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-555 mb-2 text-left">
                    {labelTel}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1f7cf6]/20 focus:border-[#1f7cf6] outline-none transition-all font-semibold text-slate-800 dark:text-white"
                    placeholder="+225500619923"
                  />
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5 leading-normal text-left">
                    {labelTelHelp}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-555 mb-2 text-left">
                    {labelAdresse}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1f7cf6]/20 focus:border-[#1f7cf6] outline-none transition-all font-semibold text-slate-800 dark:text-white"
                    placeholder="ABIDJAN ADJAME MIRADOR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-555 mb-2 text-left">
                    {labelMethode}
                  </label>
                  <div className="relative">
                    <select
                      value={paymentOption || 'select'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1f7cf6]/20 focus:border-[#1f7cf6] outline-none transition-all font-semibold text-slate-800 dark:text-white appearance-none cursor-pointer text-left"
                    >
                      <option value="select" disabled>
                        {labelSelectMethode}
                      </option>
                      {isWaveEnabled && (
                        <option value="wave">Wave Mobile Money</option>
                      )}
                      {isCodEnabled && (
                        <option value="cod">
                          {lang === 'fr' ? 'Paiement à la Livraison' : 'Cash on Delivery (COD)'}
                        </option>
                      )}
                      {isCardEnabled && (
                        <option value="card">
                          {lang === 'fr' ? 'Carte de Crédit' : 'Credit Card'}
                        </option>
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {/* Terms and conditions checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-350 text-[#1f7cf6] focus:ring-[#1f7cf6] mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="terms-checkbox" className="text-xs font-semibold text-slate-600 dark:text-slate-400 select-none cursor-pointer leading-normal text-left">
                    {labelTerms}
                  </label>
                </div>

                {/* Order Notes (Optional) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-555 mb-2 text-left">
                    {labelNotes}
                  </label>
                  <textarea
                    rows={4}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1f7cf6]/20 focus:border-[#1f7cf6] outline-none transition-all font-semibold text-slate-800 dark:text-white placeholder:text-slate-400/80 resize-y text-left"
                    placeholder={labelNotesPlaceholder}
                  />
                </div>

                {/* Order Submission Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-6 py-4 rounded-xl bg-[#1f7cf6] text-white font-bold text-base shadow-lg shadow-[#1f7cf6]/20 hover:bg-[#1361c4] hover:shadow-xl hover:shadow-[#1f7cf6]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {labelTraitement}
                    </>
                  ) : (
                    labelPasser
                  )}
                </button>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-1 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-150 dark:border-slate-800/80 pb-3 mb-4 flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-[#1f7cf6]/10 text-[#1f7cf6] flex items-center justify-center shrink-0">
                  <Package size={15} />
                </div>
                {labelSummary}
              </h2>

              {/* Items List */}
              <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                      <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-slate-850 dark:text-slate-200 text-xs truncate leading-normal">{item.name}</p>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs shrink-0 pl-2">
                      {currencySymbol} {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-slate-150 dark:bg-slate-800/80 my-4" />

              {/* Price calculations */}
              <div className="space-y-3.5 text-xs text-left">
                <div className="flex justify-between text-slate-500 dark:text-slate-455 font-semibold">
                  <span>{labelSubtotal}</span>
                  <span className="text-slate-900 dark:text-white font-bold">{currencySymbol} {subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-slate-500 dark:text-slate-455 font-semibold">
                  <span>{labelFrais}</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {shipping === 0 ? (
                      <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded">
                        {lang === 'fr' ? 'Gratuit' : 'Free'}
                      </span>
                    ) : (
                      `${currencySymbol} ${shipping.toLocaleString()}`
                    )}
                  </span>
                </div>

                <div className="h-px bg-slate-150 dark:bg-slate-800/80 my-4" />
                
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{labelTotal}</span>
                  <span className="text-xl font-black text-[#1f7cf6]">{currencySymbol} {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* WhatsApp Checkout Button */}
              <button
                type="button"
                onClick={handleConfirmWhatsAppOrder}
                className="w-full mt-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {labelWhatsApp}
              </button>
            </div>
          </form>
      </div>
      <OrderNotificationFlow order={placedOrderData} onClose={() => setPlacedOrderData(null)} />
    </div>
  );
};

export default CheckoutPage;
