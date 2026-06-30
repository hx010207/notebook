import { supabase } from './supabase';

const CUSTOMERS_KEY = 'ledger_customers';
const TRANSACTIONS_KEY = 'ledger_transactions';

function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getLocal(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

async function syncToSupabase(table, record) {
  try {
    const { error } = await supabase.from(table).upsert(record);
    if (error) console.warn(`Sync failed for ${table}:`, error.message);
  } catch (err) {
    console.warn(`Supabase unreachable for ${table}:`, err);
  }
}

export async function syncFromServer() {
  try {
    const [{ data: customers, error: cErr }, { data: transactions, error: tErr }] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('transactions').select('*')
    ]);

    if (cErr || tErr) return;

    if (customers && customers.length > 0) {
      const localCustomers = getLocal(CUSTOMERS_KEY);
      const mergedCustomers = [...localCustomers];
      customers.forEach(sc => {
        if (!mergedCustomers.find(lc => lc.id === sc.id)) mergedCustomers.push(sc);
      });
      setLocal(CUSTOMERS_KEY, mergedCustomers);
    }

    if (transactions && transactions.length > 0) {
      const localTransactions = getLocal(TRANSACTIONS_KEY);
      const mergedTransactions = [...localTransactions];
      transactions.forEach(st => {
        if (!mergedTransactions.find(lt => lt.id === st.id)) mergedTransactions.push(st);
      });
      setLocal(TRANSACTIONS_KEY, mergedTransactions);
    }
  } catch (err) {
    console.warn('Offline mode active.');
  }
}

export const db = {
  getCustomers: () => {
    const customers = getLocal(CUSTOMERS_KEY);
    const txs = getLocal(TRANSACTIONS_KEY);
    return customers.map(c => {
      const cTxs = txs.filter(t => t.customer_id === c.id);
      const balance = cTxs.reduce((sum, t) => {
        return sum + (t.type === 'charge' ? Number(t.amount) : -Number(t.amount));
      }, 0);
      return { ...c, balance };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  getCustomer: (id) => {
    return getLocal(CUSTOMERS_KEY).find(c => c.id === id);
  },

  getTransactions: (customerId) => {
    return getLocal(TRANSACTIONS_KEY)
      .filter(t => t.customer_id === customerId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  addCustomer: async (customer, initialAmount) => {
    const newCustomer = {
      id: generateUUID(),
      name: customer.name,
      phone: customer.phone,
      created_at: new Date().toISOString()
    };
    const customers = getLocal(CUSTOMERS_KEY);
    customers.push(newCustomer);
    setLocal(CUSTOMERS_KEY, customers);
    syncToSupabase('customers', newCustomer);

    if (Number(initialAmount) > 0) {
      await db.addTransaction({
        customer_id: newCustomer.id,
        type: 'charge',
        amount: Number(initialAmount)
      });
    }

    return newCustomer;
  },

  addTransaction: async (transaction) => {
    const newTx = {
      id: generateUUID(),
      ...transaction,
      created_at: new Date().toISOString()
    };
    const txs = getLocal(TRANSACTIONS_KEY);
    txs.push(newTx);
    setLocal(TRANSACTIONS_KEY, txs);
    syncToSupabase('transactions', newTx);
    return newTx;
  },

  deleteCustomer: async (id) => {
    const customers = getLocal(CUSTOMERS_KEY).filter(c => c.id !== id);
    setLocal(CUSTOMERS_KEY, customers);
    
    const txs = getLocal(TRANSACTIONS_KEY).filter(t => t.customer_id !== id);
    setLocal(TRANSACTIONS_KEY, txs);

    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete remotely:', e);
    }
  }
};
