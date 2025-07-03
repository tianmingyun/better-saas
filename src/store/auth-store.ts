import { authClient } from '@/lib/auth/auth-client';
import type { User } from 'better-auth/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;

  initialize: () => Promise<void>;

  clearAuth: () => void;
}

// 为 SSR 创建一个 NoOp 存储，避免 hydration 问题
const createNoopStorage = () => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setInitialized: (initialized) => {
        set({ isInitialized: initialized });
      },

      signIn: async (email, password) => {
        set({ isLoading: true });

        try {
          const result = await authClient.signIn.email({
            email,
            password,
          });

          if (result.data) {
            set({
              user: result.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return {
            success: false,
            error: result.error?.message || '登录失败',
          };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : '登录失败',
          };
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true });

        try {
          const result = await authClient.signUp.email({
            email,
            password,
            name: name || '',
          });

          if (result.data) {
            set({
              user: result.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return {
            success: false,
            error: result.error?.message || '注册失败',
          };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : '注册失败',
          };
        }
      },

      signOut: async () => {
        set({ isLoading: true });

        try {
          await authClient.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('退出登录失败:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      signInWithGithub: async () => {
        set({ isLoading: true });

        try {
          await authClient.signIn.social({
            provider: 'github',
          });
        } catch (error) {
          set({ isLoading: false });
          console.error('GitHub 登录失败:', error);
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });

        try {
          await authClient.signIn.social({
            provider: 'google',
          });
        } catch (error) {
          set({ isLoading: false });
          console.error('Google 登录失败:', error);
        }
      },

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true });

        try {
          const session = await authClient.getSession();

          if (session.data) {
            set({
              user: session.data.user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          }
        } catch (error) {
          console.error('初始化认证状态失败:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : createNoopStorage()
      ),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 1,
      skipHydration: true,
    }
  )
);

// SSR 安全的 hooks - 使用 Zustand 的原生 SSR 支持
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthInitialized = () => useAuthStore((state) => state.isInitialized);

export const useAuth = () =>
  useAuthStore((state) => ({
    signIn: state.signIn,
    signUp: state.signUp,
    signOut: state.signOut,
    signInWithGithub: state.signInWithGithub,
    signInWithGoogle: state.signInWithGoogle,
    initialize: state.initialize,
    clearAuth: state.clearAuth,
  }));
