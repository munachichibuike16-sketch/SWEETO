import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, CheckCircle2, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiFetch } from '../utils/api';
import { supabase } from '../lib/supabase';

// Wave Logo SVG
const WaveLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="48" fill="#0052FF"/>
    <path d="M128 50C84.9218 50 50 84.9218 50 128C50 171.078 84.9218 206 128 206C171.078 206 206 171.078 206 128C206 84.9218 171.078 50 128 50ZM128 184C97.072 184 72 158.928 72 128C72 97.072 97.072 72 128 72C158.928 72 184 97.072 184 128C184 158.928 158.928 184 128 184Z" fill="white"/>
    <path d="M128 94C109.222 94 94 109.222 94 128C94 146.778 109.222 162 128 162C146.778 162 162 146.778 162 128C162 109.222 146.778 94 128 94Z" fill="white"/>
  </svg>
);

const operatorConfigs = {
  wave: {
    name: 'Wave',
    color: '#0052FF',
    hoverColor: '#0043D0',
    textColor: 'text-white',
    accentColor: 'bg-[#0052FF]',
    prefix: 'WAV',
    icon: <WaveLogo size={28} />
  }
};

const WavePayPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const { settings, showToast } = useStore();
  const { t, lang } = useLanguage();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState('checking'); // checking, live, simulation
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txId, setTxId] = useState('');
  const [waUrl, setWaUrl] = useState('');
  const [operator, setOperator] = useState('wave'); // 'wave'
  const [customTxId, setCustomTxId] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(true);
  const [payUrl, setPayUrl] = useState('');

  useEffect(() => {
    const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobileDevice(isMob);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        let orderData = null;
        
        if (supabase) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          if (!error && data) {
            orderData = data;
          }
        }
        
        if (!orderData) {
          const res = await apiFetch(`/api/orders/${orderId}/tracking`);
          if (res.ok) {
            orderData = await res.json();
          }
        }

        if (orderData) {
          setOrder(orderData);
          
          if (orderData.status === 'paid' || statusParam === 'success') {
            setIsSuccess(true);
            setLoading(false);
            return;
          }
          
          // Check for live Wave Checkout Session
          checkWaveSession(orderData);
        } else {
          showToast('Commande introuvable / Order not found.', 'error');
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        showToast('Erreur de chargement / Loading error.', 'error');
        setPaymentMode('simulation');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, settings, statusParam]);

  // Polling effect to check for automated webhook/payment confirmation
  useEffect(() => {
    if (!orderId || isSuccess) return;

    const interval = setInterval(async () => {
      try {
        let orderData = null;
        if (supabase) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          if (!error && data) {
            orderData = data;
          }
        }
        
        if (!orderData) {
          const res = await apiFetch(`/api/orders/${orderId}/tracking`);
          if (res.ok) {
            orderData = await res.json();
          }
        }

        if (orderData && orderData.status === 'paid') {
          setOrder(orderData);
          setIsSuccess(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.warn('Polling order status failed:', err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [orderId, isSuccess, supabase]);

  const checkWaveSession = async (orderData) => {
    try {
      const res = await apiFetch('/api/payments/wave/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      
      let targetUrl = '';
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.checkoutUrl) {
          targetUrl = data.checkoutUrl;
          setPaymentMode('live');
        }
      }
      
      if (!targetUrl) {
        const orderAmount = orderData?.total || orderData?.total_amount || 0;
        const baseLink = settings?.wave_payment_url?.trim() || 'https://pay.wave.com/m/M_ci_fZ7c2kHGPRKo/c/ci/';
        targetUrl = baseLink.includes('?') 
          ? `${baseLink}&amount=${orderAmount}` 
          : `${baseLink}?amount=${orderAmount}`;
        setPaymentMode('live_link');
      }
      
      setPayUrl(targetUrl);
      
      const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMob) {
        window.location.href = targetUrl;
      }
      
      setLoading(false);
    } catch (e) {
      console.warn('Failed to check live Wave session:', e);
      const orderAmount = orderData?.total || orderData?.total_amount || 0;
      const baseLink = settings?.wave_payment_url?.trim() || 'https://pay.wave.com/m/M_ci_fZ7c2kHGPRKo/c/ci/';
      const targetUrl = baseLink.includes('?') 
        ? `${baseLink}&amount=${orderAmount}` 
        : `${baseLink}?amount=${orderAmount}`;
      
      setPayUrl(targetUrl);
      setPaymentMode('live_link');
      
      const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMob) {
        window.location.href = targetUrl;
      }
      
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    const activeOp = operatorConfigs[operator];
    const generatedTxId = customTxId.trim() || `${activeOp.prefix}-` + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
    setTxId(generatedTxId);

    try {
      let chatSid = window.localStorage.getItem('sweeto_chat_session_id');
      if (!chatSid) {
        chatSid = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        window.localStorage.setItem('sweeto_chat_session_id', chatSid);
      }

      const shopName = settings?.shopName || 'SWEETO HUB';
      const orderAmount = order.total || order.total_amount;
      const currency = settings?.currency || 'FCFA';

      if (supabase) {
        const currentContact = order.customer_contact || '';
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            customer_contact: currentContact ? `${currentContact} | ${activeOp.name} Tx: ${generatedTxId}` : `${activeOp.name} Tx: ${generatedTxId}`
          })
          .eq('id', orderId);
        if (error) throw error;

        try {
          await supabase.from('chat_messages').insert([
            {
              session_id: chatSid,
              customer_name: order.customer_name,
              customer_phone: order.customer_phone || null,
              sender_role: 'customer',
              message_text: `💸 [${activeOp.name} Auto-Payment]: J'ai payé ${Number(orderAmount).toLocaleString()} ${currency} pour la Commande #${orderId}. ID Transaction: ${generatedTxId}.`
            }
          ]);
        } catch (chatErr) {
          console.warn('Could not write payment message to Chat:', chatErr);
        }

      } else {
        const response = await apiFetch(`/api/orders/${orderId}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wave_transaction_id: generatedTxId })
        });
        if (!response.ok) throw new Error('Local database update failed');
      }

      const ADMIN_WHATSAPP = settings?.admin_phone || '+2250500619923';
      const itemsList = order.items ? 
        JSON.parse(order.items).map(item => `- ${item.name} (Qté: ${item.quantity})`).join('\n') : '';

      const msg = `Bonjour Sweeto-Hub, j'ai effectué mon paiement ${activeOp.name} pour ma commande :\n` +
        `${itemsList}\n\n` +
        `Montant Payé : ${Number(orderAmount).toLocaleString()} ${currency} (${activeOp.name})\n` +
        `Destinataire : ${order.customer_name}\n` +
        `ID Commande : #${orderId}\n` +
        `ID Transaction : ${generatedTxId}`;
      setWaUrl(`https://wa.me/${ADMIN_WHATSAPP.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`);

      await apiFetch('/api/push/notify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: order.customer_name,
          amount: orderAmount,
          status: 'SUCCESSFUL'
        })
      }).catch(err => console.warn('Could not trigger payment push notification:', err));

      setTimeout(() => {
        setIsConfirming(false);
        setIsSuccess(true);
        showToast(lang === 'fr' ? 'Paiement confirmé ! 💸' : 'Payment confirmed! 💸', 'success');
      }, 1500);

    } catch (err) {
      console.error('Payment confirmation failed:', err);
      showToast('Une erreur est survenue lors de la validation. / Confirmation failed.', 'error');
      setIsConfirming(false);
    }
  };

  const handleCancelPayment = () => {
    showToast(lang === 'fr' ? 'Paiement annulé.' : 'Payment cancelled.', 'info');
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-3xl bg-[#0052FF] flex items-center justify-center shadow-lg animate-bounce">
            <WaveLogo size={36} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-black uppercase text-xs tracking-widest">
          <RefreshCw className="animate-spin text-[#0052FF]" size={16} />
          <span>{lang === 'fr' ? 'Connexion sécurisée Gateway...' : 'Connecting to Secure Gateway...'}</span>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    const activeOp = operatorConfigs[operator];
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,82,255,0.15),transparent_70%)]"></div>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-10 text-center border border-white/10 shadow-2xl relative z-10"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">
            {lang === 'fr' ? 'PAIEMENT CONFIRMÉ !' : 'PAYMENT SUCCESSFUL!'}
          </h3>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-6">
            {lang === 'fr' ? 'Commande' : 'Order'} SWT-{orderId}
          </p>
          <p className="text-sm text-slate-350 leading-relaxed mb-8">
            {lang === 'fr' ? 
              `Votre paiement via ${activeOp.name} a été validé et enregistré. L’administrateur a été notifié de votre transaction.` : 
              `Your payment via ${activeOp.name} was successfully validated and registered. The administrator has been notified of the transfer.`}
          </p>
          {txId && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-8">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">ID Transaction ({activeOp.name})</span>
              <code className="text-xs font-black text-blue-400 select-all">{txId}</code>
            </div>
          )}

          <div className="space-y-4">
            {waUrl && (
              <button 
                onClick={() => window.open(waUrl, '_blank')}
                className="w-full bg-[#25D366] text-white font-black py-4.5 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.116-2.887-6.98C15.782 1.896 13.313.864 10.68.864 5.244.864.827 5.285.823 10.724c0 1.687.445 3.328 1.29 4.767l-.992 3.62 3.71-.973zm11.365-6.86c-.302-.15-1.786-.882-2.057-.98-.27-.1-.468-.15-.665.15-.198.3-.765.98-.937 1.18-.173.2-.347.225-.65.075-.302-.15-1.276-.47-2.43-1.498-.897-.8-1.503-1.787-1.68-2.087-.177-.3-.02-.46.13-.61.137-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.24-.575-.48-.5-.665-.51-.173-.007-.37-.01-.568-.01-.198 0-.52.075-.79.37-.27.3-1.035 1.01-1.035 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.085 3.18 5.05 4.464.707.306 1.258.489 1.69.626.71.226 1.356.194 1.866.118.57-.085 1.786-.73 2.037-1.435.25-.705.25-1.31.175-1.435-.075-.125-.27-.2-.57-.35z"/>
                </svg>
                <span>{lang === 'fr' ? 'Ouvrir WhatsApp pour Finaliser' : 'Open WhatsApp to Finalize'}</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white/10 text-white font-black py-4.5 rounded-2xl uppercase tracking-widest text-[11px] hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {lang === 'fr' ? 'Retourner à la boutique' : 'Back to Store'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const shopName = settings?.shopName || 'SWEETO HUB';
  const orderAmount = order?.total || order?.total_amount || 0;
  const currency = settings?.currency || 'FCFA';
  const activeOp = operatorConfigs[operator];

  // RENDER LIVE OFFICIAL PENGUIN/QR SCAN PORTAL ON DESKTOP
  if (!isMobileDevice && !isSuccess) {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payUrl || 'https://pay.wave.com')}`;
    return (
      <div className="min-h-screen w-full bg-[#19C3FC] flex items-center justify-center p-6 font-sans select-none">
        <div className="max-w-md w-full flex flex-col items-center text-center text-white relative">
          
          {/* Logo & Mascot Header */}
          <div className="flex flex-col items-center mb-6">
            <svg className="w-24 h-24 mb-2 drop-shadow-md" viewBox="0 0 100 100" fill="none">
              <circle cx="35" cy="85" r="8" fill="#FF9F00" />
              <circle cx="65" cy="85" r="8" fill="#FF9F00" />
              <ellipse cx="50" cy="55" rx="25" ry="32" fill="#1C1A17" />
              <ellipse cx="50" cy="58" rx="17" ry="24" fill="white" />
              <circle cx="42" cy="40" r="3" fill="white" />
              <circle cx="42" cy="40" r="1.5" fill="black" />
              <circle cx="58" cy="40" r="3" fill="white" />
              <circle cx="58" cy="40" r="1.5" fill="black" />
              <polygon points="50,44 46,48 54,48" fill="#FF9F00" />
              <ellipse cx="50" cy="22" rx="18" ry="6" fill="#F0F4F8" />
              <path d="M34 22c0 8 7 10 16 10s16-2 16-10H34z" fill="#E2E8F0" />
              <path d="M38 20c2-4 6-4 8 0c3-3 8-3 10 0c2-4 6-4 8 0H38z" fill="#22C55E" />
              <circle cx="50" cy="18" r="3" fill="#EF4444" />
            </svg>
            <h1 className="text-3xl font-black tracking-tight leading-none uppercase italic flex items-center gap-1">
              Pay with <span className="text-slate-900 not-italic font-extrabold lowercase">wave</span>
            </h1>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] mb-6 flex items-center justify-center relative">
            <img 
              src={qrCodeUrl} 
              alt="Scan QR code to pay" 
              className="w-56 h-56 object-contain"
            />
          </div>

          {/* Instructions */}
          <div className="flex items-center gap-3 mb-6 bg-black/10 px-6 py-3.5 rounded-full backdrop-blur-md">
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-black uppercase tracking-wider">Scan the QR code to pay</span>
          </div>

          <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-8">
            Download the Wave app on your phone
          </p>

          {/* App Download Badges */}
          <div className="flex gap-4 mb-10 w-full justify-center">
            <a href="https://play.google.com/store/apps/details?id=com.wave.personal" target="_blank" rel="noopener noreferrer" className="h-10 hover:scale-[1.03] transition-all">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-full" />
            </a>
            <a href="https://apps.apple.com/app/wave-mobile-money/id1453479634" target="_blank" rel="noopener noreferrer" className="h-10 hover:scale-[1.03] transition-all">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-full" />
            </a>
          </div>

          {/* Action buttons (including Skip!) */}
          <div className="w-full flex gap-4 max-w-sm">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              onClick={() => navigate(`/order-tracking/${orderId}`)}
              className="flex-[2] py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              {lang === 'fr' ? 'Passer au Suivi' : 'Skip to Tracking'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] flex items-center justify-center p-4 transition-colors duration-500 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#0b101c] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden text-left relative">
        
        {/* Operator Selector Header Tabs */}
        {Object.keys(operatorConfigs).length > 1 && (
          <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
            {Object.keys(operatorConfigs).map((opKey) => {
              const op = operatorConfigs[opKey];
              const isActive = operator === opKey;
              return (
                <button
                  key={opKey}
                  onClick={() => setOperator(opKey)}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'font-extrabold'
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650'
                  }`}
                  style={{
                    borderBottomColor: isActive ? op.color : 'transparent',
                    color: isActive ? op.color : undefined
                  }}
                >
                  {op.name}
                </button>
              );
            })}
          </div>
        )}

        {/* operator Header */}
        <div className="p-6 text-white flex items-center justify-between transition-colors duration-500" style={{ backgroundColor: activeOp.color }}>
          <div className="flex items-center gap-3">
            {activeOp.icon}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{activeOp.name} Gateway</p>
              <h2 className="text-base font-black uppercase tracking-wider leading-none mt-0.5">{shopName}</h2>
            </div>
          </div>
          <div className="bg-white/15 px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10 select-none">
            <Shield size={12} />
            <span className="text-[9px] font-black tracking-widest uppercase">Secure</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 text-center bg-slate-50/50 dark:bg-white/2">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Montant à Payer / Total Amount</p>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-black tracking-tight leading-none" style={{ color: activeOp.color }}>
              {Number(orderAmount).toLocaleString()}
            </h1>
            <span className="text-lg font-black text-slate-500 dark:text-slate-400">{currency}</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-lg max-w-xs mx-auto">
            <Lock size={10} />
            <span className="uppercase tracking-widest">Le montant est verrouillé / Amount Locked</span>
          </div>
        </div>

        {/* Order details */}
        <div className="p-8 space-y-5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ID Commande</span>
            <span className="font-black text-slate-800 dark:text-white">SWT-{orderId}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Client / Recipient</span>
            <span className="font-black text-slate-850 dark:text-slate-200">{order?.customer_name}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Téléphone / Phone</span>
            <span className="font-black text-slate-850 dark:text-slate-200">{order?.customer_phone}</span>
          </div>
          
          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-bold">
              {lang === 'fr' ? 
                `En confirmant ce paiement, le montant sera automatiquement prélevé de votre compte ${activeOp.name}. Vous ne pouvez pas modifier ce montant.` : 
                `By confirming this payment, the exact amount will be deducted from your ${activeOp.name} wallet. You cannot modify the transaction amount.`}
            </p>
          </div>
        </div>

        {/* Transaction ID input box for Live Link & Simulation */}
        {paymentMode === 'live_link' && (
          <div className="p-8 border-t border-slate-100 dark:border-white/5 space-y-4">
            <button
              type="button"
              onClick={() => {
                const payUrl = settings?.wave_payment_url || 'https://pay.wave.com';
                window.open(payUrl, '_blank');
              }}
              className="w-full bg-[#0052FF] hover:bg-[#0043D0] text-white font-black py-4.5 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <Lock size={12} />
              {lang === 'fr' ? '1. Ouvrir l\'application Wave pour payer' : '1. Open Wave App to Pay'}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              {lang === 'fr'
                ? '2. Après avoir payé sur Wave, cliquez sur "Confirmer" ci-dessous'
                : '2. After paying in Wave, click "Confirm" below'
              }
            </p>
          </div>
        )}

        {/* Buttons Row */}
        <div className="p-8 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-3">
          <button
            onClick={handleCancelPayment}
            disabled={isConfirming}
            className="flex-1 min-w-[80px] py-4.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </button>

          <button
            onClick={() => navigate(`/order-tracking/${orderId}`)}
            className="flex-1 min-w-[80px] py-4.5 bg-blue-500/10 text-[#0052FF] dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center border border-blue-500/20"
          >
            {lang === 'fr' ? 'Passer' : 'Skip'}
          </button>
          
          <button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="flex-[2] min-w-[150px] py-4.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: activeOp.color,
              boxShadow: `0 10px 15px -3px ${activeOp.color}40`
            }}
          >
            {isConfirming ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>{lang === 'fr' ? 'Validation...' : 'Verifying...'}</span>
              </>
            ) : (
              <>
                <Lock size={12} />
                <span>{lang === 'fr' ? 'Confirmer le Paiement' : 'Confirm Payment'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default WavePayPage;
