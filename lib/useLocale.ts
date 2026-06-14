"use client";

import { useState, useEffect, useCallback } from "react";
import { parseLocale, type Locale, LOCALE_COOKIE } from "./i18n";

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const [locale, setLocaleState] = useState<Locale>("nl");

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    setLocaleState(parseLocale(match?.[1]));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    setLocaleState(next);
  }, []);

  return { locale, setLocale };
}
