import { NavLink, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',   icon: '⬡' },
  { to: '/goals',        label: 'Goals',       icon: '◎' },
  { to: '/transactions', label: 'Transaksi',   icon: '⇅' },
  { to: '/analytics',    label: 'Analytics',   icon: '∿' },
  { to: '/budget',       label: 'Budget',      icon: '◈' },
];

export default function NavBar({ isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  return (
    <header className="app-shell">
      <div className="logo">
        <div className="logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 14L6.5 8L10 11.5L14 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="14" cy="4.5" r="2" fill="white" opacity="0.8"/>
          </svg>
        </div>
        FinTrack
      </div>

      <nav>
        {isAuthenticated ? (
          <>
            {NAV_ITEMS.map(({ to, label, icon }) => (
              <NavLink key={to} to={to}>
                <span className="nav-icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </>
        ) : (
          <>
            <NavLink to="/login">Masuk</NavLink>
            <NavLink to="/register">Daftar</NavLink>
          </>
        )}
      </nav>

      {isAuthenticated && (
        <button onClick={handleLogout} className="nav-logout">
          ⎋ Keluar
        </button>
      )}
    </header>
  );
}