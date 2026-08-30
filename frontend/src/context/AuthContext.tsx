import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (email: string, password: string, name: string, currency?: string, timezone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.me();
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  };

  const loginDemo = async () => {
    try {
      await login('demo@example.com', 'password123');
    } catch (e) {
      // If demo user doesn't exist yet, register demo user
      await register('demo@example.com', 'password123', 'Demo User', 'INR', 'Asia/Kolkata');
    }
  };

  const register = async (email: string, password: string, name: string, currency = 'INR', timezone = 'Asia/Kolkata') => {
    const res = await authApi.register(email, password, name, currency, timezone);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = async (data: Partial<User>) => {
    const res = await authApi.updateSettings(data);
    setUser(res.user);
    localStorage.setItem('user', JSON.stringify(res.user));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginDemo, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
