"use client";

import * as React from "react";
import { dictionary, rtlLocales, type Locale } from "./translations";
import { useSettingsStore } from "@/stores/settings-store";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSettingsStore((s) => s.locale) as Locale;
  const setLocaleStore = useSettingsStore((s) => s.setLocale);
  const dir: "ltr" | "rtl" = rtlLocales.includes(locale) ? "rtl" : "ltr";

  const t = React.useCallback(
    (key: string) => dictionary[locale]?.[key] ?? dictionary.en[key] ?? key,
    [locale]
  );

  React.useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: setLocaleStore, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
