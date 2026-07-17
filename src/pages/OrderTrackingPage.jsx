import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, MessageSquare, Truck, ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileDock from '../components/MobileDock';
import CartDrawer from '../components/CartDrawer';

export default function OrderTrackingPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [riderInfo, setRiderInfo] = useState(null);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId') || orderId;
    if (orderIdParam) {
      setOrderIdInput(orderIdParam);
      setCurrentOrderId(orderIdParam);
      generateRandomRider();
    }
  }, [searchParams, orderId]);

  const generateRandomRider = () => {
    const riders = [
      { name: 'Koffi Kouadio', phone: '+225 07 88 44 21 09', vehicle: 'Scooter Yam - Orange' },
      { name: 'Amadou Touré', phone: '+225 05 47 11 90 32', vehicle: 'Scooter Yam - Noir' },
      { name: 'Yao N\'Guessan', phone: '+225 01 02 88 56 11', vehicle: 'Scooter Yam - Rouge' }
    ];
    setRiderInfo(riders[Math.floor(Math.random() * riders.length)]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setCurrentOrderId(orderIdInput.trim());
      generateRandomRider();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 pb-20">
      <Header onSidebarOpen={() => setIsSidebarOpen(true)} onCartOpen={() => setIsCartOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'fr' ? 'Suivi de Commande' : 'Order Tracking'}
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'fr' ? 'Suivez votre livraison en temps réel' : 'Track your delivery in real-time'}
            </p>
          </div>
        </div>

        {/* Search Panel */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Entrez votre ID de Commande...' : 'Enter your Order ID...'}
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-semibold text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            {lang === 'fr' ? 'Rechercher' : 'Track Now'}
          </button>
        </form>

        {currentOrderId ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Map Simulator Panel */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 self-start">
                {lang === 'fr' ? 'Carte de Livraison (Abidjan)' : 'Delivery Map (Abidjan)'}
              </h3>
              
              {/* Abidjan Map Simulator SVG */}
              <div className="w-full h-80 bg-slate-50 dark:bg-slate-950/65 rounded-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner">
                <svg viewBox="0 0 400 300" className="w-full h-full text-slate-300 dark:text-slate-700 select-none">
                  {/* Map grid patterns */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Water / Lagoon representation */}
                  <path 
                    d="M 0,220 Q 120,200 240,240 T 400,210 L 400,300 L 0,300 Z" 
                    fill="rgba(59, 130, 246, 0.08)" 
                    stroke="rgba(59, 130, 246, 0.15)"
                    strokeWidth="1.5"
                  />

                  {/* Districts Outline Mock Representation */}
                  {/* Yopougon */}
                  <text x="50" y="80" className="text-[10px] font-black uppercase fill-slate-400 dark:fill-slate-600 opacity-60">Yopougon</text>
                  {/* Plateau */}
                  <text x="180" y="150" className="text-[10px] font-black uppercase fill-slate-400 dark:fill-slate-600 opacity-60">Plateau</text>
                  {/* Cocody */}
                  <text x="310" y="80" className="text-[10px] font-black uppercase fill-slate-400 dark:fill-slate-600 opacity-60">Cocody</text>
                  {/* Marcory */}
                  <text x="240" y="270" className="text-[10px] font-black uppercase fill-slate-400 dark:fill-slate-600 opacity-60">Marcory</text>

                  {/* Road Network Paths */}
                  <path 
                    d="M 50,120 L 180,120 L 250,220 M 180,120 L 310,120" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />

                  {/* Warehouse dispatch point (Marcory) */}
                  <g transform="translate(250, 220)">
                    <circle r="6" fill="#f59e0b" className="animate-ping" />
                    <circle r="4" fill="#f59e0b" />
                    <text y="-10" textAnchor="middle" className="text-[8px] font-black fill-[#f59e0b] uppercase">Warehouse Depot</text>
                  </g>

                  {/* Destination points (Cocody) */}
                  <g transform="translate(310, 120)">
                    <circle r="5" fill="#3b82f6" />
                    <text y="-10" textAnchor="middle" className="text-[8px] font-black fill-[#3b82f6] uppercase">Client</text>
                  </g>

                  {/* Animated Route Line */}
                  <path 
                    id="route-path"
                    d="M 250,220 Q 220,170 180,120 Q 240,120 310,120" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeDasharray="5 5"
                    className="opacity-75"
                  />

                  {/* Moving Scooter Marker */}
                  <motion.g
                    initial={{ x: 250, y: 220 }}
                    animate={{
                      x: [250, 220, 180, 240, 310],
                      y: [220, 170, 120, 120, 120]
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    {/* Scooter icon representation */}
                    <circle r="8" fill="#10b981" className="shadow-lg" />
                    <path d="M-3,-3 L3,0 L-3,3 Z" fill="white" transform="rotate(30)" />
                  </motion.g>
                </svg>

                {/* Live Position Overlay Badge */}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 border border-white/5 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Rider en mouvement
                </div>
              </div>
            </div>

            {/* Delivery Info Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Order Status Cards */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {lang === 'fr' ? 'Statut de Livraison' : 'Delivery Status'}
                </h4>
                
                {/* Tracker Steps */}
                <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                  
                  {/* Step 1: Confirmed */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-4 border-slate-50 dark:border-[#090d16] flex items-center justify-center shrink-0">
                      <CheckCircle size={10} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                        {lang === 'fr' ? 'Commande Confirmée' : 'Order Confirmed'}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1 block">12:35 PM</span>
                    </div>
                  </div>

                  {/* Step 2: Dispatched */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-4 border-slate-50 dark:border-[#090d16] flex items-center justify-center shrink-0">
                      <CheckCircle size={10} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                        {lang === 'fr' ? 'Expédié du Dépot' : 'Dispatched from Depot'}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1 block">12:45 PM</span>
                    </div>
                  </div>

                  {/* Step 3: En Route */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 border-4 border-slate-50 dark:border-[#090d16] flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-emerald-500 leading-none">
                        {lang === 'fr' ? 'Livraison en cours' : 'Out for Delivery'}
                      </p>
                      <span className="text-[9px] text-slate-450 dark:text-slate-400 mt-1 block">
                        {lang === 'fr' ? 'Arrivée estimée dans ~25 min' : 'Estimated arrival in ~25 min'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Rider Info Card */}
              {riderInfo && (
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {lang === 'fr' ? 'Livreur Attribué' : 'Assigned Rider'}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/25 shadow-md">
                      <Truck size={20} />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{riderInfo.name}</h5>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{riderInfo.vehicle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`tel:${riderInfo.phone}`}
                      className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      <Phone size={12} />
                      {lang === 'fr' ? 'Appeler' : 'Call'}
                    </a>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
                      className="flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-500/15"
                    >
                      <MessageSquare size={12} />
                      {lang === 'fr' ? 'Aide Chat' : 'Chat Help'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          
          /* Empty / Instructions Panel */
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-3xl p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 border border-blue-500/25 flex items-center justify-center mx-auto shadow-md">
              <Truck size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">
                {lang === 'fr' ? 'En attente d\'un ID de commande' : 'Awaiting Order ID'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {lang === 'fr' 
                  ? 'Veuillez saisir votre identifiant de commande reçu par WhatsApp ou par ticket pour voir la carte de livraison.' 
                  : 'Please enter your order identifier received via WhatsApp or coupon to track your driver on the map.'}
              </p>
            </div>
          </div>
        )}

      </main>

      <MobileDock onCartOpen={() => setIsCartOpen(true)} />
    </div>
  );
}
