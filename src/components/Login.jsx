import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { API_BASE } from '../config';

// Helper to generate a random 6-character captcha code
const generateRandomCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // Avoid confusing chars like O, 0, I, l
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Password complexity validation
const validatePasswordComplexity = (pwd) => {
  if (pwd.length < 7) {
    return 'Password must be at least 7 characters long.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
    return 'Password must contain at least one special character.';
  }
  return '';
};

export default function Login({ onLoginSuccess, isDark, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  
  // Input fields state
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // Holds email address
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Generated captcha code state
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Handle email verification redirect query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    if (verified === 'success') {
      setSuccessMsg('Email verified successfully! You can now log in.');
      setActiveTab('login');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (verified === 'invalid') {
      setError('Invalid or expired verification link.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (verified === 'error') {
      setError('An error occurred during email verification.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initialize/Refresh Captcha when component loads or tab changes
  useEffect(() => {
    if (activeTab === 'signup') {
      setGeneratedCaptcha(generateRandomCaptcha());
      setCaptchaInput('');
    }
    setError('');
    setSuccessMsg('');
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (activeTab === 'signup') {
      // Make every field compulsory
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }
      if (!username.trim()) {
        setError("Email Address is required.");
        return;
      }
      if (!password) {
        setError("Password is required.");
        return;
      }
      if (!confirmPassword) {
        setError("Confirm Password is required.");
        return;
      }
      if (!captchaInput.trim()) {
        setError("Captcha Code is required.");
        return;
      }

      // 0. Email domain check
      if (!username.toLowerCase().endsWith('@semcogroups.com')) {
        setError("Domain Name incorrect");
        return;
      }

      // 1. Password complexity check
      const complexityError = validatePasswordComplexity(password);
      if (complexityError) {
        setError(complexityError);
        return;
      }

      // 2. Matching password check
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter them correctly.");
        return;
      }

      // 3. Captcha check (case-sensitive)
      if (captchaInput.trim() !== generatedCaptcha) {
        setError("Invalid Captcha code. Please enter the correct code shown.");
        // Regenerate captcha on failure
        setGeneratedCaptcha(generateRandomCaptcha());
        setCaptchaInput('');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = activeTab === 'login' ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const bodyPayload = activeTab === 'login' 
        ? { username, password } 
        : { name, username, password }; // Username is the email input

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (activeTab === 'login' ? 'Login failed' : 'Registration failed'));
      }

      if (activeTab === 'signup') {
        setSuccessMsg('Registration successful! Verification email sent.');
        setRegisteredEmail(username);
        // Clear forms
        setName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setCaptchaInput('');
        
        setTimeout(() => {
          setVerificationRequired(true);
        }, 1500);
      } else {
        onLoginSuccess(data.token, data.user.role, data.user.username, data.user.name);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please verify connection.');
      if (activeTab === 'signup') {
        // Refresh captcha on registration failures
        setGeneratedCaptcha(generateRandomCaptcha());
        setCaptchaInput('');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationRequired) {
    return (
      <div className="login-container">
        {/* Floating Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 100
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="login-bg-glow"></div>
        <div className="login-bg-glow-2"></div>
        <Spinner active={loading} />

        <div className="login-card" style={{ padding: '36px 32px', borderRadius: '24px', textAlign: 'center', maxWidth: '440px', width: '90%' }}>
          <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div className="logo-capsule" style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', marginBottom: '12px' }}>
              <img src="/semco_logo.png" alt="SEMCO Logo" style={{ height: '48px', objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '16px' }}>
              Verify Your Email
            </div>
          </div>

          <div style={{ fontSize: '3rem', margin: '20px 0' }}>✉️</div>

          <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>
            Verification link sent successfully!
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '28px' }}>
            We have sent a verification email to <strong style={{ color: 'var(--text-primary)' }}>{registeredEmail}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </p>

          <button
            className="login-btn"
            onClick={() => {
              setVerificationRequired(false);
              setActiveTab('login');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(90deg, #e28743 0%, #5c6bc0 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(226, 135, 67, 0.25)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Floating Theme Toggle */}
      <button
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 100
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="login-bg-glow"></div>
      <div className="login-bg-glow-2"></div>
      <Spinner active={loading} />
      
      <div className="login-card" style={{ padding: '32px 28px', borderRadius: '24px', maxWidth: '440px', width: '90%' }}>
        {/* Logo and Subtitle */}
        <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div className="logo-capsule" style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', marginBottom: '12px' }}>
            <img src="/semco_logo.png" alt="SEMCO Logo" style={{ height: '48px', objectFit: 'contain', display: 'block' }} />
          </div>
          <div className="login-subtitle" style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Enquiry Management Portal
          </div>
        </div>

        {/* Sign In / Sign Up Tab Headers */}
        <div className="login-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px',
              fontSize: '1.05rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'login' ? '#e28743' : 'var(--text-secondary)',
              borderBottom: activeTab === 'login' ? '2px solid #e28743' : '2px solid transparent',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px',
              fontSize: '1.05rem',
              fontWeight: '700',
              cursor: 'pointer',
              color: activeTab === 'signup' ? '#e28743' : 'var(--text-secondary)',
              borderBottom: activeTab === 'signup' ? '2px solid #e28743' : '2px solid transparent',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '16px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="error-banner" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', marginBottom: '16px' }}>
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Field (Sign Up Only) */}
          {activeTab === 'signup' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="name" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                NAME
              </label>
              <input
                className="form-input"
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', height: '48px', padding: '12px 16px', borderRadius: '10px' }}
              />
            </div>
          )}

          {/* Email Address / Username Field */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="username" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              EMAIL ADDRESS
            </label>
            <input
              className="form-input"
              type="text"
              id="username"
              placeholder="name@semcogroups.com"
              value={username}
              onChange={(e) => {
                const val = e.target.value;
                setUsername(val);
                if (activeTab === 'signup') {
                  if (val.toLowerCase().endsWith('@semcogroups.com')) {
                    setError('');
                  } else if (val.includes('@') && !val.toLowerCase().endsWith('@semcogroups.com') && val.split('@')[1].includes('.')) {
                    setError('Domain Name incorrect');
                  }
                }
              }}
              onBlur={() => {
                if (activeTab === 'signup' && username) {
                  if (!username.toLowerCase().endsWith('@semcogroups.com')) {
                    setError('Domain Name incorrect');
                  } else {
                    setError('');
                  }
                }
              }}
              required
              style={{ width: '100%', height: '48px', padding: '12px 16px', borderRadius: '10px' }}
            />
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="password" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  if (activeTab === 'signup') {
                    if (val === '') {
                      setError('');
                    } else {
                      setError(validatePasswordComplexity(val));
                    }
                  }
                }}
                onBlur={() => {
                  if (activeTab === 'signup' && password) {
                    setError(validatePasswordComplexity(password));
                  }
                }}
                required
                style={{ width: '100%', height: '48px', padding: '12px 45px 12px 16px', borderRadius: '10px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {activeTab === 'signup' && (
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', marginTop: '4px', display: 'block', lineHeight: '1.3' }}>
                Password requires min. 7 characters and 1 special character.
              </small>
            )}
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {activeTab === 'signup' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="confirmPassword" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmPassword(val);
                    if (activeTab === 'signup') {
                      if (val === '') {
                        setError('');
                      } else if (password !== val) {
                        setError("Passwords do not match. Please re-enter them correctly.");
                      } else {
                        setError('');
                      }
                    }
                  }}
                  onBlur={() => {
                    if (activeTab === 'signup' && confirmPassword) {
                      if (password !== confirmPassword) {
                        setError("Passwords do not match. Please re-enter them correctly.");
                      } else {
                        setError('');
                      }
                    }
                  }}
                  required
                  style={{ width: '100%', height: '48px', padding: '12px 45px 12px 16px', borderRadius: '10px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                  title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Captcha Section (Sign Up Only) */}
          {activeTab === 'signup' && (
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                CAPTCHA CODE
              </label>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div 
                  style={{ 
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', 
                    color: '#0f172a', 
                    padding: '8px 20px', 
                    borderRadius: '8px', 
                    fontSize: '1.2rem', 
                    fontWeight: '800', 
                    letterSpacing: '4px', 
                    fontStyle: 'italic',
                    userSelect: 'none',
                    textDecoration: 'line-through',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(0,0,0,0.15)',
                    height: '40px'
                  }}
                >
                  {generatedCaptcha}
                </div>
                <button 
                  type="button" 
                  onClick={() => setGeneratedCaptcha(generateRandomCaptcha())} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.25rem', 
                    cursor: 'pointer', 
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Refresh Captcha"
                >
                  🔄
                </button>
              </div>
              
              <input
                className="form-input"
                type="text"
                placeholder="Enter Captcha Code"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
                style={{ width: '100%', height: '48px', padding: '12px 16px', borderRadius: '10px' }}
              />
            </div>
          )}

          {/* Gradient Submit Button */}
          <button
            className="login-btn"
            type="submit"
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(90deg, #e28743 0%, #5c6bc0 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(226, 135, 67, 0.25)',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(226, 135, 67, 0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(226, 135, 67, 0.25)';
            }}
          >
            {activeTab === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Footer Link Toggle */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {activeTab === 'login' ? (
            <>
              Don't have an account?{' '}
              <span
                onClick={() => setActiveTab('signup')}
                style={{ color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer' }}
              >
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span
                onClick={() => setActiveTab('login')}
                style={{ color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer' }}
              >
                Sign In
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
