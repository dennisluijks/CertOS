"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  function switchTo(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    router.refresh();
  }

  const base: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    padding: "4px 8px",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
    background: "none",
    transition: "color 0.15s, background 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <button
        onClick={() => switchTo("nl")}
        style={{ ...base, color: locale === "nl" ? "var(--color-navy)" : "var(--color-slate)", background: locale === "nl" ? "var(--color-navytint)" : "none" }}
        aria-current={locale === "nl"}
      >
        NL
      </button>
      <span style={{ color: "var(--color-line)", fontSize: 12 }}>|</span>
      <button
        onClick={() => switchTo("en")}
        style={{ ...base, color: locale === "en" ? "var(--color-navy)" : "var(--color-slate)", background: locale === "en" ? "var(--color-navytint)" : "none" }}
        aria-current={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
