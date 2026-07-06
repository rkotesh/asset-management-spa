import { create } from 'zustand';
import apiClient from '../api/apiClient';

const isClient = typeof window !== 'undefined';

export const useAuthStore = create((set, get) => ({
  token: isClient ? localStorage.getItem('token') : null,
  user: (isClient && localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : null,
  isLoading: false,

  setCredentials: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  clearCredentials: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      const { token, user } = res.data;
      get().setCredentials(token, user);
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, user } = res.data;
      get().setCredentials(token, user);
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    get().clearCredentials();
  },

  updateProfile: (updatedUser) => {
    const currentUser = get().user || {};
    const newUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUser));
    set({ user: newUser });
  }
}));
