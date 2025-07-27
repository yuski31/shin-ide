import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';

export const useAuth = () => {
  const {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    setUser,
    setTokens,
    setLoading,
    login,
    logout,
    updateUser,
  } = useAuthStore();

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      if (tokens?.accessToken) {
        try {
          setLoading(true);
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      login(response.user, response.tokens);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleRegister = async (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      login(response.user, response.tokens);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      if (tokens?.accessToken) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  };

  const refreshToken = async () => {
    try {
      if (tokens?.refreshToken) {
        const response = await authService.refreshToken(tokens.refreshToken);
        setTokens(response.tokens);
        return response.tokens;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  return {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshToken,
    updateUser,
  };
};
