import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Smartphone, Laptop, Headphones, Watch, 
  Gamepad2, X, Home, ShoppingBag, Settings, User, 
  Heart, Globe, ChevronRight, Zap, Sparkles, Box, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const CategoryItem = ({ icon: Icon, name, count, index, active, onClick, t, t_smart }) => (
  <motion.div 
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: index * 0.05 + 0.2 }}
    whileHover={{ x: 8 }}
    onClick={onClick}
    className={`flex items-center justify-between group cursor-pointer p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[1.8rem] transition-all relative overflow-hidden mb-2 ${
      active 
      ? 'bg-blue-600/10 dark:bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)]' 
      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50'
    }`}
  >
    {active && <div className="absolute inset-y-0 left-0 w-1 bg-blue-50 rounded-full" />}
    <div className="flex items-center gap-3 sm:gap-5">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${
        active 
        ? 'bg-blue-600 text-white shadow-[0_8px_20px_-5px_rgba(37,99,235,0.4)] rotate-6' 
        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 group-hover:-rotate-3 group-hover:shadow-xl'
      }`}>
        <Icon className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
      </div>
      <div className="flex flex-col">
        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-colors leading-tight ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>{t_smart(name)}</span>
        <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest italic">{count || 0} {t('units_available')}</span>
      </div>
    </div>
    <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl transition-all shrink-0 ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400'
    }`}>
      <span className="text-[9px] sm:text-[10px] font-black">{count}</span>
    </div>
  </motion.div>
);

const MenuItem = ({ icon: Icon, name, active = false, onClick, index }) => (
  <motion.div 
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: index * 0.05 + 0.1 }}
    whileHover={{ x: 10, backgroundColor: 'rgba(59, 130, 246, 0.03)' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center justify-between p-3.5 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer transition-all group relative overflow-hidden mb-3 border ${
      active 
      ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white shadow-2xl shadow-slate-900/20 dark:shadow-white/10' 
      : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/50 text-slate-500 dark:text-slate-400'
    }`}
  >
    <div className="flex items-center gap-3 sm:gap-5 relative z-10">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 ${
        active 
        ? 'bg-blue-600 text-white' 
        : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:shadow-inner'
      }`}>
        <Icon className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
      </div>
      <span className={`font-black text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] ${active ? 'text-white dark:text-slate-900' : ''}`}>{name}</span>
    </div>
    <ChevronRight className={`w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] ${active ? 'text-white dark:text-slate-900' : 'text-slate-200 dark:text-slate-700'} transition-transform group-hover:translate-x-1`} />
  </motion.div>
);

const Sidebar = ({ isOpen, onClose, onCategorySelect, activeCategory, embedded = false, products = [] }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('menu');
  const { categories, brands, settings, selectedBrand, setSelectedBrand, setSelectedCategory } = useStore();
  const { t, t_smart, lang, isRTL } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isOpen && !embedded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, embedded]);

  const getCategoryIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('laptop')) return Laptop;
    if (lowerName.includes('phone')) return Smartphone;
    if (lowerName.includes('audio')) return Headphones;
    if (lowerName.includes('game')) return Gamepad2;
    if (lowerName.includes('watch')) return Watch;
    return LayoutGrid;
  };

  const displayCategories = categories.map(cat => ({
    ...cat,
    icon: getCategoryIcon(cat.name),
    count: products?.filter(p => p.category === cat.name).length || 0
  }));

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setActiveTab('filter'); };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (embedded) {
    return (
      <section className="py-16">
        <div className="flex flex-col gap-12">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
                <div className="relative w-14 h-14 bg-slate-900 dark:bg-white rounded-[1.8rem] flex items-center justify-center shadow-2xl">
                    <Box className="text-white dark:text-slate-900" size={28} />
                </div>
              </div>
              <div>
                 <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                    {t('shop_by')} <span className="text-blue-600">{t('department_core')}</span>
                 </h2>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-500" />
                    {t('discover_gear')}
                 </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {displayCategories.map((cat, i) => (
                <motion.div
                  key={cat.id || i}
                  whileHover={{ y: -12 }}
                  onClick={() => onCategorySelect(cat.name)}
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer group flex flex-col items-center text-center gap-6"
                >
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6 group-hover:shadow-2xl group-hover:shadow-blue-500/30">
                     {cat.icon ? <cat.icon size={36} strokeWidth={1.5} /> : <Box size={36} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight text-base mb-1">{t_smart(cat.name)}</h3>
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                       <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{cat.count || 0} {t('products')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200]"
          />

          <motion.aside 
            initial={{ x: isRTL ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-screen w-full max-w-[400px] bg-white dark:bg-slate-900/95 backdrop-blur-3xl shadow-[50px_0_100px_-20px_rgba(0,0,0,0.2)] z-[210] overflow-hidden flex flex-col border-r border-slate-100 dark:border-slate-800/60`}
          >
            <div className={`p-6 sm:p-10 pb-6 sm:pb-8 shrink-0 transition-all ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
              <div className="flex justify-between items-center mb-6 sm:mb-10">
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    className="w-12 h-12 bg-blue-600 rounded-[1.2rem] shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center"
                  >
                    <ShoppingBag className="text-white" size={24} />
                  </motion.div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">
                    {settings?.shopName?.split(' ')[0] || 'Store'} <span className="text-blue-600">{settings?.shopName?.split(' ').slice(1).join(' ') || 'Hub'}</span>
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  className="w-12 h-12 rounded-2xl transition-all flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="lg:hidden flex p-1.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-[1.8rem] border border-slate-200/30 dark:border-slate-700/30 relative">
                <motion.div 
                  layoutId="tabGlow"
                  className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-700 rounded-[1.3rem] shadow-xl z-0"
                  initial={false}
                  animate={{ x: activeTab === 'menu' ? (isRTL ? '100%' : '0%') : (isRTL ? '0%' : '100%'), width: 'calc(50% - 6px)' }}
                  transition={{ type: 'spring', bounce: 0.1, duration: 0.6 }}
                />
                <button 
                  onClick={() => setActiveTab('menu')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-all ${activeTab === 'menu' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                >
                  Navigation
                </button>
                <button 
                  onClick={() => setActiveTab('filter')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-all ${activeTab === 'filter' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                >
                  {t('categories')}
                </button>
              </div>
            </div>

            <div 
              onScroll={(e) => setScrolled(e.target.scrollTop > 20)}
              className="flex-1 overflow-y-auto px-6 sm:px-10 pb-8 sm:pb-12 custom-scrollbar space-y-8 sm:space-y-12"
            >
              <AnimatePresence mode="wait">
                {(activeTab === 'menu' && window.innerWidth < 1024) ? (
                  <motion.div 
                    key="menu"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    className="space-y-4 pt-4"
                  >
                    {[
                      { icon: Home, name: t('home_intelligence'), active: !activeCategory, onClick: () => { onCategorySelect(null); navigate('/'); onClose(); } },
                      { icon: ShoppingBag, name: t('luxury_collection'), onClick: () => { onCategorySelect(null); navigate('/products'); onClose(); } },
                      { icon: MapPin, name: t('corporate_location'), onClick: () => { navigate('/visit'); onClose(); } },
                      { icon: Heart, name: t('curated_wishlist'), onClick: () => { navigate('/wishlist'); onClose(); } },
                      { icon: User, name: t('global_account'), onClick: () => { navigate('/login'); onClose(); } }
                    ].map((item, i) => (
                      <MenuItem key={item.name} {...item} index={i} isRTL={isRTL} />
                    ))}
                    
                    <div className="pt-10 mt-12 border-t border-slate-100 dark:border-slate-800/50 space-y-6">
                       <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.5em] px-4">{t('preference_node')}</h3>
                       
                       <motion.div whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700/50 group cursor-pointer transition-all">
                          <div className="flex items-center gap-3 sm:gap-5">
                             <Globe className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] text-blue-500" />
                             <span className="font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400">{t('regional_language')}</span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-blue-500/10 uppercase tracking-widest">{lang.toUpperCase()}</span>
                       </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="filter"
                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    className="space-y-12 pt-4"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-8 h-[2px] bg-blue-600 rounded-full"></div>
                         <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] italic">{t('department_core')}</h3>
                      </div>
                      <div className="space-y-1">
                        {displayCategories.map((cat, i) => (
                          <CategoryItem 
                            key={cat.id} 
                            icon={cat.icon} 
                            name={cat.name} 
                            count={cat.count} 
                            index={i}
                            active={activeCategory === cat.name}
                            onClick={() => {
                              onCategorySelect(cat.name);
                              if (!embedded) onClose();
                            }}
                            t={t}
                            t_smart={t_smart}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-8 h-[2px] bg-blue-600 rounded-full"></div>
                         <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] italic">{t('partner_brands')}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {brands?.length > 0 ? brands.map((brandObj, i) => {
                          const isActive = selectedBrand === brandObj.name;
                          return (
                            <motion.div 
                              key={brandObj.id || i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 + 0.3 }}
                              whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                              onClick={() => { 
                                setSelectedCategory(null);
                                setSelectedBrand(brandObj.name); 
                                if (!embedded) onClose(); 
                              }}
                              className={`flex items-center gap-3 cursor-pointer group p-3 rounded-[1.5rem] transition-all border ${
                                isActive 
                                ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
                                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-white/5 hover:border-blue-500/20'
                              }`}
                            >
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-all ${
                                 isActive ? 'bg-white shadow-md border-blue-500/20' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800'
                               }`}>
                                  {brandObj.logo ? (
                                    <img src={brandObj.logo} alt={brandObj.name} className="w-full h-full object-contain p-2" />
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                      {brandObj.name?.slice(0, 2)}
                                    </span>
                                  )}
                               </div>
                               <span className={`text-[10px] font-black uppercase tracking-widest line-clamp-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{brandObj.name}</span>
                            </motion.div>
                          );
                        }) : (
                          <div className="col-span-2 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 text-center">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('no_premium_partners')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="p-6 sm:p-10 bg-slate-900 dark:bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap size={100} className="text-white dark:text-slate-950" />
                      </div>
                      <h3 className="text-[9px] sm:text-[10px] font-black text-white/40 dark:text-slate-400 uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-6 sm:mb-8 relative z-10">{t('matrix_filter')}</h3>
                      <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 relative z-10">
                        <input type="number" placeholder="Min. FCFA" className="w-full p-4 sm:p-5 bg-white/5 dark:bg-slate-50 border border-white/10 dark:border-slate-200 rounded-2xl text-[10px] sm:text-[11px] font-black text-white dark:text-slate-900 placeholder:text-white/20 dark:placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all shadow-inner" />
                        <input type="number" placeholder="Max. FCFA" className="w-full p-4 sm:p-5 bg-white/5 dark:bg-slate-50 border border-white/10 dark:border-slate-200 rounded-2xl text-[10px] sm:text-[11px] font-black text-white dark:text-slate-900 placeholder:text-white/20 dark:placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all shadow-inner" />
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-blue-600 text-white py-5 sm:py-6 rounded-[1.5rem] sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl shadow-blue-600/30 transition-all relative z-10"
                      >
                        {t('optimize_search')}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
