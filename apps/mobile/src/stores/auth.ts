import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  trustScore: number;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ user, token });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    set({ user: null, token: null });
  },
  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync("token");
    const userStr = await SecureStore.getItemAsync("user");
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },
}));
