import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL for SSO token from Tverse
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('token');
    const ssoRole = params.get('role');
    const ssoName = params.get('name');

    if (ssoToken) {
      localStorage.setItem('tverse_token', ssoToken);
      const userData = { role: ssoRole || 'EMPLOYEE', fullName: ssoName || 'Tverse User' };
      localStorage.setItem('tverse_user', JSON.stringify(userData));
      setUser(userData);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Load from local storage
      const storedToken = localStorage.getItem('tverse_token');
      const storedUser = localStorage.getItem('tverse_user');
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('tverse_user');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone, pin) => {
    const data = await authApi.login({ phoneNumber: phone, securityPin: pin });
    localStorage.setItem('tverse_token', data.token);
    const userData = { role: data.role, fullName: data.fullName };
    localStorage.setItem('tverse_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('tverse_token');
    localStorage.removeItem('tverse_user');
    setUser(null);
    // Global Logout: redirect to Tverse logout which clears its session and redirects back
    window.location.href = 'http://www.tverse-erp.in/logout?redirect=http://localhost:5173/login';
  };

  if (loading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
