import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationPrefs {
  emailDigest: boolean;
  emailProduct: boolean;
  emailReminders: boolean;
  pushEnabled: boolean;
}

interface SettingsState {
  locale: string;
  notifications: NotificationPrefs;
  reduceMotion: boolean;
  setLocale: (locale: string) => void;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "en",
      notifications: {
        emailDigest: true,
        emailProduct: true,
        emailReminders: true,
        pushEnabled: false,
      },
      reduceMotion: false,
      setLocale: (locale) => set({ locale }),
      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
      setReduceMotion: (value) => set({ reduceMotion: value }),
    }),
    { name: "gradelys:settings" }
  )
);
