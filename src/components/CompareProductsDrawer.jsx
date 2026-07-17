import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, ShoppingCart, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';

export default function CompareProductsDrawer() {
  const { lang, t } = useLanguage();
  const { settings, products } = useStore();
  const { addToCart } = useCart();
  const [comparedIds, setComparedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync with localStorage compare list
  const syncCompareList = () => {
    try {
      const list = JSON.parse(localStorage.getItem('sweetohub_compare_list') || '[]');
      setComparedIds(list);
    } catch (e) {
      setComparedIds([]);
    }
  };

  useEffect(() => {
    syncCompareList();
    window.addEventListener('sweetohub-compare-change', syncCompareList);
    return () => window.removeEventListener('sweetohub-compare-change', syncCompareList);
  }, []);

  const handleRemove = (id) => {
    const newList = comparedIds.filter(itemId => itemId !== id);
    localStorage.setItem('sweetohub_compare_list', JSON.stringify(newList));
    window.dispatchEvent(new Event('sweetohub-compare-change'));
    if (newList.length === 0) {
      setIsModalOpen(false);
    }
  };

  const handleClearAll = () => {
    localStorage.setItem('sweetohub_compare_list', '[]');
    window.dispatchEvent(new Event('sweetohub-compare-change'));
    setIsModalOpen(false);
  };

  const activeComparedProducts = products.filter(p => comparedIds.includes(p.id));

  if (comparedIds.length === 0) return null;

  const currency = settings?.currency || 'FCFA';

  return (
    <>
      {/* Floating Bottom Bar */}
      <AnimatePresence>
        {!isModalOpen && comparedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-22 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-4.5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 font-sans"
          >
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <Scale size={16} />
              </div>
              <div className="text-left">
                <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {lang === 'fr' ? 'Comparateur' : 'Product Compare'}
                </h5>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                  {comparedIds.length} {comparedIds.length > 1 ? (lang === 'fr' ? 'produits sélectionnés' : 'products selected') : (lang === 'fr' ? 'produit sélectionné' : 'product selected')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAll}
                className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                {lang === 'fr' ? 'Vider' : 'Clear'}
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={comparedIds.length < 2}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-orange-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Scale size={12} />
                <span>{lang === 'fr' ? 'Comparer' : 'Compare'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Grid Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-4xl h-[85vh] bg-[#090d16]/95 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-wider">
                      {lang === 'fr' ? 'Matrice de Comparaison' : 'Comparison Matrix'}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      {lang === 'fr' ? 'Comparez les spécifications et prix' : 'Compare product specifications and details'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Matrix Layout Columns */}
              <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin py-6 min-w-0">
                <div className="flex gap-4 min-w-[700px] h-full">
                  {/* Left Column: Metric Titles */}
                  <div className="w-[180px] shrink-0 flex flex-col gap-6 text-left border-r border-slate-800 pr-4 select-none pt-44">
                    <div className="h-10 flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Prix / Price</div>
                    <div className="h-10 flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Catégorie / Category</div>
                    <div className="h-10 flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Disponibilité / Stock</div>
                    <div className="flex-1 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-2">Description</div>
                  </div>

                  {/* Product Columns */}
                  {activeComparedProducts.map((p) => {
                    const inStock = (p.stock_count || 0) > 0;
                    return (
                      <div key={p.id} className="flex-1 min-w-[200px] max-w-[280px] flex flex-col gap-6 text-center border-r border-slate-800/40 pr-4 last:border-0 last:pr-0">
                        {/* Top: Card Image, Name, and Close */}
                        <div className="flex flex-col items-center gap-3 relative shrink-0">
                          <button
                            onClick={() => handleRemove(p.id)}
                            className="absolute top-0 right-0 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                            title="Remove from comparison"
                          >
                            <Trash2 size={12} />
                          </button>
                          
                          <img
                            src={p.image_url || p.image || '/hero-banner.png'}
                            alt={p.name}
                            className="w-24 h-24 object-cover rounded-2xl border border-slate-800 bg-slate-900"
                          />
                          
                          <h4 className="text-xs font-black text-white uppercase tracking-wide line-clamp-2 px-2 h-8 flex items-center justify-center">
                            {p.name}
                          </h4>
                        </div>

                        {/* Price */}
                        <div className="h-10 flex items-center justify-center text-sm font-black text-orange-500">
                          {p.price?.toLocaleString()} {currency}
                        </div>

                        {/* Category */}
                        <div className="h-10 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {p.category}
                        </div>

                        {/* Stock */}
                        <div className="h-10 flex items-center justify-center">
                          {inStock ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle2 size={10} />
                              <span>{lang === 'fr' ? 'En Stock' : 'In Stock'}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <AlertCircle size={10} />
                              <span>{lang === 'fr' ? 'Rupture' : 'Out of Stock'}</span>
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <div className="flex-1 text-[10px] text-slate-400 font-bold leading-relaxed text-left overflow-y-auto max-h-[140px] px-2 scrollbar-thin">
                          {p.description || (lang === 'fr' ? 'Aucune spécification renseignée.' : 'No specifications provided.')}
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => addToCart(p)}
                          disabled={!inStock}
                          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <ShoppingCart size={11} />
                          <span>{lang === 'fr' ? 'Acheter' : 'Buy Now'}</span>
                        </button>

                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
