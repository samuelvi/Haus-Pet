import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { apiService } from '../services/api.service';
import type { User, Tokens, LoginData, SignupData } from '../types/api.types';

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async (): Promise<void> => {
      try {
        const storedTokens: string | null = localStorage.getItem('tokens');
        const storedSessionId: string | null = localStorage.getItem('sessionId');

        if (storedTokens && storedSessionId) {
          const parsedTokens: Tokens = JSON.parse(storedTokens);
          setTokens(parsedTokens);
          setSessionId(storedSessionId);

          // Fetch current user
          const currentUser: User = await apiService.getCurrentUser(
            parsedTokens.accessToken,
            storedSessionId
          );
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        // Clear invalid state
        localStorage.removeItem('tokens');
        localStorage.removeItem('sessionId');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (data: LoginData): Promise<void> => {
    try {
      const response = await apiService.login(data);

      setUser(response.user);
      setTokens(response.tokens);
      setSessionId(response.sessionId);

      // Persist to localStorage
      localStorage.setItem('tokens', JSON.stringify(response.tokens));
      localStorage.setItem('sessionId', response.sessionId);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    try {
      const response = await apiService.signup(data);

      setUser(response.user);
      setTokens(response.tokens);
      setSessionId(response.sessionId);

      // Persist to localStorage
      localStorage.setItem('tokens', JSON.stringify(response.tokens));
      localStorage.setItem('sessionId', response.sessionId);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (tokens && sessionId) {
        await apiService.logout(tokens.accessToken, sessionId);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear state regardless of API call result
      setUser(null);
      setTokens(null);
      setSessionId(null);
      localStorage.removeItem('tokens');
      localStorage.removeItem('sessionId');
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      if (!tokens || !sessionId) {
        throw new Error('No tokens or session to refresh');
      }

      const response = await apiService.refreshToken(
        tokens.refreshToken,
        sessionId
      );

      const newTokens: Tokens = response.tokens;
      setTokens(newTokens);

      // Update localStorage
      localStorage.setItem('tokens', JSON.stringify(newTokens));
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    sessionId,
    isAuthenticated: !!user && !!tokens && !!sessionId,
    isLoading,
    login,
    signup,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
