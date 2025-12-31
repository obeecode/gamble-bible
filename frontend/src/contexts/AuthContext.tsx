import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { useAuth };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = React.useCallback(() => {
    console.log('Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing auth...');
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        console.log('Found stored credentials, verifying...');
        try {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify token is still valid
          const response = await authAPI.getMe();
          if (response.success && response.data.user) {
            console.log('Token verified successfully');
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            console.log('Token verification failed');
            logout();
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          logout();
        }
      } else {
        console.log('No stored credentials found');
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (email: string, password: string) => {
    console.log('Attempting login...');
    try {
      const response = await authAPI.login({ email, password });
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log('Login successful, setting user and token');
        
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('User set:', user);
        console.log('Token set:', token);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    console.log('Attempting signup...');
    try {
      const response = await authAPI.signup({ name, email, password });
      console.log('Signup response:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log('Signup successful, setting user and token');
        
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('User set:', user);
        console.log('Token set:', token);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};