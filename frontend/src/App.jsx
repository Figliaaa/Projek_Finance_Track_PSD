import { useEffect, useState } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import BudgetPage from './pages/BudgetPage.jsx';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    // Validate token on app startup
    const token = localStorage.getItem('token');
    if (token) {
      // Try to validate the token by making a simple API call
      import('./api').then(module => {
        module.default.get('/api/user/profile')
          .then(() => {
            setIsAuthenticated(true);
          })
          .catch(() => {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
          });
      });
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="app-root">
      <NavBar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
