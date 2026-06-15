"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/useLocale";
import { getTranslations, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { useState, useEffect } from "react";

interface CoordinatorNavProps {
  workspaceName: string;
  accentColor: string;
  logoUrl?: string | null;
  unreadActivities: number;
  userEmail: string;
  userName?: string | null;
}

type NavKey = "dashboard" | "actiecentrum" | "week" | "klanten" | "normwijzer" | "nieuw" | "backup" | "instellingen";

const NAV_ITEMS: { href: string; key: NavKey; exact?: boolean; icon: React.ReactNode }[] = [
  { href: "/dashboard", key: "dashboard", exact: true, icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )},
  { href: "/dashboard/actiecentrum", key: "actiecentrum", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
  { href: "/dashboard/week", key: "week", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { href: "/dashboard/klanten", key: "klanten", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { href: "/dashboard/normwijzer", key: "normwijzer", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  )},
  { href: "/dashboard/nieuw", key: "nieuw", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )},
  { href: "/dashboard/backup", key: "backup", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
  { href: "/dashboard/instellingen", key: "instellingen", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )},
];

function LogoMark({ accentColor }: { accentColor: string }) {
  return (
    <svg width="28" height="32" viewBox="0 0 100 116" fill="none" aria-hidden="true">
      <path d="M50 5 L89 27 V61 L50 83 L11 61 V27 Z" stroke="#FFFFFF" strokeWidth="9" fill="none" strokeLinejoin="round"/>
      <path d="M31 42 L46 57 L73 29" stroke={accentColor} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 80 L50 98 L85 80" stroke={accentColor} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M15 94 L50 112 L85 94" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export default function CoordinatorNav({
  workspaceName,
  accentColor,
  unreadActivities,
  userEmail,
  userName,
}: CoordinatorNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { locale, setLocale } = useLocale();
  const t = getTranslations(locale);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function switchLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    setLocale(next);
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="cert-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark accentColor={accentColor} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "#fff" }}>
            Cert<span style={{ color: accentColor }}>OS</span>
          </span>
        </div>
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Menu openen"
          style={{ all: "unset", cursor: "pointer", color: "#EAF0FA", display: "flex", alignItems: "center" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Mobile backdrop */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 199 }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`cert-nav${navOpen ? " open" : ""}`}
        style={{
          background: "var(--color-navy)",
          color: "#EAF0FA",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile close button */}
        <div className="cert-nav-close">
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Menu sluiten"
            style={{ all: "unset", cursor: "pointer", color: "#7E93C4", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
          >
            ✕
          </button>
        </div>

        {/* Logo */}
        <Link href="/dashboard" style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid #24407A",
          display: "flex",
          gap: 10,
          alignItems: "center",
          textDecoration: "none",
          color: "inherit",
        }}>
          <svg width="30" height="35" viewBox="0 0 100 116" fill="none" aria-hidden="true">
            <path d="M50 5 L89 27 V61 L50 83 L11 61 V27 Z" stroke="#FFFFFF" strokeWidth="9" fill="none" strokeLinejoin="round"/>
            <path d="M31 42 L46 57 L73 29" stroke={accentColor} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 80 L50 98 L85 80" stroke={accentColor} strokeWidth="8" fill="none" strokeLinecap="round"/>
            <path d="M15 94 L50 112 L85 94" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>
              Cert<span style={{ color: accentColor }}>OS</span>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              letterSpacing: "0.14em",
              color: "#7E93C4",
              marginTop: 2,
              textTransform: "uppercase",
            }}>
              {workspaceName}
            </div>
          </div>
        </Link>

        {/* Navigatie */}
        <nav style={{ padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact);
            const isActiecentrum = item.key === "actiecentrum";
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "9px 12px",
                  borderRadius: 6,
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#fff" : "#AFC0DE",
                  background: active ? "#22386B" : "transparent",
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{t.nav[item.key]}</span>
                {isActiecentrum && unreadActivities > 0 && (
                  <span style={{
                    background: "#B23A2E",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: 10,
                    minWidth: 20,
                    textAlign: "center",
                  }}>
                    {unreadActivities > 99 ? "99+" : unreadActivities}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Gebruiker + taalswitch */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #24407A" }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
            {(["nl", "en"] as Locale[]).map((l, i) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  padding: "3px 7px",
                  borderRadius: 4,
                  border: locale === l ? "1.5px solid #7E93C4" : "1.5px solid transparent",
                  background: locale === l ? "#1E3566" : "none",
                  color: locale === l ? "#fff" : "#7E93C4",
                  cursor: "pointer",
                  marginRight: i === 0 ? 2 : 0,
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#7E93C4", marginBottom: 4, fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName ?? userEmail}
          </div>
          <button
            onClick={signOut}
            style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "#AFC0DE" }}
          >
            {t.nav.uitloggen}
          </button>
        </div>
      </aside>
    </>
  );
}
