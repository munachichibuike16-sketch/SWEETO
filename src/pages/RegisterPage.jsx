import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Phone,
  Globe,
  ChevronDown,
  X,
  Search,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

/* ── African country codes (54 countries) ── */
const AFRICAN_COUNTRIES = [
  { name: 'Algeria', code: '+213', flag: '🇩🇿' },
  { name: 'Angola', code: '+244', flag: '🇦🇴' },
  { name: 'Benin', code: '+229', flag: '🇧🇯' },
  { name: 'Botswana', code: '+267', flag: '🇧🇼' },
  { name: 'Burkina Faso', code: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: '+257', flag: '🇧🇮' },
  { name: 'Cabo Verde', code: '+238', flag: '🇨🇻' },
  { name: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { name: 'Central African Republic', code: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: '+235', flag: '🇹🇩' },
  { name: 'Comoros', code: '+269', flag: '🇰🇲' },
  { name: 'Congo (DRC)', code: '+243', flag: '🇨🇩' },
  { name: 'Congo (Republic)', code: '+242', flag: '🇨🇬' },
  { name: "Côte d'Ivoire", code: '+225', flag: '🇨🇮' },
  { name: 'Djibouti', code: '+253', flag: '🇩🇯' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Equatorial Guinea', code: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: '+291', flag: '🇪🇷' },
  { name: 'Eswatini', code: '+268', flag: '🇸🇿' },
  { name: 'Ethiopia', code: '+251', flag: '🇪🇹' },
  { name: 'Gabon', code: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: '+220', flag: '🇬🇲' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Guinea', code: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: '+245', flag: '🇬🇼' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Lesotho', code: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: '+231', flag: '🇱🇷' },
  { name: 'Libya', code: '+218', flag: '🇱🇾' },
  { name: 'Madagascar', code: '+261', flag: '🇲🇬' },
  { name: 'Malawi', code: '+265', flag: '🇲🇼' },
  { name: 'Mali', code: '+223', flag: '🇲🇱' },
  { name: 'Mauritania', code: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: '+230', flag: '🇲🇺' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦' },
  { name: 'Mozambique', code: '+258', flag: '🇲🇿' },
  { name: 'Namibia', code: '+264', flag: '🇳🇦' },
  { name: 'Niger', code: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Rwanda', code: '+250', flag: '🇷🇼' },
  { name: 'Sao Tome and Principe', code: '+239', flag: '🇸🇹' },
  { name: 'Senegal', code: '+221', flag: '🇸🇳' },
  { name: 'Seychelles', code: '+248', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: '+232', flag: '🇸🇱' },
  { name: 'Somalia', code: '+252', flag: '🇸🇴' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'South Sudan', code: '+211', flag: '🇸🇸' },
  { name: 'Sudan', code: '+249', flag: '🇸🇩' },
  { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
  { name: 'Togo', code: '+228', flag: '🇹🇬' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳' },
  { name: 'Uganda', code: '+256', flag: '🇺🇬' },
  { name: 'Zambia', code: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: '+263', flag: '🇿🇼' },
];

const CountryCodeSelect = ({ selected, setSelected }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = AFRICAN_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const selectedCountry = AFRICAN_COUNTRIES.find((c) => c.code === selected) || AFRICAN_COUNTRIES[38]; // default Nigeria

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 w-full justify-between hover:border-slate-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{selectedCountry.flag}</span>
          <span>{selectedCountry.code}</span>
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 flex flex-col"
          >
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs font-bold rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelected(country.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors ${
                    selected === country.code ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="truncate">{country.name}</span>
                  <span className="ml-auto text-xs font-black text-slate-400">{country.code}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="p-4 text-xs text-slate-400 text-center">No country found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+234'); // default Nigeria
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ── Dummy submit handler ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(
        isSignUp
          ? `Account created for ${email || 'email-less'} at ${countryCode} ${phone}`
          : `Logged in as ${email}`
      );
    }, 1500);
  };

  /* ── Google OAuth handler (replace with real integration) ── */
  const handleGoogleLogin = () => {
    // In production, use @react-oauth/google or firebase auth
    // For now, simulate a popup / redirect
    alert('Google Sign-In triggered.\nIntegrate with your OAuth client ID.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 bg-slate-900 text-white rounded-2xl items-center justify-center shadow-xl mb-2">
              <Lock size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {isSignUp ? 'Join SWEETO HUB today' : 'Sign in to your account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Phone Number (only on sign up) */}
            {isSignUp && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  Phone Number (optional)
                </label>
                <div className="flex gap-2">
                  <div className="w-[40%]">
                    <CountryCodeSelect
                      selected={countryCode}
                      setSelected={setCountryCode}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="8012345678"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                    />
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-1.5">
                  We'll use this for delivery updates only.
                </p>
              </div>
            )}

            {/* Terms checkbox (sign up) */}
            {isSignUp && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={() => setAgreed(!agreed)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  required
                />
                <span className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="underline hover:text-slate-900 transition-colors">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="underline hover:text-slate-900 transition-colors">
                    Privacy Policy
                  </a>
                </span>
              </label>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs font-black uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-400">or continue with</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-black text-xs uppercase tracking-widest hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            {/* Google logo */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="22"
              height="22"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Toggle between Sign In / Sign Up */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <span className="underline">Sign In</span>
                </>
              ) : (
                <>
                  Don’t have an account?{' '}
                  <span className="underline">Sign Up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;