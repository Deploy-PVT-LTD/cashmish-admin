import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('admin_user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('token');
      }
    } else {
      // If either is missing, clear everything
      localStorage.removeItem('admin_user');
      localStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);

    // Check if user has admin role (reject strictly normal 'user' role)
    if (response.user?.role === 'user') {
      throw new Error('Access denied. Only admins can login to this panel.');
    }

    const userData = response.user;
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
