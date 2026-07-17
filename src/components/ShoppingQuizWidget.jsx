import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, ChevronRight, Award, ShoppingCart, Eye } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ShoppingQuizWidget() {
  const { products, settings, openGlobalLightbox, showToast } = useStore();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); // 0: Start, 1: Category, 2: Budget, 3: Usage, 4: Results
  
  // Quiz selections
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetRange, setBudgetRange] = useState(''); // 'low' | 'mid' | 'high' | 'all'
  const [usageType, setUsageType] = useState(''); // 'work' | 'gaming' | 'luxury' | 'casual'
  const [results, setResults] = useState([]);

  useEffect(() => {
    const handleOpenEvent = () => handleOpen();
    window.addEventListener('open-shopping-quiz', handleOpenEvent);
    return () => window.removeEventListener('open-shopping-quiz', handleOpenEvent);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setStep(0);
    setSelectedCategory('');
    setBudgetRange('');
    setUsageType('');
    setResults([]);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const startQuiz = () => {
    setStep(1);
  };

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setStep(2);
  };

  const selectBudget = (range) => {
    setBudgetRange(range);
    setStep(3);
  };

  const selectUsage = (usage) => {
    setUsageType(usage);
    calculateResults(usage);
  };

  const calculateResults = (finalUsage) => {
    if (!products || products.length === 0) {
      setResults([]);
      setStep(4);
      return;
    }

    let filtered = [...products];

    // 1. Filter by category (case-insensitive substring check)
    if (selectedCategory) {
      filtered = filtered.filter(p => 
        p.category?.toLowerCase().includes(selectedCategory.toLowerCase()) || 
        selectedCategory.toLowerCase().includes(p.category?.toLowerCase() || '')
      );
    }

    // 2. Filter by budget
    // Low: < 200,000 | Mid: 200,000 - 500,000 | High: > 500,000
    if (budgetRange === 'low') {
      filtered = filtered.filter(p => Number(p.price) < 200000);
    } else if (budgetRange === 'mid') {
      filtered = filtered.filter(p => Number(p.price) >= 200000 && Number(p.price) <= 500000);
    } else if (budgetRange === 'high') {
      filtered = filtered.filter(p => Number(p.price) > 500000);
    }

    // 3. Score and sort by usage keywords in description/name
    const usageKeywords = {
      work: ['pro', 'office', 'travail', 'business', 'work', 'laptop', 'performance', 'battery', 'autonomie'],
      gaming: ['gaming', 'game', 'gpu', 'graphics', 'refresh', 'hz', 'playstation', 'console', 'puissant', 'vitesse'],
      luxury: ['gold', 'luxury', 'luxe', 'premium', 'edition', 'watch', 'apple', 'iphone', 'chic'],
      casual: ['casual', 'simple', 'standard', 'lite', 'daily', 'facile', 'ecouteur', 'accessoire']
    };

    const targetKeywords = usageKeywords[finalUsage] || [];
    
    const scoredProducts = filtered.map(p => {
      let score = 0;
      const textToSearch = `${p.name} ${p.description || ''} ${p.category || ''}`.toLowerCase();
      targetKeywords.forEach(kw => {
        if (textToSearch.includes(kw)) {
          score += 1;
        }
      });
      return { product: p, score };
    });

    // Sort by score desc, then limit to top 3
    scoredProducts.sort((a, b) => b.score - a.score);
    const finalTop3 = scoredProducts.slice(0, 3).map(sp => sp.product);

    setResults(finalTop3);
    setStep(4);
  };

  const currency = settings?.currency || 'FCFA';

  return (
    <>
      {/* Quiz Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 text-center space-y-6 overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Step 0: Welcome Screen */}
              {step === 0 && (
                <div className="space-y-6 py-4">
                  <div className="w-16 h-16 rounded-[1.75rem] bg-violet-500/10 text-violet-500 dark:text-violet-400 flex items-center justify-center mx-auto border border-violet-500/25 shadow-lg shadow-violet-500/5">
                    <BrainCircuit size={28} className="animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      {lang === 'fr' ? 'AI Product Finder' : 'AI Product Finder'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed px-4">
                      {lang === 'fr' 
                        ? 'Trouvez l\'appareil parfait en répondant à 3 questions rapides !' 
                        : 'Answer 3 simple questions to find the absolute best device for your needs!'}
                    </p>
                  </div>
                  <button
                    onClick={startQuiz}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {lang === 'fr' ? 'Commencer le Quiz' : 'Start the Quiz'}
                  </button>
                </div>
              )}

              {/* Step 1: Category Selection */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-violet-500 dark:text-violet-400 tracking-widest uppercase">Étape 1 sur 3</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                      {lang === 'fr' ? 'Que recherchez-vous ?' : 'What are you looking for?'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {['Phones', 'Laptops', 'Watches', 'Accessories'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => selectCategory(cat)}
                        className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Budget selection */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-violet-500 dark:text-violet-400 tracking-widest uppercase">Étape 2 sur 3</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                      {lang === 'fr' ? 'Quel est votre budget ?' : 'What is your budget?'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={() => selectBudget('low')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Économique (< 200,000 FCFA)' : 'Budget (< 200,000 FCFA)'}
                    </button>
                    <button
                      onClick={() => selectBudget('mid')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Milieu de Gamme (200K - 500K)' : 'Mid-Range (200K - 500K)'}
                    </button>
                    <button
                      onClick={() => selectBudget('high')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Premium (> 500,000 FCFA)' : 'Premium (> 500,000 FCFA)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Usage Type Selection */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-violet-500 dark:text-violet-400 tracking-widest uppercase">Étape 3 sur 3</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                      {lang === 'fr' ? 'Quel est votre usage principal ?' : 'What is your primary use?'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={() => selectUsage('work')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Travail & Productivité' : 'Work & Productivity'}
                    </button>
                    <button
                      onClick={() => selectUsage('gaming')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-855 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Jeux & Haute Performance' : 'Gaming & High Performance'}
                    </button>
                    <button
                      onClick={() => selectUsage('luxury')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-855 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Style de Luxe & Haut de Gamme' : 'Luxury Style & Prestige'}
                    </button>
                    <button
                      onClick={() => selectUsage('casual')}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-855 dark:hover:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {lang === 'fr' ? 'Usage Quotidien & Loisirs' : 'Casual Daily & Entertainment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Results Screen */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-violet-500 dark:text-violet-400 tracking-widest uppercase">Résultats AI</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                      {lang === 'fr' ? 'Recommandations pour vous' : 'Best Matches for You'}
                    </h4>
                  </div>
                  
                  {results.length === 0 ? (
                    <p className="text-xs text-slate-550 dark:text-slate-400 py-6">
                      {lang === 'fr' 
                        ? 'Aucun produit ne correspond exactement à vos critères.' 
                        : 'No products match your exact criteria. Try widening your filters!'}
                    </p>
                  ) : (
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {results.map((product) => (
                        <div 
                          key={product.id}
                          className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-950/45 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all text-left"
                        >
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                            <img src={product.image_url || product.image || '/hero-banner.png'} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{product.name}</h5>
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 mt-0.5 block">
                              {product.price?.toLocaleString()} {currency}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              openGlobalLightbox?.(product);
                              handleClose();
                            }}
                            className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-slate-650 dark:text-white transition-all cursor-pointer shrink-0"
                            title="Quick view"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleOpen}
                    className="w-full py-3.5 bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    {lang === 'fr' ? 'Recommencer le Test' : 'Retake the Quiz'}
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
