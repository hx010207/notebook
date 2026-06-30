import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerLedger from './components/CustomerLedger';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [lang, setLang] = useState('en');

  // Restore session and language preference
  useEffect(() => {
    const savedUser = localStorage.getItem('ledger_session_user');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    const savedLang = localStorage.getItem('notebook_lang');
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleLogin = (username) => {
    setCurrentUser(username);
    localStorage.setItem('ledger_session_user', username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCustomerId(null);
    localStorage.removeItem('ledger_session_user');
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('notebook_lang', newLang);
  };

  return (
    <div className="bg-zinc-950 min-h-screen font-sans antialiased text-zinc-100 relative">
      {/* Floating Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl text-xs font-bold shadow-lg">
        <button 
          onClick={() => handleSetLang('en')} 
          className={`px-2.5 py-1 rounded-lg transition-colors ${lang === 'en' ? 'bg-soft-green text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          EN
        </button>
        <button 
          onClick={() => handleSetLang('hi')} 
          className={`px-2.5 py-1 rounded-lg transition-colors ${lang === 'hi' ? 'bg-soft-green text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          HI
        </button>
      </div>

      {currentUser ? (
        selectedCustomerId ? (
          <div className="animate-in slide-in-from-right duration-300">
            <CustomerLedger 
              customerId={selectedCustomerId} 
              onBack={() => setSelectedCustomerId(null)} 
              lang={lang}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <Dashboard 
              onLogout={handleLogout} 
              onSelectCustomer={setSelectedCustomerId} 
              lang={lang}
            />
          </div>
        )
      ) : (
        <Login onLogin={handleLogin} lang={lang} />
      )}
    </div>
  );
}

export default App;
