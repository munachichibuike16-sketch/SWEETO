import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, HelpCircle, Send } from 'lucide-react';

export default function FAQPanel({ lang, onClose, onAskQuestion }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqData = [
    {
      q: {
        en: "How do I track my order?",
        fr: "Comment suivre ma commande ?"
      },
      a: {
        en: "Go to the 'Order Tracking' page from the main menu and enter your Order ID, or view your history in the Account Dashboard.",
        fr: "Allez sur la page 'Suivi de commande' depuis le menu principal et entrez votre ID de commande, ou consultez votre historique dans le tableau de bord de votre compte."
      }
    },
    {
      q: {
        en: "What are your delivery times and zones?",
        fr: "Quels sont vos délais et zones de livraison ?"
      },
      a: {
        en: "We deliver across Abidjan (same-day or next-day) and nationwide. Delivery fees are dynamically calculated at checkout based on your exact zone.",
        fr: "Nous livrons dans tout Abidjan (le jour même ou le lendemain) et partout dans le pays. Les frais de livraison sont calculés dynamiquement lors du paiement en fonction de votre zone."
      }
    },
    {
      q: {
        en: "Is Cash on Delivery (COD) supported?",
        fr: "Le paiement à la livraison est-il pris en charge ?"
      },
      a: {
        en: "Yes! Cash on Delivery is supported for Abidjan and other major delivery zones. You can also pay via Wave or SweetoPay.",
        fr: "Oui ! Le paiement à la livraison est pris en charge pour Abidjan et d'autres grandes zones. Vous pouvez également payer via Wave ou SweetoPay."
      }
    },
    {
      q: {
        en: "What is your refund and return policy?",
        fr: "Quelle est votre politique de remboursement et de retour ?"
      },
      a: {
        en: "You can return eligible items within 7 to 15 days of delivery. Items must be in pristine, unused condition with all tags and seals intact.",
        fr: "Vous pouvez retourner les articles éligibles dans les 7 à 15 jours suivant la livraison. Les articles doivent être dans leur état d'origine, non utilisés, avec toutes les étiquettes et scellés intacts."
      }
    },
    {
      q: {
        en: "Can I modify or cancel my order?",
        fr: "Puis-je modifier ou annuler ma commande ?"
      },
      a: {
        en: "Orders can only be canceled or modified while their status is 'Pending'. Once processing begins, we cannot make any changes.",
        fr: "Les commandes ne peuvent être annulées ou modifiées que lorsque leur statut est 'En attente'. Une fois le traitement commencé, nous ne pouvons effectuer aucun changement."
      }
    },
    {
      q: {
        en: "How do I apply a promo code?",
        fr: "Comment appliquer un code promo ?"
      },
      a: {
        en: "Enter your promo code in the 'Promo Code' field on the checkout screen and click 'Apply' before finalizing your payment.",
        fr: "Entrez votre code promo dans le champ 'Code Promo' sur l'écran de paiement et cliquez sur 'Appliquer' avant de finaliser votre paiement."
      }
    }
  ];

  const filteredFaqs = faqData.filter(item => {
    const question = (item.q[lang] || item.q['en']).toLowerCase();
    const answer = (item.a[lang] || item.a['en']).toLowerCase();
    const query = searchQuery.toLowerCase();
    return question.includes(query) || answer.includes(query);
  });

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-955/20">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-[#0084FF]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {lang === 'fr' ? 'Questions Fréquentes' : 'Frequently Asked'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-655 dark:hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-855 shrink-0 bg-white dark:bg-slate-900">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'fr' ? 'Rechercher une question...' : 'Search FAQ...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50/30 dark:bg-slate-950/5">
        {filteredFaqs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
            {lang === 'fr' ? 'Aucune question trouvée' : 'No results found'}
          </div>
        ) : (
          filteredFaqs.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const qText = item.q[lang] || item.q['en'];
            const aText = item.a[lang] || item.a['en'];

            return (
              <div
                key={idx}
                className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700"
              >
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer select-none"
                >
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 pr-3 leading-snug">
                    {qText}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-slate-400"
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-850/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                        <p>{aText}</p>
                        
                        {onAskQuestion && (
                          <button
                            onClick={() => onAskQuestion(qText)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-[#0084FF] hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all font-black text-[9px] uppercase tracking-wider cursor-pointer border border-[#0084FF]/10 active:scale-95"
                          >
                            <Send size={10} />
                            <span>{lang === 'fr' ? 'Poser cette question' : 'Ask about this'}</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
