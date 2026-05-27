import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import './AuthPage.css';

const AuthPage = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const { showToast, settings } = useStore();
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: false });
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    countryCode: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });

  const africanCountries = [
    { name: "Algeria", code: "+213" }, { name: "Angola", code: "+244" }, { name: "Benin", code: "+229" },
    { name: "Botswana", code: "+267" }, { name: "Burkina Faso", code: "+226" }, { name: "Burundi", code: "+257" },
    { name: "Cameroon", code: "+237" }, { name: "Cape Verde", code: "+238" }, { name: "Central African Republic", code: "+236" },
    { name: "Chad", code: "+235" }, { name: "Comoros", code: "+269" }, { name: "Congo", code: "+242" },
    { name: "DR Congo", code: "+243" }, { name: "Djibouti", code: "+253" }, { name: "Egypt", code: "+20" },
    { name: "Equatorial Guinea", code: "+240" }, { name: "Eritrea", code: "+291" }, { name: "Eswatini", code: "+268" },
    { name: "Ethiopia", code: "+251" }, { name: "Gabon", code: "+241" }, { name: "Gambia", code: "+220" },
    { name: "Ghana", code: "+233" }, { name: "Guinea", code: "+224" }, { name: "Guinea-Bissau", code: "+245" },
    { name: "Ivory Coast", code: "+225" }, { name: "Kenya", code: "+254" }, { name: "Lesotho", code: "+266" },
    { name: "Liberia", code: "+231" }, { name: "Libya", code: "+218" }, { name: "Madagascar", code: "+261" },
    { name: "Malawi", code: "+265" }, { name: "Mali", code: "+223" }, { name: "Mauritania", code: "+222" },
    { name: "Mauritius", code: "+230" }, { name: "Morocco", code: "+212" }, { name: "Mozambique", code: "+258" },
    { name: "Namibia", code: "+264" }, { name: "Niger", code: "+227" }, { name: "Nigeria", code: "+234" },
    { name: "Rwanda", code: "+250" }, { name: "Senegal", code: "+221" }, { name: "Seychelles", code: "+248" },
    { name: "Sierra Leone", code: "+232" }, { name: "Somalia", code: "+252" }, { name: "South Africa", code: "+27" },
    { name: "South Sudan", code: "+211" }, { name: "Sudan", code: "+249" }, { name: "Tanzania", code: "+255" },
    { name: "Togo", code: "+228" }, { name: "Tunisia", code: "+216" }, { name: "Uganda", code: "+256" },
    { name: "Zambia", code: "+260" }, { name: "Zimbabwe", code: "+263" }
  ];

  const switchTab = (tab) => {
    setCurrentTab(tab);
    setErrors({});
  };

  const togglePassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    const { email, password } = loginData;
    let newErrors = {};

    if (!email) newErrors.loginEmail = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.loginEmail = 'Invalid email address.';
    if (!password) newErrors.loginPassword = 'Please enter your password.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setErrors({ loginEmail: 'No account found with this email.' });
        showToast('Account not found. Please sign up first.', 'error');
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        setErrors({ loginPassword: 'Incorrect password.' });
        showToast('Incorrect password.', 'error');
        setLoading(false);
        return;
      }

      const { password: _, ...safeUser } = user;
      localStorage.setItem('sweetohub_session', JSON.stringify(safeUser));
      if (loginData.rememberMe) localStorage.setItem('sweetohub_remembered_email', email);
      else localStorage.removeItem('sweetohub_remembered_email');

      showToast(`Welcome back, ${user.name}! ⚡`, 'success');
      setLoading(false);
      setTimeout(() => navigate('/'), 1200);
    }, 1000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    const { name, email, countryCode, phone, password, confirmPassword } = signupData;
    let newErrors = {};

    if (!name || name.length < 2) newErrors.signupName = 'Name too short.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.signupEmail = 'Invalid email.';
    if (!countryCode) newErrors.signupPhone = 'Select code.';
    if (!phone || !/^[0-9\s]+$/.test(phone) || phone.replace(/\s/g, '').length < 7) newErrors.signupPhone = 'Invalid phone.';
    if (!password || password.length < 8) newErrors.signupPassword = 'Min. 8 characters.';
    if (password !== confirmPassword) newErrors.signupConfirmPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      setErrors({ signupEmail: 'Email already registered.' });
      showToast('Email already exists. Please log in.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser = {
        id: 'user_' + Date.now(),
        name,
        email: email.toLowerCase(),
        phoneCountryCode: countryCode,
        phoneNumber: phone.replace(/\s/g, ''),
        password,
        createdAt: new Date().toISOString(),
        provider: 'email'
      };
      users.push(newUser);
      localStorage.setItem('sweetohub_users', JSON.stringify(users));
      
      const { password: _, ...safeUser } = newUser;
      localStorage.setItem('sweetohub_session', JSON.stringify(safeUser));

      showToast(`Welcome to SWEETO-HUB, ${name}! ⚡`, 'success');
      setLoading(false);
      setTimeout(() => navigate('/'), 1200);
    }, 1000);
  };

  // ============================================
  // GOOGLE SIGN-IN INTEGRATION
  // ============================================
  // REPLACE THIS WITH YOUR REAL CLIENT ID FROM GOOGLE CLOUD CONSOLE
  const GOOGLE_CLIENT_ID = '869701747796-smfrr2fte1uv0t8dsebll4gvumkrjdv7.apps.googleusercontent.com';

  useEffect(() => {
    // Initialize Google Identity Services on mount
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup'
        });

        // Render the official button in the visible placeholder
        const placeholder = document.getElementById('google-button-official');
        if (placeholder) {
          window.google.accounts.id.renderButton(
            placeholder,
            { 
              theme: 'outline', 
              size: 'large', 
              width: '320', 
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left'
            }
          );
          setGoogleLoaded(true);
        }
      }
    };

    // Load script if not already there
    if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogle, 150);
    }
  }, []);

  const handleGoogleSignIn = () => {
    if (typeof window.google !== 'undefined' && window.google.accounts && window.google.accounts.id) {
      // First try to trigger the rendered button (most reliable for "Choose Account")
      const hiddenBtn = document.getElementById('google-button-hidden');
      if (hiddenBtn && hiddenBtn.querySelector('[role="button"]')) {
        hiddenBtn.querySelector('[role="button"]').click();
      } else {
        // Fallback to prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google Prompt not displayed, checking script status...');
            setTimeout(() => {
               if (!localStorage.getItem('sweetohub_session')) {
                 handleGoogleDemoFallback();
               }
            }, 3000); // Give it more time
          }
        });
      }
    } else {
      handleGoogleDemoFallback();
    }
  };

  const handleGoogleCredentialResponse = (response) => {
    // This decodes the JWT token returned by Google
    const parseJwt = (token) => {
      try {
        return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      } catch (e) { return null; }
    };

    const payload = parseJwt(response.credential);
    if (payload) {
      const googleUser = {
        id: payload.sub,
        name: payload.name || 'Google User',
        email: payload.email,
        picture: payload.picture,
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      let existing = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
      
      if (!existing) {
        users.push({ ...googleUser, password: null });
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
        existing = googleUser;
      }
      
      localStorage.setItem('sweetohub_session', JSON.stringify(existing));
      showToast(`Welcome, ${existing.name}!`, 'success');
      setTimeout(() => navigate('/'), 1200);
    }
  };

  const handleGoogleDemoFallback = () => {
    showToast('🔷 Demo Mode: Simulating Google Login...', 'info');
    setTimeout(() => {
      const demoUser = {
        id: 'google_demo_' + Date.now(),
        name: 'Sweeto User',
        email: 'sweeto.user@gmail.com',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      let existing = users.find(u => u.email === demoUser.email);
      if (!existing) {
        users.push({ ...demoUser, password: null });
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
        existing = demoUser;
      }
      localStorage.setItem('sweetohub_session', JSON.stringify(existing));
      showToast(`Welcome, ${existing.name}! (Demo)`, 'success');
      setTimeout(() => navigate('/'), 1200);
    }, 1500);
  };

  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) setSessionUser(session);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sweetohub_session');
    setSessionUser(null);
    showToast('Logged out successfully.', 'info');
    navigate('/');
  };

  if (sessionUser) {
    return (
      <div className="auth-body">
        <span className="candy-decoration">⚡</span>
        <span className="candy-decoration">💻</span>
        <span className="candy-decoration">📱</span>
        <span className="candy-decoration">✨</span>
        <span className="candy-decoration" style={{ top: '20%', left: '15%' }}>💖</span>
        <span className="candy-decoration" style={{ bottom: '20%', right: '15%' }}>🚀</span>
        
        <div className="main-container">
          <div className="auth-card" style={{ maxWidth: '600px' }}>
            <div className="card-content">
              <div className="brand-section">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-glow"></div>
                  <div className="brand-icon profile-main-avatar">
                    {sessionUser.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h1 className="brand-name" style={{ fontSize: '2.2rem', marginTop: '1rem' }}>
                  {t('hello') || 'Hello'}, {sessionUser.name?.split(' ')[0]}! 👋
                </h1>
                <p className="brand-tagline" style={{ letterSpacing: '1px' }}>{sessionUser.email}</p>
              </div>

              <div className="profile-dashboard">
                <div className="profile-grid">
                  <div className="profile-stat-box adorable-card">
                    <div className="stat-icon-circle"><i className="fas fa-calendar-alt"></i></div>
                    <span className="stat-label">{t('member_since') || 'Member Since'}</span>
                    <span className="stat-value">{new Date(sessionUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="profile-stat-box adorable-card">
                    <div className="stat-icon-circle" style={{ background: '#e0f2fe', color: '#0ea5e9' }}><i className="fas fa-shield-alt"></i></div>
                    <span className="stat-label">{t('security') || 'Security'}</span>
                    <span className="stat-value uppercase">{sessionUser.provider || 'Verified'}</span>
                  </div>
                </div>

                <div className="quick-links">
                  <div className="quick-link-item" onClick={() => navigate('/')}>
                    <div className="ql-icon"><i className="fas fa-shopping-cart"></i></div>
                    <div className="ql-text">
                      <span className="ql-title">{t('continue_shopping') || 'Continue Shopping'}</span>
                      <span className="ql-desc">{t('explore_premium_arrivals') || 'Explore our latest premium arrivals'}</span>
                    </div>
                    <i className="fas fa-chevron-right ql-arrow"></i>
                  </div>
                  <div className="quick-link-item" onClick={() => navigate('/wishlist')}>
                    <div className="ql-icon" style={{ background: '#fdf2f8', color: '#ec4899' }}><i className="fas fa-heart"></i></div>
                    <div className="ql-text">
                      <span className="ql-title">{t('my_wishlist') || 'My Wishlist'}</span>
                      <span className="ql-desc">{t('check_saved_items') || 'Check the items you saved for later'}</span>
                    </div>
                    <i className="fas fa-chevron-right ql-arrow"></i>
                  </div>
                </div>

                <div className="profile-actions" style={{ marginTop: '2rem' }}>
                  <button className="btn-google logout-btn-adorable" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> &nbsp; {t('secure_sign_out') || 'Secure Sign Out'}
                  </button>
                </div>
              </div>
              
              <div className="auth-footer-text" style={{ marginTop: '2rem', opacity: 0.7 }}>
                {t('premium_experience_by') || 'Premium Experience by'} <strong>SWEETO-HUB</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-body">
      {/* Floating tech-themed decorations */}
      <span className="candy-decoration">⚡</span>
      <span className="candy-decoration">💻</span>
      <span className="candy-decoration">📱</span>
      <span className="candy-decoration">🔌</span>
      <span className="candy-decoration">🖥️</span>
      <span className="candy-decoration">🔋</span>
      <span className="candy-decoration">🎧</span>
      <span className="candy-decoration">✨</span>

      <div className="main-container">
        <div className="auth-card">
          <div className="card-content">
            <div className="brand-section">
              <div className="brand-icon">⚡</div>
              <h1 className="brand-name">SWEETO-HUB</h1>
              <p className="brand-tagline">{t('powering_digital_life') || 'Powering Your Digital Life'}</p>
            </div>

            <div className="tab-switcher">
              <button 
                className={`tab-btn ${currentTab === 'login' ? 'active' : ''}`} 
                onClick={() => switchTab('login')}
              >
                <i className="fas fa-sign-in-alt"></i> &nbsp;{t('login') || 'Login'}
              </button>
              <button 
                className={`tab-btn ${currentTab === 'signup' ? 'active' : ''}`} 
                onClick={() => switchTab('signup')}
              >
                <i className="fas fa-user-plus"></i> &nbsp;{t('sign_up') || 'Sign Up'}
              </button>
            </div>

            <div className="form-container">
              {currentTab === 'login' ? (
                <div className="form-panel active">
                  <form onSubmit={handleLogin} noValidate>
                    <div className="input-group">
                      <label>{t('email_address') || 'Email Address'}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input 
                          type="email" 
                          placeholder={t('email_placeholder') || "you@example.com"} 
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          className={errors.loginEmail ? 'input-error' : ''}
                        />
                      </div>
                      <div className="error-message">{errors.loginEmail}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('password') || 'Password'}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-lock input-icon"></i>
                        <input 
                          type={showPassword.login ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className={errors.loginPassword ? 'input-error' : ''}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('login')}>
                          <i className={`fas ${showPassword.login ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.loginPassword}</div>
                    </div>
                    <div className="options-row">
                      <label className="remember-me">
                        <input 
                          type="checkbox" 
                          checked={loginData.rememberMe}
                          onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})}
                        />
                        <span className="custom-checkbox"><i className="fas fa-check"></i></span>
                        {t('remember_me') || 'Remember me'}
                      </label>
                      <a className="forgot-link" onClick={() => showToast('Reset link sent!', 'success')}>{t('forgot_password') || 'Forgot Password?'}</a>
                    </div>
                    <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                      <span className="btn-text">{t('login_account') || 'Login to Your Account'}</span>
                      <span className="spinner"></span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="form-panel active">
                  <form onSubmit={handleSignup} noValidate>
                    <div className="input-group">
                      <label>{t('full_name') || 'Full Name'}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input 
                          type="text" 
                          placeholder={t('name_placeholder') || "Jane Doe"} 
                          value={signupData.name}
                          onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                          className={errors.signupName ? 'input-error' : ''}
                        />
                      </div>
                      <div className="error-message">{errors.signupName}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('email_address') || 'Email Address'}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input 
                          type="email" 
                          placeholder={t('email_placeholder') || "you@example.com"} 
                          value={signupData.email}
                          onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                          className={errors.signupEmail ? 'input-error' : ''}
                        />
                      </div>
                      <div className="error-message">{errors.signupEmail}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('phone_number') || 'Phone Number'}</label>
                      <div className="phone-row">
                        <select 
                          value={signupData.countryCode}
                          onChange={(e) => setSignupData({...signupData, countryCode: e.target.value})}
                          className={errors.signupPhone ? 'input-error' : ''}
                        >
                          <option value="">{t('select_code') || 'Select code'}</option>
                          {africanCountries.map(c => (
                            <option key={c.name} value={c.code}>{c.code} {c.name}</option>
                          ))}
                        </select>
                        <input 
                          type="tel" 
                          placeholder="Phone number" 
                          value={signupData.phone}
                          onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                          className={errors.signupPhone ? 'input-error' : ''}
                        />
                      </div>
                      <div className="error-message">{errors.signupPhone}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('password') || 'Password'}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-lock input-icon"></i>
                        <input 
                          type={showPassword.signup ? 'text' : 'password'} 
                          placeholder={t('min_8_chars') || "Min. 8 characters"} 
                          value={signupData.password}
                          onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                          className={errors.signupPassword ? 'input-error' : ''}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('signup')}>
                          <i className={`fas ${showPassword.signup ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.signupPassword}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('confirm_password') || 'Confirm Password'}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-shield-halved input-icon"></i>
                        <input 
                          type={showPassword.confirm ? 'text' : 'password'} 
                          placeholder={t('re_enter_password') || "Re-enter password"} 
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                          className={errors.signupConfirmPassword ? 'input-error' : ''}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('confirm')}>
                          <i className={`fas ${showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.signupConfirmPassword}</div>
                    </div>
                    <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                      <span className="btn-text">{t('create_account') || 'Create Your Account'}</span>
                      <span className="spinner"></span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Native Google Identity Services Button Container */}
            <div className="w-full flex justify-center items-center min-h-[46px] my-2">
              <div id="google-button-official" className="w-full flex justify-center"></div>
            </div>

            {/* Fallback button if Google script is blocked or still loading */}
            {!googleLoaded && (
              <button className="btn-google" onClick={handleGoogleDemoFallback}>
                <svg className="google-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('continue_google') || 'Continue with Google'}
              </button>
            )}

            <p className="auth-footer-text">
              {t('agree_terms') || "By continuing, you agree to SWEETO-HUB's"}
              <a href="#">{t('terms') || 'Terms'}</a> &
              <a href="#">{t('privacy_policy') || 'Privacy Policy'}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
