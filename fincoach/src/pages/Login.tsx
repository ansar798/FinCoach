// src/pages/Login.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserData } from "../hooks/useUserData";
import { importCsv } from "../lib/importCsv";
import { useState } from "react";

export default function Login() {
  const { user, ready, signIn, signUp } = useAuth();
  const { userData } = useUserData(user?.uid);
  const [file, setFile] = useState<File|null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        // Navigate to dashboard after successful sign in
        nav('/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(formData.email, formData.password, formData.name);
        setSuccess('Account created successfully! You can now sign in.');
        // Clear form after successful registration
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setIsLogin(true); // Switch to login tab
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };



  async function handleImport() {
    if (!user || !file) return alert("Please sign in and choose a CSV first.");
    await importCsv(user.uid, file);
    nav("/dashboard");
  }

  if (!ready) return <div className="login-container"><p>Loading…</p></div>;

  if (user) {
    return (
      <div className="login-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)'
          }}>
            FC
          </div>
          <h2 style={{margin: 0, color: '#333', fontSize: '2.5rem', fontWeight: '700'}}>FinCoach</h2>
        </div>
        <h3 style={{marginBottom: '1rem', color: '#666', fontWeight: '400'}}>Welcome back, {userData?.displayName || user.displayName || 'User'}!</h3>
        <p style={{marginBottom: '2rem', color: '#666', lineHeight: '1.6'}}>
          Ready to analyze your finances? Import your CSV data to get started.
        </p>
        
        <div className="file-input-container">
          <input 
            type="file" 
            accept=".csv" 
            onChange={e=>setFile(e.target.files?.[0]||null)}
            className="file-input"
          />
          <button className="btn" onClick={handleImport}>Import CSV</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: 'white',
          boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)'
        }}>
          FC
        </div>
        <h2 style={{margin: 0, color: '#333', fontSize: '2.5rem', fontWeight: '700'}}>FinCoach</h2>
      </div>
      <h3 style={{marginBottom: '1rem', color: '#666', fontWeight: '400'}}>Welcome to your smart financial coach</h3>
      <p style={{marginBottom: '2rem', color: '#666', lineHeight: '1.6'}}>
        Your smart financial coach that transforms transaction data into personalized insights.
      </p>
      
      <div style={{
        background: 'rgba(40, 167, 69, 0.1)',
        border: '1px solid rgba(40, 167, 69, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem',
        fontSize: '0.9rem'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
          <span style={{color: '#28a745'}}>Lock</span>
          <strong style={{color: '#28a745'}}>Secure & Private</strong>
        </div>
        <div style={{color: '#666', fontSize: '0.85rem'}}>
          • Data encrypted with Firebase security<br/>
          • No data shared with third parties<br/>
          • Bank-level security standards
        </div>
      </div>

      <div className="form-container">
        <div className="form-tabs">
          <button 
            className={`form-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={`form-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'grid', gap: '1rem'}}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{fontSize: '1.1rem', padding: '1rem 2rem'}}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}