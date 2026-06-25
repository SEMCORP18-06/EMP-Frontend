import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { API_BASE } from './config';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [displayName, setDisplayName] = useState(localStorage.getItem('displayName') || '');
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Theme toggle lifted state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('semcorp-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', isDark ? '' : 'light');
    localStorage.setItem('semcorp-theme', theme);
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const handleLoginSuccess = (newToken, role, email, name) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', email);
    localStorage.setItem('displayName', name || '');
    setToken(newToken);
    setUserRole(role);
    setUsername(email);
    setDisplayName(name || '');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    setToken('');
    setUserRole('');
    setUsername('');
    setDisplayName('');
  };

  const checkStatus = async () => {
    if (!token) return;
    setChecking(true);
    setStatusMsg('');
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setChecking(false);
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (!data.role) {
          setStatusMsg("Account is still pending activation by the IT team.");
        } else {
          if (data.role !== userRole) {
            localStorage.setItem('userRole', data.role);
            setUserRole(data.role);
          }
          if (data.name !== displayName) {
            localStorage.setItem('displayName', data.name || '');
            setDisplayName(data.name || '');
          }
        }
      } else {
        setStatusMsg("Failed to check status. Server responded with an error.");
      }
    } catch (err) {
      setChecking(false);
      console.error('Error fetching activation status:', err);
      setStatusMsg("Connection error. Please check your network and try again.");
    }
  };

  useEffect(() => {
    if (token) {
      checkStatus();
      // Periodically check role status every 10 seconds while pending activation
      const interval = setInterval(() => {
        if (!userRole) {
          checkStatus();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [token, userRole]);

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  // If the user's role is blank, show the Account Pending Activation screen
  if (!userRole) {
    return (
      <div className="login-container">
        {/* Floating Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
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
        
        <div className="login-card" style={{ padding: '36px 32px', borderRadius: '24px', textAlign: 'center', maxWidth: '420px', width: '90%' }}>
          <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div className="logo-capsule" style={{ background: '#ffffff', padding: '8px 16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', marginBottom: '12px' }}>
              <img src="/semco_logo.png" alt="SEMCO Logo" style={{ height: '48px', objectFit: 'contain', display: 'block' }} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginTop: '16px', fontSize: '1.25rem', fontWeight: '700' }}>Account Pending Activation</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            Your account <strong>{username}</strong> has been successfully registered. 
            Before you can access the portal, the IT team must assign a role to your account.
          </p>
          <button 
            className="login-btn" 
            onClick={handleLogout} 
            style={{ 
              width: '100%', 
              height: '48px', 
              borderRadius: '10px', 
              background: 'linear-gradient(90deg, #e28743 0%, #5c6bc0 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(226, 135, 67, 0.25)'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard 
      token={token} 
      userRole={userRole} 
      username={username} 
      displayName={displayName}
      onLogout={handleLogout} 
      isDark={isDark}
      onToggleTheme={toggleTheme}
    />
  );
}
