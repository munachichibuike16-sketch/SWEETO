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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [waMessage, setWaMessage] = useState('');
  const [paymentOption, setPaymentOption] = useState('card'); // 'card' | 'wave' | 'cod'

  useEffect(() => {
    setIsPaymentVerified(false);
  }, [paymentOption]);
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
  const estimatedTax = Math.round(subtotal * 0.08);
  const tax = estimatedTax;
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
                    onClick={() => navigate('/settings?tab=orders')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl py-4 font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Package size={14} />
                    <span>{lang === 'fr' ? 'Voir mes commandes' : 'View Orders'}</span>
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

   return (
    <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#080d19] py-8 sm:py-12 px-4 sm:px-6 md:px-8 overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full mb-8 text-left relative">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-805 dark:hover:text-white shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Checkout & Order Review
        </h1>
        <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">
          Complete your shipping and payment details to finalize your order.
        </p>
      </div>

      {/* Stepper Card */}
      <div className="max-w-7xl mx-auto w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto relative select-none">
          {/* Horizontal Line background */}
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-100 dark:bg-slate-800/80 z-0" />
          {/* Progress Line overlay */}
          <div 
            className="absolute left-6 top-4 h-0.5 bg-indigo-600 transition-all duration-300 z-0" 
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {[1, 2, 3].map((s) => {
            const isActive = step === s;
            const isCompleted = step > s;
            const label = s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review';
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s < step) setStep(s);
                  else if (s === 2 && step === 1 && validateStep(1)) setStep(2);
                  else if (s === 3 && step === 2 && validateStep(2)) setStep(3);
                }}
                className="flex flex-col items-center gap-2 relative z-10 cursor-pointer bg-transparent border-none outline-none"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-110' 
                    : isCompleted 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : s}
                </div>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Wizard Form Card */}
        <form onSubmit={handleCheckout} className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm text-left">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Delivery Method Segment Control */}
                <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 mb-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('home')}
                    className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${
                      deliveryMethod === 'home'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    🚚 Home Delivery
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
                    className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none ${
                      deliveryMethod === 'pickup'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    🏪 Store Pickup
                  </button>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Truck className="text-indigo-600 dark:text-indigo-400" size={18} />
                    <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">
                      {deliveryMethod === 'pickup' ? 'Pickup Details' : 'Shipping Details'}
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
                      if (session) {
                        setFormData({
                          name: session.name || '',
                          phone: session.phoneNumber || session.phone || '',
                          city: session.city || 'Abidjan',
                          address: session.address || '',
                          street: session.street || '',
                          junction: session.junction || '',
                          landmark: session.landmark || ''
                        });
                        showToast("Profile auto-filled! ⚡", "success");
                      } else {
                        showToast("Please login to auto-fill.", "info");
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    <Zap size={12} className="fill-current" /> Autofill Profile
                  </button>
                </div>

                {/* First & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">First Name *</label>
                    <input 
                      required 
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Last Name *</label>
                    <input 
                      required 
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Email Address *</label>
                  <input 
                    required 
                    type="email"
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                {deliveryMethod === 'pickup' ? (
                  /* Store Pickup Fields */
                  <div className="space-y-4 p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Pickup Location *</label>
                      <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 cursor-pointer text-slate-900 dark:text-white"
                      >
                        <option value="cocody">Cocody Depot (Carrefour Saint Jean, face pharmacie)</option>
                        <option value="yopougon">Yopougon Retail Point (Face Cosmos Yopougon)</option>
                        <option value="marcory">Marcory Warehouse (Zone 4, Rue du Canal)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Pickup Date *</label>
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Pickup Time *</label>
                        <select
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 cursor-pointer text-slate-900 dark:text-white"
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
                ) : (
                  /* Home Delivery Fields */
                  <>
                    {/* Street Address */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Street Address *</label>
                      <input 
                        required 
                        placeholder="123 Innovation Way, Suite 400"
                        value={formData.street}
                        onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value, address: e.target.value }))}
                        className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* City & ZIP Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">City *</label>
                        <select
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer text-slate-900 dark:text-white"
                        >
                          {Object.keys(cityAreas).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Postal / ZIP Code *</label>
                        <input 
                          required 
                          placeholder="94103"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">Contact Phone Number *</label>
                  <input 
                    required 
                    type="tel"
                    placeholder="07 XX XX XX XX"
                    value={formData.phone}
                    className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                {/* Continue to Payment button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!firstName.trim() || !lastName.trim()) {
                      showToast(lang === 'fr' ? "Veuillez entrer vos nom et prénom." : "Please enter your first and last name.", "error");
                      return;
                    }
                    if (!email.trim() || !formData.phone.trim()) {
                      showToast(lang === 'fr' ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.", "error");
                      return;
                    }
                    if (deliveryMethod === 'home' && !formData.street.trim()) {
                      showToast(lang === 'fr' ? "Veuillez entrer votre adresse de livraison." : "Please enter your street address.", "error");
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4.5 rounded-2xl font-extrabold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Title & Edit Shipping Link */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Lock className="text-indigo-650 dark:text-indigo-400" size={18} />
                    <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">
                      Payment Information
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Edit Shipping
                  </button>
                </div>

                {/* Payment Option Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('card')}
                    className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentOption === 'card'
                        ? 'border-indigo-650 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Card</span>
                  </button>

                  {/* Wave */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('wave')}
                    className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentOption === 'wave'
                        ? 'border-indigo-650 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Zap size={18} className={paymentOption === 'wave' ? 'text-indigo-600 fill-current' : ''} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Wave</span>
                  </button>

                  {/* Pay on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('cod')}
                    className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentOption === 'cod'
                        ? 'border-indigo-650 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Truck size={18} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">On Delivery</span>
                  </button>
                </div>

                {/* Sub Forms based on Payment Option */}
                {paymentOption === 'card' && (
                  <div className="space-y-4">
                    {/* Cardholder Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block ml-1 text-left">Cardholder Name</label>
                      <input 
                        placeholder="Jane Doe"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block ml-1 text-left">Card Number</label>
                      <div className="relative">
                        <input 
                          placeholder="4532 •••• •••• 8892"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            setCardNumber(formatted);
                          }}
                          className="w-full bg-slate-50/50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-10 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                        />
                        <CreditCard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Expiry Date & CVC */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block ml-1 text-left">Expiry Date</label>
                        <input 
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setCardExpiry(value);
                          }}
                          className="w-full bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block ml-1 text-left">CVC / CVV</label>
                        <input 
                          placeholder="3 digits"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentOption === 'wave' && (
                  <div className="space-y-4 p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-805 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="text-indigo-600 dark:text-indigo-400 shrink-0 fill-current" size={20} />
                      <h4 className="text-xs font-black uppercase text-slate-850 dark:text-white">Pay via Wave Mobile</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-bold">
                      Enter your Wave telephone number below. A payment authorization push will be sent to your phone.
                    </p>
                    <div className="space-y-2 pt-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Wave Phone Number</label>
                      <input 
                        type="tel"
                        placeholder="07 XX XX XX XX"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {paymentOption === 'cod' && (
                  <div className="p-5 rounded-2xl border bg-emerald-500/5 border-emerald-500/35 flex items-center justify-between gap-4 select-none text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500 text-white">
                        <Truck size={18} />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          Pay on Delivery (COD)
                        </h5>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal mt-0.5">
                          Pay with cash or Mobile Money when your package arrives. No pre-payment is required!
                        </p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                )}

                {/* Verification/Confirm and Back Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs cursor-pointer border-none shadow-sm transition-all"
                  >
                    Back
                  </button>

                  {paymentOption !== 'cod' && !isPaymentVerified ? (
                    <button
                      type="button"
                      disabled={verifyingPayment}
                      onClick={() => {
                        if (paymentOption === 'card') {
                          if (!cardholderName.trim()) {
                            showToast("Please enter cardholder name.", "error");
                            return;
                          }
                          if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 12) {
                            showToast("Please enter a valid card number.", "error");
                            return;
                          }
                          if (!cardExpiry.trim()) {
                            showToast("Please enter card expiry date.", "error");
                            return;
                          }
                          if (!cardCvv.trim() || cardCvv.length < 3) {
                            showToast("Please enter card CVC/CVV.", "error");
                            return;
                          }
                        }
                        
                        setVerifyingPayment(true);
                        setTimeout(() => {
                          setVerifyingPayment(false);
                          setIsPaymentVerified(true);
                          showToast(paymentOption === 'card' ? "Card pre-authorized successfully! 💳" : "Wave payment received! ⚡", "success");
                        }, 1800);
                      }}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs shadow-md cursor-pointer border-none transition-all flex items-center justify-center gap-2"
                    >
                      {verifyingPayment ? <Loader2 size={14} className="animate-spin" /> : <Lock size={12} />}
                      <span>{verifyingPayment ? "Processing..." : "Complete Payment"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(2)) setStep(3);
                      }}
                      className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs shadow-md cursor-pointer border-none transition-all flex items-center justify-center gap-2"
                    >
                      <span>Review Order Details</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                {/* Title */}
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CheckCircle2 className="text-indigo-650 dark:text-indigo-400" size={18} />
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">
                    Final Order Confirmation
                  </h3>
                </div>

                {/* Shipping Review Card */}
                <div className="p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {deliveryMethod === 'pickup' ? 'PICKUP DETAILS' : 'SHIPPING ADDRESS'}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                    {firstName} {lastName} • {formData.phone}<br/>
                    {deliveryMethod === 'pickup' 
                      ? `Store Pickup at Cocody Depot (${pickupDate} at ${pickupTime})` 
                      : `${formData.street}, ${formData.city}, ${zip}`
                    }
                  </p>
                </div>

                {/* Payment Review Card */}
                <div className="p-5 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      PAYMENT METHOD
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {paymentOption === 'card' ? (
                      <>
                        <CreditCard size={14} className="text-indigo-600" />
                        <span>Credit Card Ending in <span className="font-extrabold">{cardNumber.slice(-4) || '2222'}</span></span>
                      </>
                    ) : paymentOption === 'wave' ? (
                      <>
                        <Zap size={14} className="text-indigo-650 fill-current" />
                        <span>Wave Mobile Payment (Confirmed)</span>
                      </>
                    ) : (
                      <>
                        <Truck size={14} className="text-emerald-500" />
                        <span>Pay on Delivery (COD)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-800 rounded-2xl text-left">
                  <input 
                    type="checkbox" 
                    id="terms-checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4.5 h-4.5 rounded border-slate-300 text-indigo-650 cursor-pointer accent-indigo-600"
                  />
                  <label htmlFor="terms-checkbox" className="text-[11px] font-bold text-slate-450 dark:text-slate-400 leading-normal cursor-pointer select-none">
                    I accept the terms, conditions, and return policy of Sweeto Hub.
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs cursor-pointer border-none shadow-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !acceptedTerms}
                    className="flex-[2] bg-[#0f766e] hover:bg-[#0d6861] text-white py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs shadow-md cursor-pointer border-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={12} />}
                    <span>Place Order & Pay Now 🔒</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Right Column - Order Summary Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm text-left lg:sticky lg:top-8">
          <h2 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider mb-6">
            Order Summary
          </h2>

          {/* Items List */}
          <div className="divide-y divide-slate-105 dark:divide-slate-800 max-h-[280px] overflow-y-auto pr-2 scrollbar-none space-y-3.5 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-450 shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs shrink-0">
                  {currencySymbol} {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Promo Input Row */}
          <div className="flex gap-2.5 mb-6">
            <input 
              value={promoInput} 
              onChange={(e) => setPromoInput(e.target.value)} 
              placeholder="PROMO CODE (E.G. NEXUS20)" 
              disabled={promoApplied}
              className="flex-1 bg-slate-50/50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold uppercase placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white" 
            />
            <button 
              type="button"
              onClick={applyPromo}
              disabled={!promoInput || promoApplied}
              className="px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer border-none shrink-0"
            >
              Apply
            </button>
          </div>
          {promoError && <p className="text-red-500 text-[9px] font-bold mt-[-16px] mb-4 ml-1 uppercase">{promoError}</p>}

          {/* Pricing Breakdown */}
          <div className="space-y-3.5 mb-6 text-xs font-semibold">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900 dark:text-white">{currencySymbol} {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-emerald-505 font-bold" : "font-bold text-slate-900 dark:text-white"}>
                {shipping === 0 ? 'FREE' : `${currencySymbol} ${shipping.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Estimated Tax (8%)</span>
              <span className="font-bold text-slate-900 dark:text-white">{currencySymbol} {estimatedTax.toLocaleString()}</span>
            </div>
            {promoApplied && (
              <div className="flex justify-between items-center text-indigo-650 dark:text-indigo-400">
                <span>Discount</span>
                <span className="font-bold">-{currencySymbol} {promoDiscount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total Due */}
          <div className="border-t border-slate-100 dark:border-slate-805 pt-4.5 mb-6 flex justify-between items-center select-none">
            <span className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Total Due</span>
            <span className="font-black text-xl text-indigo-650 dark:text-indigo-400 tracking-tight">
              {currencySymbol} {grandTotal.toLocaleString()}
            </span>
          </div>

          {/* SSL Checkout Guarantee Badges */}
          <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3 select-none">
            <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 text-left leading-normal">
              256-Bit Encrypted SSL Checkout with 30-day Money Back Guarantee
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
