import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, ReceiptText, RefreshCw } from 'lucide-react';
import { db, syncFromServer } from '../lib/db';
import { format } from 'date-fns';
import { TRANSLATIONS } from '../lib/translations';

export default function CustomerLedger({ customerId, onBack, lang }) {
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('payment'); // 'payment' | 'charge'
  const [isSyncing, setIsSyncing] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const loadData = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    await syncFromServer();
    const c = db.getCustomer(customerId);
    if (!c) {
      onBack();
      return;
    }
    setCustomer(c);
    setTransactions(db.getTransactions(customerId));
    if (!silent) setIsSyncing(false);
  };

  useEffect(() => {
    loadData();

    // Auto sync details/transactions every 5 seconds for user concurrency
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [customerId]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    await db.addTransaction({
      customer_id: customerId,
      type: type,
      amount: Number(amount)
    });
    setAmount('');
    loadData(true);
  };

  const handleDelete = async () => {
    if (window.confirm(t.confirmDelete)) {
      await db.deleteCustomer(customerId);
      onBack();
    }
  };

  if (!customer) return null;

  // Calculate running balances
  let runningBalance = 0;
  const ledgerEntries = transactions.map(t => {
    if (t.type === 'charge') {
      runningBalance += Number(t.amount);
    } else {
      runningBalance -= Number(t.amount);
    }
    return { ...t, runningBalance };
  }).reverse(); // Show newest at the top

  const isPaid = runningBalance <= 0;

  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 z-50 overflow-y-auto lg:relative lg:inset-auto lg:min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10 px-4 py-4 flex items-center justify-between pr-24">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100 leading-tight">{customer.name}</h2>
              <button 
                onClick={() => loadData()} 
                className={`text-zinc-500 hover:text-zinc-300 transition-colors p-1 ${isSyncing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {customer.phone && <p className="text-xs text-zinc-450">{customer.phone}</p>}
          </div>
        </div>
        <button onClick={handleDelete} className="p-2 text-zinc-500 hover:text-soft-red transition-colors rounded-full hover:bg-red-950/20">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className={`rounded-2xl p-6 text-zinc-950 ${isPaid ? 'bg-soft-green' : 'bg-soft-red'} shadow-lg relative overflow-hidden`}>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-15 rounded-full blur-2xl"></div>
          <p className="text-xs font-bold opacity-80 uppercase tracking-wider">{t.currentBalance}</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-5xl font-black tracking-tight">
              ₹{Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="bg-zinc-950/10 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              {isPaid ? (runningBalance < 0 ? t.overpaid.toUpperCase() : t.paid.toUpperCase()) : t.pending.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action Form */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-5">
          <form onSubmit={handleAddTransaction} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-450 mb-2 uppercase tracking-wider">{t.amount}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-450 font-bold text-lg">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-xl pl-8 pr-4 py-4 text-xl font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-soft-green transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-32 shrink-0">
              <button
                type="button"
                onClick={() => { setType('payment'); if(amount) document.getElementById('submitBtn').click(); }}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${type === 'payment' ? 'bg-soft-green text-zinc-950 shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
              >
                <Minus className="w-4 h-4" /> {t.pay}
              </button>
              <button
                type="button"
                onClick={() => { setType('charge'); if(amount) document.getElementById('submitBtn').click(); }}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${type === 'charge' ? 'bg-soft-red text-zinc-950 shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
              >
                <Plus className="w-4 h-4" /> {t.charge}
              </button>
            </div>
            <button type="submit" id="submitBtn" className="hidden">Submit</button>
          </form>
        </div>

        {/* Ledger Log */}
        <div>
          <h4 className="text-xs font-bold text-zinc-450 mb-3 px-1 uppercase tracking-wider flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-zinc-500" /> {t.history}
          </h4>
          <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden">
            {ledgerEntries.length === 0 ? (
              <div className="p-8 text-center text-zinc-550 font-medium">{t.noTransactions}</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-zinc-850 transition-colors">
                    <div className="flex items-center gap-3">
                      {entry.type === 'charge' ? (
                        <span className="text-soft-red bg-soft-red/10 w-8 h-8 rounded-xl flex items-center justify-center border border-soft-red/20"><Plus className="w-4 h-4" /></span>
                      ) : (
                        <span className="text-soft-green bg-soft-green/10 w-8 h-8 rounded-xl flex items-center justify-center border border-soft-green/20"><Minus className="w-4 h-4" /></span>
                      )}
                      <div>
                        <p className="font-bold text-zinc-100">
                          ₹{Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                          {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t.balance}</p>
                      <p className={`font-bold ${entry.runningBalance > 0 ? 'text-soft-red' : entry.runningBalance < 0 ? 'text-soft-green' : 'text-zinc-500'}`}>
                        ₹{Math.abs(entry.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
