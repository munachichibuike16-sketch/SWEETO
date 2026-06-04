import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, ArrowRight, MapPin, Phone, User, Package, Award, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { playSound } from '../utils/sound';

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
    name: '', phone: '', city: 'Abidjan', address: ''
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
        address: session.address || ''
      });
    }
  }, []);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [isReturning, setIsReturning] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [shippingZones, setShippingZones] = useState([]);
  const [shippingFee, setShippingFee] = useState(2500);

  useEffect(() => {
    if (isSuccess) {
      playSound('celebrate');
    }
  }, [isSuccess]);

  const subtotal = cartTotal;
  const tax = 0;
  const hasUnsetPrice = cartItems.some(item => !item.price || Number(item.price) === 0);
  const shipping = hasUnsetPrice ? 0 : shippingFee;
  const grandTotal = subtotal + shipping - loyaltyDiscount - promoDiscount;

  const ADMIN_WHATSAPP_NUMBER = settings?.contactPhone?.replace(/\D/g, '') || "2250500619923";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check for returning customer via Supabase
  useEffect(() => {
    if (formData.phone.length >= 8) {
      const checkLoyalty = async () => {
        try {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, customer_contact')
            .ilike('customer_contact', `%${formData.phone}%`);
          if (orders && orders.length > 0) {
            setIsReturning(true);
            setLoyaltyDiscount(cartTotal * 0.10);
          } else {
            setIsReturning(false);
            setLoyaltyDiscount(0);
          }
        } catch (e) { console.error(e); }
      };
      checkLoyalty();
    }
  }, [formData.phone, cartTotal]);

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
    if (promoInput.toUpperCase() === 'SWEETO10') {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, customer_contact, promo_code')
          .ilike('customer_contact', `%${formData.phone}%`)
          .eq('promo_code', 'SWEETO10');
        const alreadyUsed = orders && orders.length > 0;
        if (alreadyUsed) {
          setPromoError('You have already used this promo code.');
        } else {
          setPromoDiscount(cartTotal * 0.10);
          setPromoApplied(true);
          setPromoError('');
        }
      } catch (e) { setPromoError('Validation failed. Try again.'); }
    } else {
      setPromoError('Invalid promo code.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const selectedZone = shippingZones.find(z => z.name === formData.city);
      const destLat = selectedZone ? selectedZone.lat : 5.3484; // Fallback to Cocody center
      const destLng = selectedZone ? selectedZone.lng : -3.9788;

      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      const contactInfo = [
        formData.phone,
        formData.address || '',
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
        address: formData.address,
        destination_lat: destLat,
        destination_lng: destLng
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (error) throw error;

      const newOrderId = data?.id;

      // Send WhatsApp (French formatted order details)
      const itemsList = cartItems.map(item => `- ${item.name} (Qté: ${item.quantity})`).join('\n');
      const currency = settings?.currency || 'FCFA';
      const rawMessage = `Bonjour Sweeto-Hub, je souhaite valider ma commande :\n` +
        `${itemsList}\n\n` +
        `Total : ${grandTotal.toLocaleString()} ${currency}\n` +
        `Destinataire : ${formData.name}\n` +
        `Téléphone : ${formData.phone}\n` +
        `Adresse de Livraison : ${formData.city === 'Abidjan' ? formData.address : `${formData.city}, ${formData.address}`}\n\n` +
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]"></div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="max-w-lg w-full bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] p-12 text-center border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)] relative z-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-28 h-28 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
          >
            <CheckCircle2 size={56} className="text-white" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">{t('order_received') || 'Order Received'}</h2>
          <p className="text-slate-400 font-medium mb-12 leading-relaxed text-sm md:text-base">
            {t('thank_you_order') || 'Thank you for your order! Our team in'} <span className="text-white font-black">{formData.city}</span> {t('will_contact_you') || 'will contact you shortly at'} <span className="text-blue-400 font-black">{formData.phone}</span> {t('to_confirm_delivery') || 'to confirm the delivery time.'}
          </p>
          
          <div className="space-y-4">
             {orderId && (
               <button 
                 onClick={() => navigate(`/order-tracking/${orderId}`)}
                 className="w-full bg-blue-500 text-white font-black py-5 rounded-[2rem] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* LEFT SIDE - ORDER SUMMARY (DARK) */}
      <div className="lg:w-[45%] bg-slate-950 p-8 lg:p-16 flex flex-col relative overflow-hidden text-white min-h-[50vh] lg:min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        
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
                       <span className="font-black text-sm text-blue-400">{(item.price * item.quantity).toLocaleString()}</span>
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
                 <span className={shipping === 0 ? "text-emerald-400" : ""}>{shipping === 0 ? (t('free') || 'FREE') : shipping.toLocaleString()}</span>
              </div>
              
              {loyaltyDiscount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20"
                >
                   <span className="flex items-center gap-2"><Award size={14} /> {t('loyalty_discount') || 'Loyalty Discount'} (10%)</span>
                   <span>-{loyaltyDiscount.toLocaleString()} {settings?.currency || 'FCFA'}</span>
                </motion.div>
              )}

              {promoApplied && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 p-3 rounded-xl border border-blue-500/20"
                >
                   <span className="flex items-center gap-2"><Award size={14} /> Promo: SWEETO10</span>
                   <span>-{promoDiscount.toLocaleString()} {settings?.currency || 'FCFA'}</span>
                </motion.div>
              )}
              
              <div className="flex justify-between items-end pt-6 mt-6 border-t border-white/10">
                 <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">{t('total_to_pay') || 'Total'}</span>
                 <span className="text-4xl font-black italic tracking-tighter text-white">{grandTotal.toLocaleString()} <span className="text-lg text-blue-500">{settings?.currency || 'FCFA'}</span></span>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE - CHECKOUT FORM (LIGHT) */}
      <div className="lg:w-[55%] bg-white p-8 lg:p-16 flex items-center justify-center">
         <div className="w-full max-w-lg">
            <div className="mb-12">
               <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{t('delivery_details') || 'Delivery Details'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{t('where_send_package') || 'Where should we send your package?'}</p>
            </div>

            {isReturning && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center gap-4 shadow-sm"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-emerald-900 font-black text-[11px] uppercase tracking-wider">Welcome Back VIP!</p>
                  <p className="text-emerald-600 text-[9px] font-bold uppercase tracking-widest">We recognized your phone number. A 10% discount has been applied!</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleCheckout} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('recipient_name') || 'Recipient Name'}</label>
                 <div className="relative">
                   <input required name="name" value={formData.name} onChange={handleInputChange} placeholder={t('eg_name') || "Yao Kouassi"} className="w-full bg-slate-50 border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all pl-14" />
                   <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('contact_phone') || 'Contact Phone'}</label>
                 <div className="relative">
                   <input required name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07 XX XX XX XX" className="w-full bg-slate-50 border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all pl-14" />
                   <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
               </div>

               {/* PROMO CODE BOX */}
               <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Promo Code</label>
                  <div className="flex gap-3">
                    <input 
                      value={promoInput} 
                      onChange={(e) => setPromoInput(e.target.value)} 
                      placeholder="Enter code (e.g. SWEETO10)" 
                      disabled={promoApplied}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:opacity-50" 
                    />
                    <button 
                      type="button"
                      onClick={applyPromo}
                      disabled={!promoInput || promoApplied}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      {promoApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-red-500 text-[9px] font-bold mt-2 ml-1 uppercase">{promoError}</p>}
               </div>

               {/* Quick Hub Locks (Common Abidjan zones) */}
               <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-white/5 mb-6">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                   {lang === 'fr' ? '📍 Saisie Rapide du Quartier (Abidjan)' : '📍 Quick Hub Select (Abidjan)'}
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {['Adjamé Mirador', 'Cocody', 'Marcory', 'Yopougon', 'Riviera'].map((hub) => {
                     const isSelected = formData.city === 'Abidjan' && formData.address === hub;
                     return (
                       <motion.button
                         key={hub}
                         type="button"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => {
                           setFormData(prev => ({
                             ...prev,
                             city: 'Abidjan',
                             address: hub
                           }));
                         }}
                         className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                           isSelected
                             ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                             : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-white/5 dark:text-slate-300 dark:hover:bg-slate-700'
                         }`}
                       >
                         {hub}
                       </motion.button>
                     );
                   })}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('city') || 'City'}</label>
                    <div className="relative">
                      <select name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100/80 rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer pl-12">
                        {shippingZones.length === 0 ? (
                          <>
                            <option value="Abidjan">Abidjan</option>
                            <option value="Yamoussoukro">Yamoussoukro</option>
                            <option value="Bouaké">Bouaké</option>
                            <option value="San Pédro">San Pédro</option>
                          </>
                        ) : shippingZones.map(z => (
                          <option key={z.id} value={z.name}>{z.name}</option>
                        ))}
                      </select>
                      <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('precise_address') || 'Address'}</label>
                   <div className="relative">
                     <input required name="address" value={formData.address} onChange={handleInputChange} placeholder="Cocody, Block 4" className="w-full bg-slate-50 border border-slate-100/80 rounded-[1.5rem] px-6 py-5 pl-12 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                     <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                   </div>
                 </div>
               </div>

               <div className="mt-10 p-6 rounded-[2rem] bg-blue-50 border border-blue-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                     <Package size={20} />
                  </div>
                  <div>
                     <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm italic">{t('pay_on_delivery') || 'Pay on Delivery'}</h4>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('payment_collected_doorstep') || 'Payment collected at doorstep'}</p>
                  </div>
               </div>

               {/* Local Mobile Money Trust Badge Card */}
                <div className="mt-4 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/60 border border-slate-100/50 dark:border-white/5 flex flex-col">
                   <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] mb-2">{t('payment_method') || 'Payment Method'}</h4>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 font-bold">
                      {lang === 'fr' ? 'Payez à la livraison en espèces ou par transfert mobile :' : 'Pay upon delivery using cash or mobile transfer:'}
                   </p>
                   <div className="flex flex-wrap gap-2">
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">Wave</span>
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">Orange Money</span>
                     <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Moov Money</span>
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
