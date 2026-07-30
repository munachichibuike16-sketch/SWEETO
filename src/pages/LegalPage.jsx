import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  FileText, 
  Lock as LockIcon,
  CheckCircle2,
  Clock,
  List,
  ChevronRight,
  RefreshCw,
  Scale
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_VERSION } from '../utils/version';

const LegalPage = ({ type = 'privacy' }) => {
  const { settings } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const defaultContent = {
    privacy: `At SWEETO HUB, we respect your privacy and are committed to protecting your personal data.

1. INFORMATION WE COLLECT
We collect personal information that you provide to us when placing an order, creating an account, or contacting support. This includes your name, email address, delivery address, phone number, and purchase history.

2. HOW WE USE YOUR INFORMATION
We use your information exclusively to:
• Process, verify, and ship your premium tech orders.
• Provide real-time delivery status updates and customer care.
• Customize your user experience and language preferences.
• Prevent fraud and ensure security.

3. COOKIES & TRACKING
We use secure cookies to keep track of your shopping cart items, current language preferences, and account session states.

4. THIRD-PARTY SHARING
We do not sell your personal data. We only share necessary details with verified third-party payment gateways and shipping partners required to complete your transactions.

5. YOUR RIGHTS
Under applicable laws, you have the right to request access, correction, or deletion of your personal data stored with us at any time.`,

    terms: `Welcome to SWEETO HUB. These Terms & Conditions govern your use of our premium web platform.

1. ACCEPTANCE OF TERMS
By accessing or purchasing from SWEETO HUB, you agree to comply with and be bound by these terms. If you do not agree, please do not use our services.

2. STORE TRANSACTIONS
• Product availability, pricing, and promotional codes are subject to change without notice.
• All payment transactions are routed through encrypted gateways. We reserve the right to cancel or hold orders that fail security checks.
• Prices are displayed in your local currency (XOF, USD, etc.) as set by the store settings.

3. SHIPPING & RETURNS
• Delivery estimates are provided during checkout. SWEETO HUB is not liable for custom delays or transport events beyond our control.
• We offer a premium 14-day exchange warranty for verified defective items. Please contact our support team to initiate a return.

4. INTELLECTUAL PROPERTY
All website logos, circular branding animations, images, text, design layouts, and codebases are the exclusive intellectual property of SWEETO HUB.

5. ACCESSIBILITY & CONDUCT
Users are prohibited from attempting to bypass site security, upload malicious scripts, or scrape database contents.`,

    security: `Security is at the heart of SWEETO HUB. We deploy tech-luxury protection systems to safeguard your account and transaction history.

1. DATA ENCRYPTION & SSL
All communication between your browser and our servers is fully encrypted using industry-standard SSL/TLS 1.3 protocols, preventing interception of sensitive details.

2. SECURE AUTHENTICATION
• Administrative accounts use secure JWT (JSON Web Tokens) for authentication.
• User sessions are protected against Cross-Site Request Forgery (CSRF) and session-jacking attempts.

3. DATABASE & STORAGE SECURITY
• Customer databases are secured with strict access controls. 
• Payment processing is PCI-DSS compliant. Card details are processed directly by payment networks and are never stored on our local database.

4. ACCOUNT SECURITY RECOMMENDATIONS
We advise all users to use strong, unique passwords and sign out of their accounts when using shared or public devices.

5. VULNERABILITY MONITORING
Our servers undergo regular automated security scans to detect, block, and mitigate potential threats, keeping your shopping experience safe and uninterrupted.`,

    refund: `At SWEETO HUB, we want you to have a premium shopping experience. We follow a clear, consumer-first refund and return framework to ensure fairness and efficiency.

1. RETURN TIMELINE
• Most items purchased on SWEETO HUB are eligible for return within 7 to 15 days from the delivery date, depending on the product category.
• Premium tech devices, certified electronic products, and promotional drop items are eligible for returns within 7 days.
• Items marked as "Non-Returnable" cannot be returned.

2. RETURN CONDITIONS & QUALITY CHECKS
To qualify for a refund, returned items must comply with the following:
• Pristine, unused condition with all tags and protective seals intact.
• Packaged in their original box/packaging, including all manuals, documentation, accessories, and promotional freebies that were included.
• Sealed products (like phones, tablets, smartwatches, or laptops) must remain unopened. If the manufacturer's seal is broken, we cannot accept change-of-mind returns.
• Defective or damaged items must be reported immediately upon delivery.

3. QUALITY EVALUATION PROCESS
• Once you initiate a return, we arrange for pickup or drop-off at a verified hub.
• Returned products undergo a strict Quality Evaluation Check at our diagnostic facility. This process typically takes between 1 to 5 business days from receipt.

4. REFUND METHOD & TIMELINES
Following a successful quality evaluation, your refund will be processed:
• SweetoPay / Digital Wallet: Refund is credited within 24 to 48 hours.
• Mobile Money / Bank Transfer: Refund is processed within 5 to 7 business days.
• Credit/Debit Card: Refund is initiated instantly but may take up to 10-15 business days depending on your bank's clearance policy.

5. HOW TO REQUEST A RETURN
To request a return, go to your Orders page, select the item you wish to return, click "Request Return", and fill out the details. Alternatively, contact our support team.`
  };

  const rawContent = settings?.[`footer_content_${type}`] || defaultContent[type] || `No ${type} content has been provided yet. Please contact support.`;
  
  const icons = {
    privacy: Shield,
    terms: Scale,
    security: LockIcon,
    refund: RefreshCw
  };
  
  const Icon = icons[type] || FileText;

  // Parse rawContent into sections
  const { preamble, sections } = useMemo(() => {
    const lines = rawContent.split('\n');
    const parsedSections = [];
    const parsedPreamble = [];
    let currentSection = null;

    for (let line of lines) {
      const match = line.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        if (currentSection) {
          parsedSections.push(currentSection);
        }
        currentSection = {
          id: `section-${match[1]}`,
          number: match[1],
          title: match[2],
          paragraphs: []
        };
      } else {
        if (currentSection) {
          if (line.trim()) {
             currentSection.paragraphs.push(line.trim());
          }
        } else {
          if (line.trim()) {
             parsedPreamble.push(line.trim());
          }
        }
      }
    }
    if (currentSection) {
      parsedSections.push(currentSection);
    }
    return { preamble: parsedPreamble, sections: parsedSections };
  }, [rawContent]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 sm:pt-28 pb-16 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1a1a2e] to-[#16213e] rounded-[24px] p-8 sm:p-12 md:p-14 mb-8 overflow-hidden shadow-lg">
          {/* Decorative background element */}
          <div className="absolute -top-1/2 -right-1/4 w-[400px] h-[400px] bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 backdrop-blur-md rounded-2xl mb-6 text-indigo-400">
              <Icon size={32} />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              {t(type) || type.toUpperCase()}
            </h1>
            
            <div className="text-white/70 max-w-2xl text-sm sm:text-base leading-relaxed space-y-2">
              {preamble.length > 0 ? (
                preamble.map((p, idx) => <p key={idx}>{p}</p>)
              ) : (
                <p>Please read this document carefully before using our platform. By accessing or using our services, you agree to be bound by these terms.</p>
              )}
            </div>
            
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-semibold mt-6">
              <CheckCircle2 size={14} />
              Effective {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#0b0f19] rounded-xl border border-slate-100 dark:border-slate-800/60 mb-8 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
          <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>Last Updated: <strong className="text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
        </div>

        {/* Table of Contents */}
        {sections.length > 0 && (
          <div className="bg-white dark:bg-[#0b0f19] rounded-[20px] p-6 sm:p-8 border border-slate-100 dark:border-slate-800/60 mb-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mb-4">
              <List size={18} className="text-indigo-600 dark:text-indigo-400" />
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {sections.map((sec) => (
                <a 
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-[13px] text-slate-600 dark:text-slate-300 font-medium no-underline"
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[20px]">{sec.number}.</span>
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Terms Content */}
        <div className="bg-white dark:bg-[#0b0f19] rounded-[20px] p-6 sm:p-8 md:p-12 border border-slate-100 dark:border-slate-800/60 mb-8 shadow-sm">
          {sections.length > 0 ? (
            sections.map((sec, idx) => (
              <div 
                key={sec.id} 
                id={sec.id}
                className={`mb-8 pb-8 ${idx !== sections.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/60' : 'mb-0 pb-0'} scroll-mt-24`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {sec.number}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {sec.title}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {sec.paragraphs.map((p, pIdx) => {
                    // Check if paragraph is a bullet point
                    if (p.startsWith('•') || p.startsWith('-')) {
                      return (
                        <div key={pIdx} className="flex gap-2 pl-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">▸</span>
                          <span>{p.substring(1).trim()}</span>
                        </div>
                      );
                    }
                    // Check if paragraph is a special highlight box note
                    if (p.toLowerCase().includes('important') || p.toLowerCase().includes('note:')) {
                       return (
                         <div key={pIdx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border-l-4 border-indigo-600 my-4">
                           <span className="font-bold text-slate-900 dark:text-white block mb-1 text-[13px]">
                             ℹ️ Important Note
                           </span>
                           <p className="text-[13px] text-slate-600 dark:text-slate-400 m-0">{p.replace(/important:|note:/i, '').trim()}</p>
                         </div>
                       );
                    }
                    
                    return (
                      <p key={pIdx} className="text-sm text-slate-600 dark:text-slate-400 leading-[1.8]">
                        {p}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{rawContent}</p>
            </div>
          )}
        </div>

        {/* Acceptance Section (Only for terms/privacy) */}
        {(type === 'terms' || type === 'privacy') && (
          <div className="bg-white dark:bg-[#0b0f19] rounded-[20px] p-6 sm:p-8 border border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center md:text-left">
              By continuing to use our platform, you acknowledge that you have read and <strong className="text-slate-900 dark:text-white">agree to these {type}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto text-center"
              >
                Decline & Leave
              </button>
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,70,229,0.4)] transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2"
              >
                Accept Terms
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LegalPage;
