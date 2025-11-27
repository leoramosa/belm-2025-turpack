import { create } from "zustand";
import { StateCreator } from "zustand";
import { PersistOptions } from "zustand/middleware";
import { persist } from "zustand/middleware";
import type { WooProfile } from "@/components/MyAccountProfilePage";

export interface AuthUser {
  user_email?: string;
  email?: string;
  user_login?: string;
  user_display_name?: string;
  nicename?: string;
  displayName?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  id?: number;
  token?: string;
}

export interface UserState {
  user: AuthUser | null;
  token: string | null;
  setUser: (user: AuthUser | null, token?: string) => void;
  logout: () => void;
  profile: WooProfile | null;
  setProfile: (profile: WooProfile) => void;
  updateProfileOptimistic: (partial: Partial<WooProfile>) => void;
}

type MyPersist = (
  config: StateCreator<UserState>,
  options: PersistOptions<UserState>
) => StateCreator<UserState>;

export const useUserStore = create<UserState>(
  (persist as MyPersist)(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user: AuthUser | null, token?: string) =>
        set({ user, token: token ?? null }),
      logout: () => set({ user: null, token: null, profile: null }),
      profile: null,
      setProfile: (profile: WooProfile) => set({ profile }),
      updateProfileOptimistic: (partial: Partial<WooProfile>) => {
        const current = get().profile;
        if (!current) return;
        set({ profile: { ...current, ...partial } });
      },
    }),
    {
      name: "user-storage", // clave en localStorage
      // No usar partialize, zustand persist ya maneja serialización básica
    }
  )
);
