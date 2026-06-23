import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  FileText, 
  Lock as LockIcon,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scale,
  Printer,
  Download,
  Share2
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const LegalPage = ({ type = 'privacy' }) => {
  const { settings } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const content = settings?.[`footer_content_${type}`] || `No ${type} content has been provided yet. Please contact support.`;
  
  const icons = {
    privacy: Shield,
    terms: Scale,
    security: LockIcon
  };
  
  const gradients = {
    privacy: 'from-blue-600 to-indigo-600',
    terms: 'from-emerald-600 to-teal-600',
    security: 'from-rose-600 to-orange-600'
  };
  
  const Icon = icons[type] || FileText;
  const activeGradient = gradients[type] || 'from-slate-600 to-slate-800';

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-eas-light dark:bg-eas-dark pt-32 pb-32 relative overflow-hidden transition-colors duration-1000">
      {/* ─── DYNAMIC BACKGROUND ELEMENTS ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br ${activeGradient} opacity-[0.03] blur-[100px] rounded-full`}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr ${activeGradient} opacity-[0.05] blur-[120px] rounded-full`}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* ─── TOP NAVIGATION ─── */}
        <div className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-6"
           >
              <button 
                onClick={() => navigate(-1)}
                className="w-14 h-14 rounded-2xl bg-white dark:bg-eas-dark/60 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-eas-blue hover:border-eas-blue hover:shadow-xl transition-all group"
              >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeGradient} animate-pulse`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Store Policy</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none drop-shadow-sm">
                   {t(type)}
                 </h1>
              </div>
           </motion.div>

           <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
           >
              <button className="p-4 rounded-xl bg-white dark:bg-eas-dark/60 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-eas-blue transition-all shadow-sm">
                <Printer size={18} />
              </button>
              <button className="p-4 rounded-xl bg-white dark:bg-eas-dark/60 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-eas-blue transition-all shadow-sm">
                <Share2 size={18} />
              </button>
              <button className={`flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${activeGradient} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-eas-blue/20 hover:scale-105 active:scale-95 transition-all`}>
                <Download size={18} />
                <span>Download PDF</span>
              </button>
           </motion.div>
        </div>

        {/* ─── MAIN CONTENT ARCHITECTURE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Side Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            <div className="bg-white dark:bg-eas-dark/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl">
               <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeGradient} flex items-center justify-center text-white shadow-lg mb-6`}>
                  <Icon size={32} />
               </div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Verification</h3>
               <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                 This document is a legally binding policy for <span className="text-slate-900 dark:text-white">{settings?.shopName || 'SWEETO HUB'}</span> and its users.
               </p>
               <div className="mt-8 pt-8 border-t border-slate-50 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={16} className="text-emerald-500" />
                     <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={16} className="text-emerald-500" />
                     <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Authorized</span>
                  </div>
               </div>
            </div>

            <div className="bg-eas-dark p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <HelpCircle size={60} className="text-white" />
               </div>
               <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Need Help?</h4>
               <p className="text-xs font-bold text-white/80 leading-relaxed mb-6">If you don't understand any of these terms, our legal team is here.</p>
               <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0043d0] hover:text-white transition-all shadow-lg">
                 Contact Legal
               </button>
            </div>
          </motion.div>

          {/* Right Column: Content Body */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-9"
          >
            <div className="bg-white dark:bg-eas-dark/60 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
               {/* Document Header Bar */}
               <div className="bg-slate-50/50 dark:bg-white/5 px-10 md:px-16 py-8 border-b border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-eas-blue/10 flex items-center justify-center text-eas-blue">
                        <FileText size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Document Version 2.0.1</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Released {new Date().toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <span className="px-3 py-1 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">Public</span>
                     <span className="px-3 py-1 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">Enforced</span>
                  </div>
               </div>

               {/* Document Content Area */}
               <div className="p-10 md:p-16">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                     <div className="text-slate-600 dark:text-slate-400 font-medium leading-[2.2] whitespace-pre-wrap text-base md:text-lg">
                       {content}
                     </div>
                  </div>

                  <div className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                       <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-r ${activeGradient} blur-lg opacity-40`} />
                          <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${activeGradient} flex items-center justify-center text-white shadow-xl`}>
                             <Shield size={20} />
                          </div>
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Security Verified</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Protected by SWEETO Security Systems</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">
                          © {new Date().getFullYear()} {settings?.shopName || 'SWEETO HUB'}
                       </span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Quick Navigation Footer */}
            <div className="mt-12 flex justify-center gap-10">
               {['privacy', 'terms', 'security'].filter(t => t !== type).map(otherType => (
                  <button 
                    key={otherType}
                    onClick={() => navigate(`/${otherType}`)}
                    className="group flex items-center gap-3"
                  >
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-eas-blue transition-colors">
                       Go to {otherType}
                     </span>
                     <ChevronRight size={14} className="text-slate-300 group-hover:text-eas-blue group-hover:translate-x-1 transition-all" />
                  </button>
               ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
