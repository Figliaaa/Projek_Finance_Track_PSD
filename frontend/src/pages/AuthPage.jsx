import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api';

/* Floating orb component */
function Orb({ style }) {
  return (
    <div style={{
      position: 'absolute',
      borderRadius: '50%',
      filter: 'blur(60px)',
      pointerEvents: 'none',
      animation: 'float 6s ease-in-out infinite',
      ...style,
    }} />
  );
}

export default function AuthPage({ onAuthSuccess }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const isRegister = location.pathname === '/register';

  const [form, setForm]       = useState({ name: '', email: '', password: '', allocation_strategy: '50-30-20', salary: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload  = isRegister ? form : { email: form.email, password: form.password };
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
      onAuthSuccess();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const STRATEGIES = [
    { value: '50-30-20', label: '50/30/20 — Klasik', desc: 'Kebutuhan / Keinginan / Tabungan' },
    { value: '40-10-50', label: '40/10/50 — Hemat',  desc: 'Kebutuhan / Keinginan / Tabungan' },
    { value: '60-20-20', label: '60/20/20 — Moderat', desc: 'Kebutuhan / Keinginan / Tabungan' },
  ];

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-h))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated orbs */}
      <Orb style={{ width: 400, height: 400, background: 'rgba(108,126,255,0.12)', top: '-10%', left: '-5%', animationDelay: '0s' }} />
      <Orb style={{ width: 300, height: 300, background: 'rgba(167,139,250,0.08)', bottom: '5%', right: '-5%', animationDelay: '2s' }} />
      <Orb style={{ width: 200, height: 200, background: 'rgba(52,211,153,0.06)', bottom: '20%', left: '20%', animationDelay: '4s' }} />

      <div style={{
        width: '100%',
        maxWidth: 480,
        position: 'relative',
        zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div className="panel" style={{
          borderRadius: 'var(--radius-xl)',
          padding: '48px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(108,126,255,0.1)',
        }}>

          {/* Logo / header */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, var(--accent), var(--violet))',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 32px var(--accent-glow)',
              animation: 'float 4s ease-in-out infinite',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4 20L10 11L15 15.5L21 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="21" cy="5.5" r="2.5" fill="white" opacity="0.8"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-bright) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 6,
            }}>
              {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isRegister ? 'Mulai perjalanan finansial Anda bersama FinTrack' : 'Masuk ke akun FinTrack Anda'}
            </p>
          </div>

          {/* Toggle login / register */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'var(--bg-base)',
            borderRadius: 999, padding: 4,
            marginBottom: 28,
          }}>
            {[
              { path: '/login',    label: 'Masuk' },
              { path: '/register', label: 'Daftar' },
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 999,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  transition: 'all var(--transition)',
                  color: location.pathname === path ? 'var(--accent-bright)' : 'var(--text-muted)',
                  background: location.pathname === path ? 'var(--accent-dim)' : 'transparent',
                  border: location.pathname === path ? '1px solid var(--border-accent)' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {isRegister && (
              <label>
                Nama Lengkap
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Budi Santoso"
                  required
                  autoFocus
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="budi@email.com"
                required
                autoFocus={!isRegister}
              />
            </label>

            <label>
              Password
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: '0.8rem', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 4,
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </label>

            {isRegister && (
              <>
                <label>
                  Pendapatan Bulanan (Rp)
                  <input
                    type="number"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="5000000"
                    required
                  />
                </label>

                <div>
                  <label style={{ marginBottom: 10, display: 'block' }}>Strategi Alokasi</label>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {STRATEGIES.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setForm({ ...form, allocation_strategy: s.value })}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${form.allocation_strategy === s.value ? 'var(--border-accent)' : 'var(--border)'}`,
                          background: form.allocation_strategy === s.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          color: form.allocation_strategy === s.value ? 'var(--accent-bright)' : 'var(--text-secondary)',
                          textAlign: 'left',
                          transition: 'all var(--transition)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.label}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="info-box error" style={{ animation: 'fadeIn 0.3s ease' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="button-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '14px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin-slow 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  {isRegister ? 'Membuat akun...' : 'Masuk...'}
                </span>
              ) : (
                isRegister ? '→ Buat Akun' : '→ Masuk ke Dashboard'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 20 }}>
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <Link to={isRegister ? '/login' : '/register'} style={{
              color: 'var(--accent-bright)', fontWeight: 700,
              transition: 'color var(--transition)',
            }}>
              {isRegister ? 'Masuk' : 'Daftar sekarang'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}