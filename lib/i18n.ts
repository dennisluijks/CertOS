import { nl } from "./i18n/nl";
import { en } from "./i18n/en";
import type { Translations } from "./i18n/nl";

export type Locale = "nl" | "en";
export const LOCALE_COOKIE = "cert-os-locale";
export const DEFAULT_LOCALE: Locale = "nl";

export function getTranslations(locale: Locale): Translations {
  return locale === "en" ? en : nl;
}

export function parseLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "nl";
}
