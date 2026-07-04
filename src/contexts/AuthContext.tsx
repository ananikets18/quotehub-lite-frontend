import React, { createContext, useContext, useState, useEffect } from 'react';
import { logout as apiLogout, fetchAccountProfile } from '../api';

export type CurrentUser = {
  id: number;
  name: string;
  username?: string;
  email?: string;
  isOnboarded?: boolean;
  role?: string;
};

type AuthContextType = {
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  logout: () => Promise<void>;
  showAuthModal: 'login' | 'signup' | 'forgot-password' | null;
  setShowAuthModal: React.Dispatch<React.SetStateAction<'login' | 'signup' | 'forgot-password' | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('user');
    if (saved === 'undefined' || !saved) {
      localStorage.removeItem('user');
      return null;
    }
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | 'forgot-password' | null>(null);

  // Securely verify session and fetch true user data from backend on mount
  useEffect(() => {
    let mounted = true;
    
    // Only attempt to fetch if we have an initial localStorage entry
    // to avoid unnecessary 401 requests for completely anonymous users
    const saved = localStorage.getItem('user');
    if (!saved || saved === 'undefined') return;

    fetchAccountProfile()
      .then((data) => {
        if (mounted) {
          // The backend profile doesn't include isOnboarded in the GET /profile directly
          // Wait, the API returns the full user model which includes `role` and `is_onboarded`.
          const verifiedUser = {
            id: data.id,
            name: data.name,
            username: data.username,
            email: data.email,
            isOnboarded: data.isOnboarded,
            role: data.role // Capture role from server!
          };
          setCurrentUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        }
      })
      .catch((err) => {
        console.error('Session verification failed:', err);
        if (mounted) {
          setCurrentUser(null);
          localStorage.removeItem('user');
        }
      });
      
    return () => { mounted = false; };
  }, []);

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout, showAuthModal, setShowAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
