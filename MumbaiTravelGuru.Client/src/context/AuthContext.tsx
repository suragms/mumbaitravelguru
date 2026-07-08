'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, setTokens, clearTokens, loadTokens, setTokenRefreshHandler, getStoredToken } from '@/lib/api';

interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roles: string[];
  created_at: string;
}

interface AuthResult {
  succeeded: boolean;
  token: string;
  refreshToken: string;
  user?: UserDto;
  error?: string;
}

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, firstName: string, lastName: string, phoneNumber: string) => Promise<AuthResult>;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<AuthResult>;
  googleLogin: (googleId: string, email: string, firstName: string, lastName: string) => Promise<AuthResult>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleTokenRefresh = useCallback((newToken: string, newRefresh: string) => {
    setToken(newToken);
  }, []);

  useEffect(() => {
    setTokenRefreshHandler(handleTokenRefresh);
  }, [handleTokenRefresh]);

  useEffect(() => {
    loadTokens();
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
      try {
        const storedUser = localStorage.getItem('mtg_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const handleAuthResult = useCallback((result: AuthResult) => {
    setTokens(result.token, result.refreshToken);
    setToken(result.token);
    setUser(result.user!);
    localStorage.setItem('mtg_user', JSON.stringify(result.user));
    return result;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<AuthResult>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!result.succeeded) throw new Error(result.error || 'Login failed');
    return handleAuthResult(result);
  }, [handleAuthResult]);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, phoneNumber: string) => {
    const result = await apiRequest<AuthResult>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName, phoneNumber }),
    });
    if (!result.succeeded) throw new Error(result.error || 'Registration failed');
    return handleAuthResult(result);
  }, [handleAuthResult]);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    const result = await apiRequest<{ succeeded: boolean; message: string }>('/api/v1/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
    if (!result.succeeded) throw new Error(result.message || 'Failed to send OTP');
  }, []);

  const verifyOtp = useCallback(async (phoneNumber: string, otp: string) => {
    const result = await apiRequest<AuthResult>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
    if (!result.succeeded) throw new Error(result.error || 'OTP verification failed');
    return handleAuthResult(result);
  }, [handleAuthResult]);

  const googleLogin = useCallback(async (googleId: string, email: string, firstName: string, lastName: string) => {
    const result = await apiRequest<AuthResult>('/api/v1/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ googleId, email, firstName, lastName }),
    });
    if (!result.succeeded) throw new Error(result.error || 'Google login failed');
    return handleAuthResult(result);
  }, [handleAuthResult]);

  const logout = useCallback(() => {
    clearTokens();
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) return;
    try {
      const result = await apiRequest<AuthResult>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          token: storedToken,
          refreshToken: localStorage.getItem('mtg_refresh'),
        }),
      });
      if (result.succeeded) {
        handleAuthResult(result);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [handleAuthResult, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      sendOtp,
      verifyOtp,
      googleLogin,
      logout,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
