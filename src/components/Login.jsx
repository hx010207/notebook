import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

import { TRANSLATIONS } from '../lib/translations';

const USERS = [
  { username: 'u1', password: '1' },
  { username: 'u2', password: '2' },
  { username: 'u3', password: '3' },
  { username: 'u4', password: '4' },
];

export default function Login({ onLogin, lang }) {
  const [username, setUsername] = useState(USERS[0].username);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleLogin = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.username === username);
    if (user && user.password === password) {
      onLogin(user.username);
    } else {
      setError(lang === 'hi' ? 'अमान्य क्रेडेंशियल्स' : 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-soft-green/10 rounded-full flex items-center justify-center mb-4 border border-soft-green/20">
            <BookOpen className="w-8 h-8 text-soft-green" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">{t.title}</h2>
          <p className="text-zinc-400 mt-2 text-center text-sm">{t.loginDesc}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t.selectUser}</label>
            <select
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all"
            >
              {USERS.map(u => (
                <option key={u.username} value={u.username}>{u.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t.password}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all"
                placeholder={t.enterPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-soft-red text-sm font-medium text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-soft-green hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl px-4 py-3 transition-colors duration-200"
          >
            {t.accessLedger}
          </button>
        </form>
      </div>
    </div>
  );
}
