import { useEffect, useState } from 'react';
import api from '../api';

const initialForm = {
  category_id: '',
  amount: '',
  description: '',
  transaction_type: 'expense',
  transaction_date: new Date().toISOString().slice(0, 10),
  payment_method: 'Cash',
  goal_id: '',
};

const initialRecurringForm = {
  expense_name: '',
  amount: '',
  frequency: 'monthly',
  category_id: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  next_due_date: new Date().toISOString().slice(0, 10),
};

const PAYMENT_METHODS = ['Cash', 'Transfer', 'Debit', 'Kredit', 'GoPay', 'OVO', 'Dana', 'ShopeePay'];
const FREQ_LABELS = { daily: '📅 Harian', weekly: '🗓️ Mingguan', monthly: '📆 Bulanan' };

export default function TransactionsPage() {
  const [categories, setCategories]           = useState([]);
  const [goals, setGoals]                     = useState([]);
  const [transactions, setTransactions]       = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [form, setForm]                       = useState(initialForm);
  const [recurringForm, setRecurringForm]     = useState(initialRecurringForm);
  const [loading, setLoading]                 = useState(false);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [message, setMessage]                 = useState('');
  const [recurringMessage, setRecurringMessage] = useState('');
  const [activeTab, setActiveTab]             = useState('transactions'); // 'transactions' | 'recurring'
  const [formTab, setFormTab]                 = useState('new');          // 'new' | 'recurring'

  const loadData = async () => {
    try {
      const [catRes, goalRes, txRes, recRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/goals'),
        api.get('/api/transactions'),
        api.get('/api/recurring-expenses'),
      ]);
      setCategories(catRes.data);
      setGoals(goalRes.data);
      setTransactions(txRes.data);
      setRecurringExpenses(recRes.data);
    } catch {
      setMessage('Gagal memuat data transaksi.');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRecurringChange = (e) => setRecurringForm({ ...recurringForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/api/transactions', { ...form, amount: Number(form.amount) });
      setForm(initialForm);
      loadData();
      setMessage('✓ Transaksi berhasil disimpan.');
      setActiveTab('transactions');
    } catch (err) {
      setMessage(err.response?.data?.error || '✗ Gagal menyimpan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault();
    setRecurringLoading(true);
    setRecurringMessage('');
    try {
      await api.post('/api/recurring-expenses', { ...recurringForm, amount: Number(recurringForm.amount) });
      setRecurringForm(initialRecurringForm);
      loadData();
      setRecurringMessage('✓ Recurring expense berhasil disimpan.');
      setActiveTab('recurring');
    } catch (err) {
      setRecurringMessage(err.response?.data?.error || '✗ Gagal menyimpan.');
    } finally {
      setRecurringLoading(false);
    }
  };

  const totalIncome  = transactions.filter(t => t.transaction_type === 'income').reduce((a, t) => a + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.transaction_type === 'expense').reduce((a, t) => a + Number(t.amount), 0);

  return (
    <main className="page-layout">

      {/* ══ TOP SUMMARY BAR ══ */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Transaksi', value: transactions.length, unit: 'transaksi', icon: '⇅', color: 'var(--accent)' },
          { label: 'Total Pemasukan', value: `Rp ${totalIncome.toLocaleString('id-ID')}`, icon: '↑', color: 'var(--emerald)' },
          { label: 'Total Pengeluaran', value: `Rp ${totalExpense.toLocaleString('id-ID')}`, icon: '↓', color: 'var(--rose)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{
            padding: '20px 24px',
            animation: `fadeUp 0.4s ${i * 0.07}s ease both`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: s.color === 'var(--accent)' ? 'var(--accent-dim)' : s.color === 'var(--emerald)' ? 'var(--emerald-dim)' : 'var(--rose-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', color: s.color,
              }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══ FORM PANEL ══ */}
      <section className="panel" style={{ animation: 'fadeUp 0.5s 0.2s ease both' }}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Transaction Logger</p>
            <h1>Catat Transaksi</h1>
          </div>
        </div>

        {/* Form tab switcher */}
        <div style={{
          display: 'flex',
          gap: 4,
          background: 'var(--bg-base)',
          borderRadius: 999,
          padding: 4,
          marginBottom: 24,
          width: 'fit-content',
        }}>
          {[
            { id: 'new', label: '+ Transaksi Baru' },
            { id: 'recurring', label: '↺ Recurring' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFormTab(tab.id)}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all var(--transition)',
                color: formTab === tab.id ? 'var(--accent-bright)' : 'var(--text-muted)',
                background: formTab === tab.id ? 'var(--accent-dim)' : 'transparent',
                border: formTab === tab.id ? '1px solid var(--border-accent)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── New Transaction Form ── */}
        {formTab === 'new' && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>

            {/* Type toggle */}
            <div>
              <label style={{ marginBottom: 8, display: 'block' }}>Tipe Transaksi</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['expense', 'income'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, transaction_type: type })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${form.transaction_type === type
                        ? (type === 'expense' ? 'rgba(248,113,113,0.5)' : 'rgba(52,211,153,0.5)')
                        : 'var(--border)'}`,
                      background: form.transaction_type === type
                        ? (type === 'expense' ? 'var(--rose-dim)' : 'var(--emerald-dim)')
                        : 'var(--bg-elevated)',
                      color: form.transaction_type === type
                        ? (type === 'expense' ? 'var(--rose)' : 'var(--emerald)')
                        : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {type === 'expense' ? '↓ Pengeluaran' : '↑ Pemasukan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <label>
                Kategori
                <select name="category_id" value={form.category_id} onChange={handleChange} required>
                  <option value="">Pilih kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </label>

              <label>
                Jumlah (Rp)
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  style={{
                    color: form.amount
                      ? form.transaction_type === 'expense' ? 'var(--rose)' : 'var(--emerald)'
                      : undefined,
                    fontWeight: form.amount ? 700 : 400,
                  }}
                />
              </label>

              <label>
                Tanggal Transaksi
                <input type="date" name="transaction_date" value={form.transaction_date} onChange={handleChange} required />
              </label>

              <label>
                Metode Pembayaran
                <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>

              <label className="form-full">
                Deskripsi
                <input name="description" value={form.description} onChange={handleChange} placeholder="Contoh: makan siang di restoran A..." />
              </label>

              {form.transaction_type === 'expense' && goals.filter(g => g.status === 'active').length > 0 && (
                <label className="form-full">
                  Untuk Goal (opsional)
                  <select name="goal_id" value={form.goal_id} onChange={handleChange}>
                    <option value="">— Tidak untuk goal tertentu —</option>
                    {goals.filter(g => g.status === 'active').map(g => (
                      <option key={g.id} value={g.id}>{g.goal_name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button type="submit" className="button-primary" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin-slow 0.7s linear infinite', display: 'inline-block',
                    }} />
                    Menyimpan...
                  </span>
                ) : '+ Catat Transaksi'}
              </button>
              {message && (
                <span style={{
                  fontSize: '0.875rem',
                  color: message.startsWith('✓') ? 'var(--emerald)' : 'var(--rose)',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  {message}
                </span>
              )}
            </div>
          </form>
        )}

        {/* ── Recurring Form ── */}
        {formTab === 'recurring' && (
          <form onSubmit={handleRecurringSubmit} style={{ display: 'grid', gap: 18 }}>
            <div className="form-grid">
              <label className="form-full">
                Nama Pengeluaran
                <input name="expense_name" value={recurringForm.expense_name} onChange={handleRecurringChange} placeholder="Contoh: Netflix, Gym membership..." required />
              </label>

              <label>
                Jumlah (Rp)
                <input type="number" name="amount" value={recurringForm.amount} onChange={handleRecurringChange} placeholder="0" required />
              </label>

              <label>
                Frekuensi
                <select name="frequency" value={recurringForm.frequency} onChange={handleRecurringChange}>
                  {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>

              <label>
                Kategori
                <select name="category_id" value={recurringForm.category_id} onChange={handleRecurringChange}>
                  <option value="">Pilih kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </label>

              <label>
                Tanggal Mulai
                <input type="date" name="start_date" value={recurringForm.start_date} onChange={handleRecurringChange} required />
              </label>

              <label>
                Jatuh Tempo Berikutnya
                <input type="date" name="next_due_date" value={recurringForm.next_due_date} onChange={handleRecurringChange} required />
              </label>

              <label>
                Tanggal Berakhir (opsional)
                <input type="date" name="end_date" value={recurringForm.end_date} onChange={handleRecurringChange} />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button type="submit" className="button-primary" disabled={recurringLoading}>
                {recurringLoading ? 'Menyimpan...' : '↺ Simpan Recurring'}
              </button>
              {recurringMessage && (
                <span style={{
                  fontSize: '0.875rem',
                  color: recurringMessage.startsWith('✓') ? 'var(--emerald)' : 'var(--rose)',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  {recurringMessage}
                </span>
              )}
            </div>
          </form>
        )}
      </section>

      {/* ══ HISTORY TABLE ══ */}
      <section className="panel" style={{ animation: 'fadeUp 0.5s 0.3s ease both' }}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Riwayat</p>
            <h2>Semua Transaksi</h2>
          </div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', borderRadius: 999, padding: 4 }}>
            {[
              { id: 'transactions', label: `Transaksi (${transactions.length})` },
              { id: 'recurring',    label: `Recurring (${recurringExpenses.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  color: activeTab === tab.id ? 'var(--accent-bright)' : 'var(--text-muted)',
                  background: activeTab === tab.id ? 'var(--accent-dim)' : 'transparent',
                  border: activeTab === tab.id ? '1px solid var(--border-accent)' : '1px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'transactions' && (
          <div className="transaction-table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Metode</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length ? transactions.map((item, i) => (
                  <tr key={item.id} style={{ animation: `fadeIn 0.3s ${i * 0.04}s ease both` }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.transaction_date}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description || '—'}</div>
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '3px 9px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}>
                        {item.category_name || 'Lainnya'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.payment_method || '—'}
                    </td>
                    <td>
                      <span className={`tx-amount-${item.transaction_type}`} style={{ fontSize: '0.95rem' }}>
                        {item.transaction_type === 'income' ? '+' : '-'}Rp {Number(item.amount).toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
                      <div style={{ fontSize: '1.5rem', opacity: 0.3, marginBottom: 8 }}>⇅</div>
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="transaction-table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Frekuensi</th>
                  <th>Jumlah</th>
                  <th>Jatuh Tempo</th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenses.length ? recurringExpenses.map((item, i) => (
                  <tr key={item.id} style={{ animation: `fadeIn 0.3s ${i * 0.04}s ease both` }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.expense_name}</td>
                    <td>
                      <span style={{
                        background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem',
                        fontWeight: 600, color: 'var(--text-secondary)',
                      }}>
                        {item.category_name || 'Lainnya'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--amber-dim)', border: '1px solid rgba(251,191,36,0.25)',
                        borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem',
                        fontWeight: 700, color: 'var(--amber)',
                      }}>
                        {FREQ_LABELS[item.frequency] || item.frequency}
                      </span>
                    </td>
                    <td>
                      <span className="tx-amount-expense">
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{item.next_due_date}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
                      <div style={{ fontSize: '1.5rem', opacity: 0.3, marginBottom: 8 }}>↺</div>
                      Belum ada recurring expense.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}