import { cookies } from "next/headers";
import { getTranslations, parseLocale, LOCALE_COOKIE } from "@/lib/i18n";
import LanguageSwitcher from "@/components/marketing/LanguageSwitcher";
import PricingToggle from "@/components/marketing/PricingToggle";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const isNL = locale === "nl";
  return {
    title: isNL
      ? "CertOS — Certificeringscoördinatie voor VCU, ISO en ISAE 3402"
      : "CertOS — Certification coordination for VCU, ISO and ISAE 3402",
    description: isNL
      ? "Begeleid bedrijven naar hun certificering. Trajecten, klantportaal, kennislaag en auditmodus in één werkstation."
      : "Guide companies to certification. Projects, client portal, knowledge layer and audit mode in one workstation.",
    openGraph: {
      title: "CertOS",
      description: isNL
        ? "Het werkstation voor certificeringscoördinatoren."
        : "The workstation for certification coordinators.",
      siteName: "CertOS",
    },
  };
}

const NORMS = ["VCU", "ISO 9001", "ISO 14001", "ISO 27001", "ISO 45001", "ISAE 3402"];

const s = {
  section: (bg = "var(--color-bone)"): React.CSSProperties => ({
    background: bg, padding: "80px 0",
  }),
  inner: (): React.CSSProperties => ({
    maxWidth: 1100, margin: "0 auto", padding: "0 26px",
  }),
  h2: (): React.CSSProperties => ({
    fontWeight: 800, fontSize: 28, color: "var(--color-navy)",
    letterSpacing: "-0.02em", marginBottom: 8,
  }),
  sub: (): React.CSSProperties => ({
    color: "var(--color-slate)", fontSize: 15, lineHeight: 1.6, marginBottom: 40,
  }),
};

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getTranslations(locale);

  return (
    <div style={{ fontFamily: "var(--font-archivo)", background: "var(--color-bone)", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: "var(--color-paper)", borderBottom: "1px solid var(--color-line)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 26px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2L4 9v13c0 8.3 6.8 15.4 16 17 9.2-1.6 16-8.7 16-17V9L20 2z" fill="#16294F"/>
              <path d="M14 20l4 4 8-8" stroke="#21A865" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 32c0-4 3-7 3-7" stroke="#21A865" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>
              <span style={{ color: "var(--color-navy)" }}>Cert</span><span style={{ color: "var(--color-green)" }}>OS</span>
            </span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <LanguageSwitcher locale={locale} />
            <a href="/auth/login" style={{ fontSize: 13.5, color: "var(--color-slate)", textDecoration: "none" }}>{t.nav.login}</a>
            <a href="/auth/login" style={{
              background: "var(--color-green)", color: "#fff", fontWeight: 700, fontSize: 13.5,
              padding: "7px 16px", borderRadius: 7, textDecoration: "none",
            }}>{t.nav.start}</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "var(--color-navy)", padding: "96px 0 80px", position: "relative", overflow: "hidden" }}>
        {/* Chevron decoration */}
        <div style={{ position: "absolute", right: -40, top: "50%", transform: "translateY(-50%)", opacity: 0.04, pointerEvents: "none" }}>
          <svg width="420" height="420" viewBox="0 0 100 100" fill="white"><path d="M10 20L50 60L90 20M10 50L50 90L90 50" stroke="white" strokeWidth="8" strokeLinecap="round" fill="none"/></svg>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 26px", position: "relative" }}>
          <h1 style={{ fontWeight: 800, fontSize: 42, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, maxWidth: 680, marginBottom: 20 }}>
            {t.hero.headline}
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, maxWidth: 560, marginBottom: 36 }}>
            {t.hero.sub}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <a href="/auth/login" style={{
              background: "var(--color-green)", color: "#fff", fontWeight: 700, fontSize: 15,
              padding: "13px 28px", borderRadius: 8, textDecoration: "none",
            }}>
              {t.hero.cta_primary}
            </a>
            <a href="#features" style={{
              background: "none", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 14,
              padding: "13px 24px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.25)", textDecoration: "none",
            }}>
              {t.hero.cta_secondary}
            </a>
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {t.hero.trust.map(badge => (
              <span key={badge} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                <span style={{ color: "var(--color-green)", fontWeight: 700 }}>✓</span>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background: "var(--color-paper)", borderBottom: "1px solid var(--color-line)", padding: "20px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 26px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--color-slate)", textTransform: "uppercase", flexShrink: 0 }}>
            {t.trust.label}
          </span>
          {NORMS.map(n => (
            <span key={n} style={{
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
              color: "var(--color-navy)", border: "1.5px solid var(--color-navy)",
              borderRadius: 4, padding: "3px 8px",
            }}>{n}</span>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={s.section("var(--color-bone)")}>
        <div style={s.inner()}>
          <h2 style={s.h2()}>{t.problem.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 32 }}>
            {t.problem.items.map(item => (
              <div key={item.title} style={{
                background: "var(--color-paper)", border: "1px solid var(--color-line)",
                borderRadius: 10, padding: "24px",
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-navy)", marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: "var(--color-slate)", lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={s.section("var(--color-paper)")}>
        <div style={s.inner()}>
          <h2 style={s.h2()}>{t.features.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 32 }}>
            {t.features.items.map(f => (
              <div key={f.tag} style={{
                border: "1px solid var(--color-line)", borderRadius: 10, padding: "28px 24px",
                background: "var(--color-bone)",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--color-green)", border: "1.5px solid var(--color-green)", borderRadius: 4, padding: "2px 7px", display: "inline-block", marginBottom: 14 }}>
                  {f.tag}
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "var(--color-slate)", lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.section("var(--color-bone)")}>
        <div style={s.inner()}>
          <h2 style={s.h2()}>{t.how.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 32 }}>
            {t.how.steps.map(step => (
              <div key={step.num} style={{ display: "flex", gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: "var(--color-navy)", color: "#fff",
                  fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-navy)", marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: "var(--color-slate)", lineHeight: 1.6 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={s.section("var(--color-paper)")}>
        <div style={s.inner()}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ ...s.h2(), textAlign: "center" }}>{t.pricing.title}</h2>
            <p style={{ ...s.sub(), marginBottom: 32, textAlign: "center" }}>{t.pricing.sub}</p>
          </div>
          <PricingToggle t={t} />
        </div>
      </section>

      {/* FAQ */}
      <section style={s.section("var(--color-bone)")}>
        <div style={{ ...s.inner(), maxWidth: 720 }}>
          <h2 style={s.h2()}>{t.faq.title}</h2>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 0 }}>
            {t.faq.items.map((item, i) => (
              <details key={i} style={{
                borderBottom: "1px solid var(--color-line)",
                padding: "18px 0",
              }}>
                <summary style={{
                  fontWeight: 600, fontSize: 15, color: "var(--color-navy)", cursor: "pointer",
                  listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  {item.q}
                  <span style={{ color: "var(--color-slate)", fontSize: 18, flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <p style={{ marginTop: 10, fontSize: 14, color: "var(--color-slate)", lineHeight: 1.65 }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{ background: "var(--color-navy)", padding: "80px 0" }}>
        <div style={{ ...s.inner(), textAlign: "center" }}>
          <h2 style={{ fontWeight: 800, fontSize: 30, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
            {t.cta_footer.title}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
            {t.cta_footer.sub}
          </p>
          <a href="/auth/login" style={{
            background: "var(--color-green)", color: "#fff", fontWeight: 700, fontSize: 15,
            padding: "14px 32px", borderRadius: 8, textDecoration: "none", display: "inline-block",
          }}>
            {t.cta_footer.button}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "var(--color-ink)", padding: "28px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            &copy; {new Date().getFullYear()} {t.footer.copyright} — {t.footer.tagline}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: t.footer.privacy, href: "/privacy" },
              { label: t.footer.terms, href: "/voorwaarden" },
              { label: t.footer.dpa, href: "/verwerkersovereenkomst" },
              { label: t.footer.cookies, href: "/cookies" },
            ].map(link => (
              <a key={link.href} href={link.href} style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
