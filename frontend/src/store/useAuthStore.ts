import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@shared/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (tokens) => set({ tokens }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: (user, tokens) => set({ 
        user, 
        tokens, 
        isAuthenticated: true, 
        isLoading: false 
      }),
      
      logout: () => set({ 
        user: null, 
        tokens: null, 
        isAuthenticated: false, 
        isLoading: false 
      }),
      
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
