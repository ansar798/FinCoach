// src/App.tsx
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Import from './pages/Import'
import Transactions from './pages/Transactions'
import { useAuth } from './hooks/useAuth'
import { useUserData } from './hooks/useUserData'
import './App.css'

export default function App() {
  const { user, signOut, ready } = useAuth();
  const { userData } = useUserData(user?.uid);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Only show header on dashboard and import page, not on login screen
  const showHeader = location.pathname === '/dashboard' || location.pathname === '/import';

  // Show loading while checking authentication
  if (!ready) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <header className="app-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <h1 className="app-title">FinCoach</h1>
                      {user && (
            <div className="user-badge">
              <span>User</span>
              <span>{userData?.displayName || user.displayName || user.email?.split('@')[0] || 'User'}</span>
            </div>
          )}
          </div>
          <nav className="app-nav">
            <Link to="/dashboard">Dashboard</Link>
            {user ? (
              <button 
                className="sign-out-btn"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            ) : (
              <Link to="/">Login</Link>
            )}
          </nav>
        </header>
      )}
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/import" 
          element={user ? <Import /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/transactions" 
          element={user ? <Transactions /> : <Navigate to="/" replace />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}