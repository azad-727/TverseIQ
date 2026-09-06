import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BackgroundAurora } from '../components/ui/BackgroundAurora';
import { useToast } from '../hooks/useApi';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, pin);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BackgroundAurora variant="indigo" />
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>TverseIQ</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Login with your Tverse credentials</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Phone Number" 
            type="text" 
            placeholder="Enter phone number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input 
            label="Security PIN" 
            type="password" 
            placeholder="Enter 4-digit PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" style={{ marginTop: '16px' }} loading={loading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
