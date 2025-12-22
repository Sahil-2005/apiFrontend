/*
GitHub-themed Admin Auth Frontend (single-file React component)
- File type: code/react (single component file ready to paste into a React app)

How to use
1. Ensure Tailwind CSS is configured in your React project (CRA / Vite + Tailwind). This component uses Tailwind classes.
2. Place this file as `AdminAuthApp.jsx` and import it in your app (e.g. in App.jsx: `import AdminAuthApp from './AdminAuthApp'`)
3. Supply an API base URL via env: `REACT_APP_API_URL` (defaults to http://localhost:5000 if missing).
4. Backend endpoints expected (based on your provided controllers):
   POST  /api/auth/login
   POST  /api/auth/forgot-password
   POST  /api/auth/reset-password
   POST  /api/auth/logout (protected)
   GET   /api/auth/verify (protected)

Notes
- This code uses fetch with `credentials: 'include'` to allow your session cookie to be sent.
- JWT is stored in localStorage as `accessToken` (so front-end can send Authorization headers). The session cookie remains httpOnly.
- The UI is intentionally GitHub-like (dark, compact, octocat-inspired header, monospace fonts).

You can customize styles, animations or connect to a router if you prefer react-router based flows.
*/

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate  } from "react-router-dom";
import MainPage from './MainPage';

const API_BASE = 'http://localhost:3000';

function IconOctocat({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.93 3.19 9.12 7.61 10.6.56.1.77-.24.77-.54 0-.27-.01-1.15-.02-2.08-3.09.67-3.74-.75-3.98-1.44-.13-.36-.7-1.44-1.2-1.73-.41-.23-1-.8-.01-.82.93-.02 1.6.85 1.82 1.2 1.06 1.84 2.75 1.31 3.42 1 .11-.78.4-1.31.73-1.61-2.77-.32-5.68-1.39-5.68-6.17 0-1.36.49-2.47 1.3-3.34-.13-.32-.57-1.61.12-3.35 0 0 1.06-.34 3.48 1.28 1.01-.28 2.08-.42 3.15-.42s2.14.14 3.15.42c2.41-1.62 3.47-1.28 3.47-1.28.69 1.74.25 3.03.12 3.35.81.87 1.3 1.98 1.3 3.34 0 4.79-2.92 5.84-5.7 6.15.41.36.78 1.08.78 2.18 0 1.58-.01 2.86-.01 3.25 0 .3.2.65.78.54C19.06 20.86 22.25 16.67 22.25 11.75 22.25 5.48 17.27.5 12 .5z" />
    </svg>
  );
}

export default function Login() {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset' | 'dashboard'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();
  // on mount, try verify
  useEffect(() => {
    const tryVerify = async () => {
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) return;

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/auth/verify`, {
          method: 'GET',
          headers: {
            'x-session-token': sessionToken,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.admin) {
          setAdmin(data.admin);
          setView('dashboard');
        } else {
          // token invalid/expired, clear
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('accessToken');
        }
      } catch (err) {
        console.error('verify error', err);
      } finally {
        setLoading(false);
      }
    };
    tryVerify();
  }, []);

  const apiPost = async (path, payload = {}) => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include', // important for session cookie
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('apiPost error', err);
      return { ok: false, status: 0, data: { message: 'Network error' } };
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!email || !password) return setMessage('Email and password are required');

    const { ok, data } = await apiPost('/api/auth/login', { email, password });
    if (ok) {
      // store tokens: jwt in DB, session token in localStorage for subsequent verification
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('sessionToken', data.tokens.refreshToken);
      setAdmin(data.user);
      setMessage('Logged in successfully');
      setView('dashboard');
      navigate('/MainPage');
    } else {
      setMessage(data?.message || 'Login failed');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!email) return setMessage('Enter your email');
    const { ok, data } = await apiPost('/api/auth/forgot-password', { email });
    setMessage(data?.message || (ok ? 'Email sent' : 'Request failed'));
    // optional: let user enter reset token manually if using quick expiry in dev
    if (ok && data?.resetToken) setResetToken(data.resetToken);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!tokenInput || !password) return setMessage('Token and new password required');
    const { ok, data } = await apiPost('/api/auth/reset-password', {
      token: tokenInput,
      password,
    });
    setMessage(data?.message || (ok ? 'Password reset' : 'Reset failed'));
    if (ok) setView('login');
  };

  const handleLogout = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const sessionToken = localStorage.getItem('sessionToken');
      const res = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          'x-session-token': sessionToken || undefined,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (res.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('sessionToken');
        setAdmin(null);
        setView('login');
        setMessage('Logged out');
      } else {
        const data = await res.json();
        setMessage(data?.message || 'Logout failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  // small helper UI
  const Field = ({ label, children }) => (
    <label className="block text-sm mb-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      {children}
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-3xl">
        <header className="flex items-center gap-4 mb-8">
          <div className="p-2 rounded-md bg-gray-800 border border-gray-700">
            <IconOctocat className="w-10 h-10 text-gray-100" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">OctoAdmin</h1>
            <p className="text-sm text-gray-400">admin authentication</p>
          </div>
          <div className="ml-auto text-sm text-gray-400">API: <span className="text-xs text-green-300">{API_BASE}</span></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm">
            {view === 'login' && (
              <form onSubmit={handleLogin}>
                <h2 className="text-lg font-medium mb-4">Sign in to Admin</h2>
                {message && <div className="mb-3 text-sm text-yellow-300">{message}</div>}
                <Field label="Email">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                    placeholder="admin@example.com"
                    type="email"
                  />
                </Field>
                <Field label="Password">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                    placeholder="••••••••"
                    type="password"
                  />
                </Field>
                <div className="flex items-center justify-between mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-medium text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>

                  <button
                    type="button"
                    className="text-xs text-gray-400 hover:underline"
                    onClick={() => { setView('forgot'); setMessage(null); }}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgot}>
                <h2 className="text-lg font-medium mb-4">Reset password</h2>
                {message && <div className="mb-3 text-sm text-yellow-300">{message}</div>}
                <Field label="Enter your admin email">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                    placeholder="admin@example.com"
                    type="email"
                  />
                </Field>
                <div className="flex items-center gap-3 mt-4">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm" disabled={loading}>Send link</button>
                  <button type="button" onClick={() => { setView('login'); setMessage(null); }} className="text-sm text-gray-400 hover:underline">Back to login</button>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Tip: In dev mode your backend might log the reset link to the console.
                </div>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleReset}>
                <h2 className="text-lg font-medium mb-4">Set a new password</h2>
                {message && <div className="mb-3 text-sm text-yellow-300">{message}</div>}
                <Field label="Reset token">
                  <input
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                    placeholder="paste-token-here"
                  />
                </Field>
                <Field label="New password">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                    placeholder="new password"
                    type="password"
                  />
                </Field>
                <div className="flex items-center gap-3 mt-4">
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm" disabled={loading}>Reset password</button>
                  <button type="button" onClick={() => { setView('login'); setMessage(null); }} className="text-sm text-gray-400 hover:underline">Back to login</button>
                </div>
              </form>
            )}

            {view === 'dashboard' && (
              <div>
                <h2 className="text-lg font-medium mb-4">Welcome, {admin?.email || 'Admin'}</h2>
                <p className="text-sm text-gray-400 mb-4">You are signed in to the admin panel.</p>
                <div className="flex gap-3">
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm">Logout</button>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-sm leading-relaxed">
            <h3 className="font-medium mb-2">Developer</h3>
            <p className="text-gray-400 mb-3">This panel is connected to the routes you provided. Useful notes:</p>

            <ul className="text-gray-400 pl-4 list-disc">
              <li>All API calls include credentials to work with httpOnly session cookie.</li>
              <li>Access token is kept in localStorage to allow Authorization header for protected routes.</li>
              <li>Customize `REACT_APP_API_URL` in your environment to point to your backend.</li>
            </ul>

            <hr className="my-4 border-gray-700" />

            <div className="text-xs text-gray-500">Quick actions</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setView('login'); setMessage(null); }} className="px-3 py-1 bg-gray-700 rounded">Login</button>
              <button onClick={() => { setView('forgot'); setMessage(null); }} className="px-3 py-1 bg-gray-700 rounded">Forgot</button>
              <button onClick={() => { setView('reset'); setMessage(null); }} className="px-3 py-1 bg-gray-700 rounded">Reset</button>
              <button onClick={() => {
                // copy example reset link with placeholder token
                const example = `${API_BASE}/reset-password?token=EXAMPLERESETTOKEN`;
                navigator.clipboard?.writeText(example);
                setMessage('Reset link copied to clipboard');
              }} className="px-3 py-1 bg-gray-700 rounded">Copy reset link</button>
            </div>

          </aside>
        </div>

        
      </div>
    </div>
  );
}
