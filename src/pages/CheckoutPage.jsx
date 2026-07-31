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
    name: '', phone: '', city: 'Abidjan', address: '', street: '', junction: '', landmark: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [orderedItems, setOrderedItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
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
      if (!firstName.trim() || !lastName.trim()) {
        showToast(lang === 'fr' ? "Veuillez entrer vos nom et prénom." : "Please enter your first and last name.", "error");
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
      if (deliveryMethod === 'home') {
        if (!formData.street.trim()) {
          showToast(lang === 'fr' ? "Veuillez entrer votre adresse de livraison." : "Please enter your street address.", "error");
          return false;
        }
        if (!formData.city.trim()) {
          showToast(lang === 'fr' ? "Veuillez choisir une ville." : "Please select a city.", "error");
          return false;
        }
      } else if (deliveryMethod === 'pickup') {
        if (!pickupDate) {
          showToast(lang === 'fr' ? "Veuillez sélectionner une date de retrait." : "Please select a pickup date.", "error");
          return false;
        }
      }
      return true;
    }
    if (currentStep === 2) {
      if (!paymentOption) {
        showToast(lang === 'fr' ? "Veuillez sélectionner un moyen de paiement." : "Please select a payment method.", "error");
        return false;
      }
      if (paymentOption === 'card') {
        if (!cardholderName.trim()) {
          showToast(lang === 'fr' ? "Nom sur la carte requis." : "Please enter cardholder name.", "error");
          return false;
        }
        if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 12) {
          showToast(lang === 'fr' ? "Numéro de carte invalide." : "Please enter a valid card number.", "error");
          return false;
        }
        if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
          showToast(lang === 'fr' ? "Date d'expiration requise." : "Please enter card expiry date.", "error");
          return false;
        }
        if (!cardCvv.trim() || cardCvv.length < 3) {
          showToast(lang === 'fr' ? "CVC/CVV requis." : "Please enter card CVC/CVV.", "error");
          return false;
        }
        if (!isPaymentVerified) {
          showToast(lang === 'fr' ? "Veuillez autoriser le paiement par carte." : "Please authorize the card payment first.", "error");
          return false;
        }
      } else if (paymentOption === 'wave') {
        if (!isPaymentVerified) {
          showToast(lang === 'fr' ? "Veuillez confirmer le paiement Wave." : "Please confirm your Wave payment first.", "error");
          return false;
        }
      }
      return true;
    }
    return true;
  };

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
        items: JSON.stringify(cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }))),
        total_amount: grandTotal,
        total: grandTotal,
        total_items: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        status: 'pending',
        promo_code: promoApplied ? promoInput.toUpperCase() : null,
        city: deliveryMethod === 'pickup' ? `Retrait (${pickupLocation})` : formData.city,
        address: fullAddress,
        destination_lat: destLat,
        destination_lng: destLng,
        user_id: session?.id || session?.phone || ''
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
    const currency = settings?.currency || 'FCFA';

    const handleCopyOrderId = () => {
      if (orderId) {
        navigator.clipboard.writeText(`SWT-${orderId}`);
        showToast(lang === 'fr' ? 'ID Commande copié !' : 'Order ID copied!', 'success');
      }
    };

    const handleMockValidatePayment = () => {
      setIsCheckingPayment(true);
      setTimeout(() => {
        setIsCheckingPayment(false);
        setPaymentConfirmed(true);
        showToast(lang === 'fr' ? 'Paiement validé avec succès !' : 'Payment successfully validated!', 'success');
      }, 2000);
    };

    // Construct recommended products for success screen
    const moreToLoveProducts = products
      ? [...products]
          .filter(p => p.status === 'active' && p.stock > 0)
          .sort(() => 0.5 - Math.random())
          .slice(0, 4)
      : [];

    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center p-4 md:p-8 overflow-y-auto font-sans relative text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08),transparent_70%)]"></div>
        
        {/* Glassmorphic Fullscreen Blocker for Payment Validation */}
        <AnimatePresence>
          {isCheckingPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden"
              >
                {/* Padlock / Security Animation */}
                <div className="relative flex items-center justify-center w-20 h-20 bg-blue-500/10 border border-blue-500/20 text-[#0052FF] rounded-full">
                  <ShieldCheck size={40} className="relative z-10 animate-pulse" />
                  <div className="absolute inset-0 bg-[#0052FF]/5 rounded-full blur-[15px] animate-ping" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight text-white uppercase">
                    {lang === 'fr' ? 'Validation Sécurisée' : 'Secure Validation'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    {lang === 'fr' 
                      ? 'Vérification de la transaction Mobile Money. Veuillez ne pas fermer cette fenêtre.'
                      : 'Verifying Mobile Money transaction. Please do not close or refresh this window.'}
                  </p>
                </div>

                {/* Progress dot stream */}
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Top Header Row */}
        <div className="w-full max-w-6xl relative z-10 flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-[#7c3aed] rounded-full inline-block"></span>
            {lang === 'fr' ? 'Confirmation' : 'Confirmation'}
          </h1>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{lang === 'fr' ? 'Boutique' : 'Back to Store'}</span>
          </button>
        </div>

        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 mb-12">
          
          {/* LEFT COLUMN: Receipt, Details & Action Buttons */}
          <div className="lg:col-span-7 bg-[#0b101c]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Success Badge & Heading */}
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30 flex-shrink-0"
                >
                  <CheckCircle2 size={32} />
                </motion.div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                    {lang === 'fr' ? 'Enregistrée' : 'Order Placed'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                    {lang === 'fr' ? 'Merci pour votre commande ! 🎉' : 'Thank you for your order! 🎉'}
                  </h2>
                </div>
              </div>

              {/* Order ID Box */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ID Commande / Order ID</p>
                  <p className="text-base sm:text-lg font-black text-white mt-0.5">SWT-{orderId}</p>
                </div>
                <button 
                  onClick={handleCopyOrderId}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer border-none flex items-center justify-center"
                  title="Copier l'ID"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>

              {/* Recipient Details & Shipping Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white/2 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">{lang === 'fr' ? 'Destinataire' : 'Recipient'}</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <User size={14} className="text-slate-400" />
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Phone size={12} className="text-slate-500" />
                    <span>{formData.phone}</span>
                  </div>
                </div>

                <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">{lang === 'fr' ? 'Adresse de livraison' : 'Delivery Address'}</span>
                  <div className="flex items-start gap-2 text-sm font-bold text-slate-200">
                    <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {deliveryMethod === 'pickup' ? `Point de retrait (${pickupLocation.toUpperCase()})` : `${formData.city}, ${formData.address}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Actions at bottom */}
              <div className="border-t border-white/5 pt-6 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(124,58,237,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    <Home size={14} />
                    <span>{lang === 'fr' ? 'Continuer mes achats' : 'Continue Shopping'}</span>
                  </button>

                  <button 
                    onClick={() => navigate(orderId ? `/order-tracking/${orderId}` : '/order-tracking')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Compass size={14} />
                    <span>{lang === 'fr' ? 'Suivre ma commande' : 'Track Order'}</span>
                  </button>
                </div>

                <button 
                  onClick={() => window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${waMessage}`, '_blank')}
                  className="w-full bg-[#25D366] hover:bg-[#1fbe57] text-white font-black py-4.5 rounded-2xl uppercase tracking-widest text-xs shadow-[0_10px_25px_rgba(37,211,102,0.2)] flex items-center justify-center gap-2 cursor-pointer border-none hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.116-2.887-6.98C15.782 1.896 13.313.864 10.68.864 5.244.864.827 5.285.823 10.724c0 1.687.445 3.328 1.29 4.767l-.992 3.62 3.71-.973zm11.365-6.86c-.302-.15-1.786-.882-2.057-.98-.27-.1-.468-.15-.665.15-.198.3-.765.98-.937 1.18-.173.2-.347.225-.65.075-.302-.15-1.276-.47-2.43-1.498-.897-.8-1.503-1.787-1.68-2.087-.177-.3-.02-.46.13-.61.137-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.24-.575-.48-.5-.665-.51-.173-.007-.37-.01-.568-.01-.198 0-.52.074-.79.37-.27.3-1.035 1.01-1.035 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.085 3.18 5.05 4.464.707.306 1.258.489 1.69.626.71.226 1.356.194 1.866.118.57-.085 1.786-.73 2.037-1.435.25-.705.25-1.31.175-1.435-.075-.125-.27-.2-.57-.35z"/>
                  </svg>
                  <span>{lang === 'fr' ? 'Nous contacter sur WhatsApp' : 'Contact Support on WhatsApp'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          <div className="lg:col-span-5 bg-[#0b101c]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Package size={18} className="text-[#7c3aed]" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                  {lang === 'fr' ? 'Résumé de la commande' : 'Order Summary'}
                </h3>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1.5 custom-scrollbar mb-6">
                {orderedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 bg-white/2 p-3 rounded-2xl border border-white/5 transition-all hover:bg-white/4">
                    <img 
                      src={item.image_url || item.image || '/hero-banner.png'} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-white/5 flex-shrink-0"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/hero-banner.png'; }}
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-white">
                        {Number(item.price * item.quantity).toLocaleString()} {currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown rows */}
              <div className="border-t border-white/5 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-400 font-semibold">
                  <span>{lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                  <span>{Number(orderSubtotal).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-semibold">
                  <span>{lang === 'fr' ? 'Frais de livraison' : 'Delivery Fee'}</span>
                  <span className="text-emerald-400 font-black uppercase tracking-wider">
                    {orderShipping === 0 ? (lang === 'fr' ? 'Gratuit' : 'Free') : `${Number(orderShipping).toLocaleString()} ${currency}`}
                  </span>
                </div>
                <div className="flex justify-between text-white font-extrabold border-t border-white/5 pt-3 mt-3">
                  <span>Total</span>
                  <span className="text-xl font-black text-[#8b5cf6]">
                    {Number(orderTotal).toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Wave payment validation integration if selected */}
            {paymentOption === 'direct' && !paymentConfirmed && (
              <div className="mt-6 border-t border-white/5 pt-6 text-center space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#19C3FC] bg-[#19C3FC]/10 px-4 py-1.5 rounded-full border border-[#19C3FC]/20 inline-block">
                  Wave Pay Link
                </span>
                
                {isMobileDevice ? (
                  <button
                    onClick={() => { if (waveLaunchUrl) window.location.href = waveLaunchUrl; }}
                    className="w-full bg-[#19C3FC] text-slate-950 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(25,195,252,0.2)] cursor-pointer border-none"
                  >
                    <Lock size={12} />
                    Lancer Wave App
                  </button>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3.5 rounded-2xl shadow-xl mb-3 border border-slate-100 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waveLaunchUrl || 'https://pay.wave.com')}`} 
                        alt="Scan QR" 
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">
                      Scannez avec votre téléphone
                    </span>
                  </div>
                )}

                <button
                  onClick={handleMockValidatePayment}
                  disabled={isCheckingPayment}
                  className="w-full bg-[#0052FF] hover:bg-[#0043D0] text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 cursor-pointer border-none transition-all"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Validation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={12} />
                      <span>Valider paiement</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM SECTION: Recommended More to Love products */}
        {moreToLoveProducts.length > 0 && (
          <div className="max-w-6xl w-full relative z-10 border-t border-white/5 pt-8 mt-4 select-none">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-1.5 h-4 bg-[#8b5cf6] rounded-full inline-block"></span>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">
                {lang === 'fr' ? 'Plus à aimer' : 'More to Love'}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {moreToLoveProducts.map((p, idx) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  index={idx}
                  onProductClick={(prod) => {
                    navigate(`/product/${prod.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  const renderWhatsAppCheckout = () => {
    const handleConfirmWhatsAppOrder = () => {
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
      
      // Clear cart
      clearCart();
      
      // Redirect to home
      navigate('/');
      showToast(lang === 'fr' ? 'Redirection vers WhatsApp...' : 'Redirecting to WhatsApp...', 'success');
      
      window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, '_blank');
    };

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <button onClick={() => navigate('/cart')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-3 flex items-center gap-1 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {lang === 'fr' ? 'Retour au panier' : 'Back to Cart'}
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{lang === 'fr' ? 'Caisse' : 'Checkout'}</h1>
        </div>
      </div>

      {isSuccess ? (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30"
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
          >
            {lang === 'fr' ? 'Commande Confirmée !' : 'Order Confirmed!'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 mb-10 max-w-lg mx-auto"
          >
            {lang === 'fr' 
              ? 'Merci pour votre commande. Nous avons envoyé un email de confirmation.' 
              : 'Thank you for your order. We have sent a confirmation email.'}
            <br/><br/>
            <span className="font-semibold text-slate-800 bg-slate-100 px-4 py-2 rounded-lg inline-block mt-2">
              ID: {orderId}
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 max-w-md mx-auto text-left"
          >
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <p className="text-slate-500">{lang === 'fr' ? 'Montant Payé' : 'Amount Paid'}</p>
                <p className="text-lg font-bold text-slate-900">{currencySymbol} {(cartTotal + shipping).toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <p className="text-slate-500">{lang === 'fr' ? 'Méthode' : 'Method'}</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">{paymentOption}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => navigate('/order-tracking/' + orderId)}
                className="w-full py-3 rounded-xl border border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 transition cursor-pointer"
              >
                {lang === 'fr' ? 'Suivre la commande' : 'Track Order'}
              </button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/')}
            className="mt-10 px-8 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 cursor-pointer"
          >
            {lang === 'fr' ? 'Retour à l\'accueil' : 'Return Home'}
          </motion.button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center mb-10">
            {[1, 2, 3].map((num, idx) => (
              <React.Fragment key={num}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    step >= num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step > num ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : num}
                  </div>
                  <span className={`font-medium ${step >= num ? 'text-slate-900' : 'text-slate-400'}`}>
                    {num === 1 ? (lang === 'fr' ? 'Livraison' : 'Shipping') : 
                     num === 2 ? (lang === 'fr' ? 'Paiement' : 'Payment') : 
                     (lang === 'fr' ? 'Vérification' : 'Review')}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`w-12 h-1 rounded-full mx-2 ${step > num ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 w-full max-w-3xl">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      {lang === 'fr' ? 'Détails de Livraison' : 'Shipping Details'}
                    </h2>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Nom Complet' : 'Full Name'}</label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                          placeholder={lang === 'fr' ? 'Jean Dupont' : 'John Doe'}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Email' : 'Email Address'}</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                            placeholder="jean@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Téléphone' : 'Phone Number'}</label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                            placeholder="+225 00 00 00 00 00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Adresse complète' : 'Full Address'}</label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                          placeholder={lang === 'fr' ? 'Numéro de rue, Bâtiment, etc.' : 'Street number, Building, etc.'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Code postal' : 'Zip Code'}</label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none"
                          placeholder="00225"
                        />
                      </div>
                      <div className={`grid gap-4 mb-6 ${cityAreas[formData.city] ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Ville' : 'City'}</label>
                          <select
                            required
                            value={formData.city}
                            onChange={(e) => {
                              const newCity = e.target.value;
                              setFormData({
                                ...formData, 
                                city: newCity,
                                area: '' // Reset area when city changes
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none bg-white"
                          >
                            <option value="">{lang === 'fr' ? 'Sélectionner une ville...' : 'Select a city...'}</option>
                            {Object.keys(cityAreas).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        {cityAreas[formData.city] && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{lang === 'fr' ? 'Commune/Quartier' : 'Area/Neighborhood'}</label>
                            <select
                              required
                              value={formData.area}
                              onChange={(e) => setFormData({...formData, area: e.target.value})}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none bg-white"
                            >
                              <option value="">Select...</option>
                              {cityAreas[formData.city].map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(1)) setStep(2);
                        }}
                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                      >
                        {lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to Payment'}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      {lang === 'fr' ? 'Méthode de Paiement' : 'Payment Method'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      {isCardEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentOption('card')}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${paymentOption === 'card' ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${paymentOption === 'card' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                              <CreditCard size={20} />
                            </div>
                            <div>
                              <p className={`font-semibold ${paymentOption === 'card' ? 'text-indigo-900' : 'text-slate-700'}`}>Card</p>
                              <div className="flex gap-1 mt-2">
                                <div className="w-6 h-4 bg-[#ff5f00] rounded-sm"></div>
                                <div className="w-6 h-4 bg-[#eb001b] rounded-sm"></div>
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {isWaveEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentOption('wave')}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${paymentOption === 'wave' ? 'border-[#00a9ff] bg-[#00a9ff]/5 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${paymentOption === 'wave' ? 'bg-[#00a9ff]/20 text-[#00a9ff]' : 'bg-slate-100 text-slate-500'}`}>
                              <Zap size={20} />
                            </div>
                            <div>
                              <p className={`font-semibold ${paymentOption === 'wave' ? 'text-[#00a9ff]' : 'text-slate-700'}`}>Wave</p>
                              <p className="text-xs text-slate-500 mt-1">Mobile Money</p>
                            </div>
                          </div>
                        </button>
                      )}

                      {isCodEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentOption('cod');
                            setIsPaymentVerified(true);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${paymentOption === 'cod' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${paymentOption === 'cod' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              <Package size={20} />
                            </div>
                            <div>
                              <p className={`font-semibold ${paymentOption === 'cod' ? 'text-emerald-900' : 'text-slate-700'}`}>Cash on Delivery</p>
                              <p className="text-xs text-slate-500 mt-1">Pay when you receive</p>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentOption === 'card' && (
                        <motion.div
                          key="card"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-5 p-5 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
                              <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-mono" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Name on Card</label>
                              <input type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                                <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-mono" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
                                <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-mono" />
                              </div>
                            </div>
                            
                            {!isPaymentVerified && (
                              <button
                                type="button"
                                onClick={verifyPayment}
                                disabled={isCheckingPayment}
                                className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 mt-4 hover:bg-slate-800 transition disabled:opacity-50"
                              >
                                {isCheckingPayment ? <Loader2 className="animate-spin w-5 h-5" /> : (lang === 'fr' ? 'Vérifier la carte' : 'Verify Card')}
                              </button>
                            )}
                            {isPaymentVerified && (
                              <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold flex items-center justify-center gap-2 mt-4 border border-emerald-200">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>{lang === 'fr' ? 'Carte Vérifiée' : 'Card Verified'}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                      
                      {paymentOption === 'wave' && (
                        <motion.div
                          key="wave"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col items-center justify-center p-8 bg-[#00a9ff]/5 rounded-xl border border-[#00a9ff]/20 mb-6">
                            {!isPaymentVerified ? (
                              <button
                                type="button"
                                onClick={verifyPayment}
                                disabled={isCheckingPayment}
                                className="px-8 py-4 rounded-xl bg-[#00a9ff] text-white font-bold text-lg flex items-center gap-3 hover:bg-[#0090d9] transition shadow-lg shadow-[#00a9ff]/30 disabled:opacity-50"
                              >
                                {isCheckingPayment ? <Loader2 className="animate-spin w-6 h-6" /> : 'Pay with Wave'}
                              </button>
                            ) : (
                              <div className="flex flex-col items-center text-[#00a9ff]">
                                <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                                <span className="text-xl font-bold text-emerald-600">{lang === 'fr' ? 'Paiement Wave Réussi' : 'Wave Payment Successful'}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                      >
                        {lang === 'fr' ? 'Retour' : 'Back'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(2)) setStep(3);
                        }}
                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
                      >
                        {lang === 'fr' ? 'Vérifier la commande' : 'Review Order'}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      {lang === 'fr' ? 'Vérification Finale' : 'Final Review'}
                    </h2>
                    
                    <div className="space-y-6 mb-8">
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            <MapPin size={18} className="text-slate-400" />
                            {lang === 'fr' ? 'Expédié à' : 'Shipping To'}
                          </p>
                          <button onClick={() => setStep(1)} className="text-indigo-600 text-sm font-semibold hover:underline">Edit</button>
                        </div>
                        <p className="text-slate-700 font-medium">{formData.fullName}</p>
                        <p className="text-slate-500 mt-1">{formData.address}</p>
                        <p className="text-slate-500">{formData.area ? `${formData.area}, ` : ''}{formData.city} {formData.zipCode}</p>
                        <p className="text-slate-500 mt-2">{formData.phone}</p>
                      </div>
                      
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard size={18} className="text-slate-400" />
                            {lang === 'fr' ? 'Paiement' : 'Payment'}
                          </p>
                          <button onClick={() => setStep(2)} className="text-indigo-600 text-sm font-semibold hover:underline">Edit</button>
                        </div>
                        <p className="text-slate-700 font-medium capitalize flex items-center gap-2">
                          {paymentOption === 'card' && <CreditCard size={16} className="text-indigo-600" />}
                          {paymentOption === 'wave' && <Zap size={16} className="text-[#00a9ff]" />}
                          {paymentOption === 'cod' && <Package size={16} className="text-emerald-600" />}
                          {paymentOption === 'cod' ? 'Cash on Delivery' : paymentOption}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                      >
                        {lang === 'fr' ? 'Retour' : 'Back'}
                      </button>
                      <button
                        onClick={submitOrder}
                        disabled={isProcessing}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      >
                        {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                        {paymentOption === 'cod' ? 'Place Order' : 'Pay ' + currencySymbol + ' ' + (cartTotal + shipping).toLocaleString()}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full lg:w-[400px]">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 sticky top-24">
                <h3 className="font-bold text-slate-900 mb-6 text-lg">{lang === 'fr' ? 'Résumé de la commande' : 'Order Summary'}</h3>
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200/60 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                        <p className="text-indigo-600 font-bold text-sm mt-1">{currencySymbol} {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px w-full bg-slate-100 my-6" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                    <span className="font-semibold text-slate-900">{currencySymbol} {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{lang === 'fr' ? 'Livraison' : 'Shipping'}</span>
                    <span className="font-semibold text-slate-900">
                      {shipping === 0 ? <span className="text-emerald-500 uppercase text-xs font-bold tracking-wider px-2 py-1 bg-emerald-50 rounded-md">Free</span> : `${currencySymbol} ${shipping.toLocaleString()}`}
                    </span>
                  </div>
                  
                  <div className="h-px w-full bg-slate-100 my-4" />
                  <div className="flex justify-between text-base pb-2">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-black text-indigo-600 text-xl">{currencySymbol} {(cartTotal + shipping).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;
