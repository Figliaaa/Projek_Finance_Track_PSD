import { useEffect, useState } from 'react';
import api from '../api';

function progressValue(current, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

function AnimatedNumber({ value, prefix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    const duration = 1200;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString('id-ID')}</>;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--accent-bright)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
        {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
      </div>
    </div>
  );
}

const CARD_META = [
  { key: 'monthlyIncome',      label: 'Pendapatan Bulanan', icon: '↑', color: 'var(--accent)', bg: 'var(--accent-dim)', alloc: null },
  { key: 'needs',              label: 'Kebutuhan',          icon: '🏠', color: '#38bdf8',     bg: 'rgba(56,189,248,0.12)', alloc: 'needs' },
  { key: 'wants',              label: 'Keinginan',          icon: '✦',  color: '#fbbf24',     bg: 'rgba(251,191,36,0.12)', alloc: 'wants' },
  { key: 'savings',            label: 'Tabungan',           icon: '◈',  color: '#34d399',     bg: 'rgba(52,211,153,0.12)', alloc: 'savings' },
];

export default function Dashboard() {
  const [profile, setProfile]   = useState(null);
  const [budget,  setBudget]    = useState(null);
  const [goals,   setGoals]     = useState([]);
  const [message, setMessage]   = useState('');
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, bRes, gRes] = await Promise.all([
          api.get('/api/user/profile'),
          api.post('/api/budget/calculate', { use_goals: true }),
          api.get('/api/goals'),
        ]);
        setProfile(pRes.data);
        setBudget(bRes.data);
        setGoals(gRes.data);
        setTimeout(() => setVisible(true), 100);
      } catch {
        setMessage('Tidak dapat mengambil data dashboard. Coba refresh.');
      }
    };
    load();
  }, []);

  const avgProgress = goals.length
    ? Math.round(goals.reduce((a, g) => a + (Number(g.progress) || 0), 0) / goals.length)
    : 0;

  const getCardValue = (meta, budget) => {
    if (meta.alloc) return Number(budget?.allocation?.[meta.alloc] || 0);
    return Number(budget?.monthlyIncome || 0);
  };

  const GOAL_COLORS = [
    'linear-gradient(90deg, var(--accent), var(--accent-bright))',
    'linear-gradient(90deg, #fbbf24, #f59e0b)',
    'linear-gradient(90deg, #34d399, #10b981)',
    'linear-gradient(90deg, #f87171, #ef4444)',
    'linear-gradient(90deg, #a78bfa, #7c3aed)',
  ];

  return (
    <main className="dashboard-page">

      {/* ── WELCOME HERO ── */}
      <section className="panel welcome-panel" style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Halo, {profile?.name || 'Pengguna'} 👋</h1>
          <p className="panel-description">Ringkasan keuangan Anda hari ini dan rekomendasi alokasi budget.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LiveClock />
          <div className="strategy-badge">
            <div className="label">Strategi</div>
            <div className="value">{profile?.allocation_strategy || '50-30-20'}</div>
          </div>
        </div>
      </section>

      {/* ── STAT CARDS ── */}
      {!budget ? (
        <div className="info-box">{message || 'Memuat data keuangan...'}</div>
      ) : (
        <section className="grid-grid">
          {CARD_META.map((meta, i) => {
            const val = getCardValue(meta, budget);
            return (
              <article
                key={meta.key}
                className={`card ${i === 0 ? 'card-highlight' : ''}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'none' : 'translateY(20px) scale(0.97)',
                  transition: `opacity 0.5s ${0.1 + i * 0.08}s ease, transform 0.5s ${0.1 + i * 0.08}s ease`,
                }}
              >
                <div className="card-icon" style={{ background: meta.bg }}>
                  <span style={{ fontSize: '1.1rem', color: meta.color }}>{meta.icon}</span>
                </div>
                <h2>{meta.label}</h2>
                <p className="large" style={{ color: i === 0 ? 'var(--accent-bright)' : 'var(--text-primary)' }}>
                  Rp <AnimatedNumber value={val} />
                </p>
                {meta.alloc && (
                  <div className="card .sub" style={{ marginTop: 10 }}>
                    <div className="budget-bar">
                      <div
                        className={`budget-bar-filled ${meta.alloc === 'wants' ? 'wants' : meta.alloc === 'savings' ? 'savings' : ''}`}
                        style={{ width: `${Math.min(100, Math.round((val / (budget.monthlyIncome || 1)) * 100))}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      {Math.round((val / (budget.monthlyIncome || 1)) * 100)}% dari pendapatan
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* ── GOALS ── */}
      <section className="panel goal-panel" style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.5s 0.4s ease, transform 0.5s 0.4s ease',
      }}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Goal Progress</p>
            <h2>{goals.length ? 'Target Keuangan Anda' : 'Belum ada goals'}</h2>
          </div>
          <span className="stat-pill">
            Rata-rata {avgProgress}%
          </span>
        </div>

        {goals.length ? (
          <div className="goal-list">
            {goals.map((goal, idx) => {
              const progress = Math.min(100, Number(goal.progress) || 0);
              return (
                <div key={goal.id} className="goal-item" style={{ animationDelay: `${idx * 0.07}s` }}>
                  <div>
                    <p className="goal-title">{goal.goal_name}</p>
                    <p className="goal-meta">{goal.category} • Deadline: {goal.deadline}</p>
                  </div>
                  <div className="goal-progress">
                    <div
                      className="goal-bar"
                      style={{
                        width: `${goal.progress}%`,
                        background: GOAL_COLORS[idx % GOAL_COLORS.length],
                        animationDelay: `${0.4 + idx * 0.1}s`,
                      }}
                    />
                  </div>
                  <div className="goal-footer">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 8, height: 8, borderRadius: '50%',
                        background: GOAL_COLORS[idx % GOAL_COLORS.length].split(',')[1]?.trim() || 'var(--accent)',
                      }} />
                      {progress}% tercapai
                    </span>
                    <span>
                      Rp {Number(goal.current_amount || 0).toLocaleString('id-ID')}
                      <span style={{ color: 'var(--text-muted)' }}> / </span>
                      Rp {Number(goal.target_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }}>◎</div>
            <div>Tambahkan goal di halaman Goals untuk mulai merencanakan target Anda.</div>
          </div>
        )}
      </section>
    </main>
  );
}