import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  getToken,
  removeToken,
  fetchCurrentUser,
  loginUser,
  registerUser,
} from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  quickLoginDemo: () => Promise<void>;
  quickLoginAdmin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin' || Boolean(user?.is_superuser);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    const existingToken = getToken();

    if (existingToken) {
      try {
        const profile = await fetchCurrentUser();
        setUser(profile);
        setTokenState(existingToken);
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn('Existing session token invalid, auto-recovering...');
        removeToken();
        setTokenState(null);
      }
    }

    // Auto-bootstrap demo session for frictionless button access
    try {
      const auth = await loginUser('demo', 'DemoPass123!');
      setUser(auth.user);
      setTokenState(auth.access_token);
    } catch (err) {
      console.warn('Auto demo login unavailable:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = async (emailOrUsername: string, password: string) => {
    const auth = await loginUser(emailOrUsername, password);
    setUser(auth.user);
    setTokenState(auth.access_token);
    setIsAuthModalOpen(false);
  };

  const register = async (email: string, username: string, password: string) => {
    const auth = await registerUser(email, username, password);
    setUser(auth.user);
    setTokenState(auth.access_token);
    setIsAuthModalOpen(false);
  };

  const quickLoginDemo = async () => {
    await login('demo', 'DemoPass123!');
  };

  const quickLoginAdmin = async () => {
    await login('admin', 'AdminPass123!');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        quickLoginDemo,
        quickLoginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
