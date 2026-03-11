'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';
import { authApi } from '@/lib/api';
import {
  auth,
  googleProvider,
  sendPasswordResetEmail,
  signOut,
  signInWithPopup,
} from '@/lib/firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          const { accessToken, refreshToken, user } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const msg = error.response?.data?.message || 'Email ou mot de passe incorrect';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(email, username, password);
          const { accessToken, refreshToken, user } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const msg = error.response?.data?.message || "Erreur d'inscription";
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth).catch(() => {});
          await authApi.logout();
        } catch {
          // ignore
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const credential = await signInWithPopup(auth, googleProvider);
          const firebaseToken = await credential.user.getIdToken();

          const baseUsername = (
            credential.user.displayName?.replace(/\s+/g, '').toLowerCase() ||
            credential.user.email!.split('@')[0]
          ).slice(0, 20);

          let response;
          try {
            response = await authApi.firebaseLogin(firebaseToken, baseUsername);
          } catch (err: any) {
            if (err.response?.status === 409) {
              const suffix = Math.floor(1000 + Math.random() * 9000);
              response = await authApi.firebaseLogin(firebaseToken, `${baseUsername}${suffix}`);
            } else {
              throw err;
            }
          }

          const { accessToken, refreshToken, user } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          const msg = firebaseErrorMessage(error.code) || error.response?.data?.message || 'Erreur Google Sign-In';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      sendPasswordReset: async (email: string) => {
        await sendPasswordResetEmail(auth, email);
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearError: () => set({ error: null }),
      checkAuth: () => {
        const token = localStorage.getItem('accessToken');
        if (!token) set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

function firebaseErrorMessage(code?: string): string | null {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'Aucun compte avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Le mot de passe doit faire au moins 6 caractères.',
    'auth/invalid-email': 'Email invalide.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  };
  return code ? (messages[code] ?? null) : null;
}
