import React, { useState, useEffect } from 'react';
import { Plus, Search, User, LogOut, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import { db, syncFromServer } from '../lib/db';
import { TRANSLATIONS } from '../lib/translations';

export default function Dashboard({ onLogout, onSelectCustomer, lang }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', initialAmount: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const loadData = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    await syncFromServer();
    setCustomers(db.getCustomers());
    if (!silent) setIsSyncing(false);
  };

  useEffect(() => {
    loadData();

    // Setup periodic syncing every 5 seconds to keep all users in sync
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const fallbackName = lang === 'hi' ? 'अनाम खाता' : 'Unnamed Ledger';
    const displayName = newCustomer.name.trim() || newCustomer.phone.trim() || fallbackName;
    
    await db.addCustomer({ 
      name: displayName, 
      phone: newCustomer.phone 
    }, newCustomer.initialAmount || 0);

    setNewCustomer({ name: '', phone: '', initialAmount: '' });
    setIsAdding(false);
    setCustomers(db.getCustomers());
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const handleDeleteLedger = async (e, id) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      await db.deleteCustomer(id);
      setCustomers(db.getCustomers());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Header Summary */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center pr-24">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-100">{t.title}</h1>
            <button 
              onClick={() => loadData()} 
              className={`text-zinc-500 hover:text-zinc-300 transition-colors p-1 ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <button onClick={onLogout} className="text-zinc-400 hover:text-zinc-200 transition-colors p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-6">
          <p className="text-xs font-bold text-zinc-450 uppercase tracking-wide">{t.totalOutstanding}</p>
          <p className="text-4xl font-extrabold text-soft-red mt-1 tracking-tight">
            ₹{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Search & Add Action */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder={t.searchLedgers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all shadow-lg text-sm"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-soft-green hover:bg-emerald-600 text-zinc-950 p-3 rounded-2xl shadow-lg transition-colors flex items-center justify-center shrink-0 font-bold"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Add Ledger Form */}
        {isAdding && (
          <form onSubmit={handleAddCustomer} className="bg-zinc-900 p-5 rounded-2xl shadow-lg border border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-200 text-sm">
            <h3 className="font-semibold text-zinc-100 mb-4">{t.newLedger}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">{t.ledgerName}</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-soft-green"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{t.phone}</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-soft-green"
                    placeholder="9999999999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">{t.initialDue}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCustomer.initialAmount}
                    onChange={(e) => setNewCustomer({...newCustomer, initialAmount: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-soft-green"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-soft-green text-zinc-950 py-2.5 rounded-xl font-bold transition-colors hover:bg-emerald-600">{t.saveLedger}</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-zinc-400 font-bold transition-colors hover:text-zinc-200">{t.cancel}</button>
              </div>
            </div>
          </form>
        )}

        {/* Ledger List */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-zinc-550">
              <User className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p>{t.noLedgers}</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {filteredCustomers.map(customer => (
                <li key={customer.id} className="relative group hover:bg-zinc-800/30 flex items-center justify-between pr-4">
                  <button
                    onClick={() => onSelectCustomer(customer.id)}
                    className="flex-1 text-left px-5 py-4 transition-colors flex items-center justify-between group/btn"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-100 group-hover/btn:text-soft-green transition-colors">{customer.name}</h4>
                      {customer.phone && <p className="text-sm text-zinc-400 mt-0.5">{customer.phone}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <p className={`font-bold ${customer.balance > 0 ? 'text-soft-red' : customer.balance < 0 ? 'text-soft-green' : 'text-zinc-550'}`}>
                          ₹{Math.abs(customer.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                          {customer.balance > 0 ? t.pending : customer.balance < 0 ? t.overpaid : t.paid}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-650 group-hover/btn:text-soft-green transition-colors" />
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteLedger(e, customer.id)}
                    className="p-2 text-zinc-500 hover:text-soft-red transition-colors rounded-xl hover:bg-red-950/20 md:opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Delete Ledger"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
