"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n/nl";

export default function PricingToggle({ t }: { t: Translations }) {
  const [yearly, setYearly] = useState(false);

  const plans = t.pricing.plans;

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
        <span style={{ fontSize: 13.5, color: yearly ? "var(--color-slate)" : "var(--color-navy)", fontWeight: yearly ? 400 : 600 }}>
          {t.pricing.toggle_month}
        </span>
        <button
          onClick={() => setYearly(y => !y)}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: yearly ? "var(--color-green)" : "var(--color-line)",
            border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
          }}
          aria-label="Toggle jaarlijks/maandelijks"
        >
          <span style={{
            position: "absolute", top: 3, left: yearly ? 23 : 3, width: 18, height: 18,
            borderRadius: "50%", background: "#fff", transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }} />
        </button>
        <span style={{ fontSize: 13.5, color: yearly ? "var(--color-navy)" : "var(--color-slate)", fontWeight: yearly ? 600 : 400 }}>
          {t.pricing.toggle_year}
          {yearly && (
            <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-green)", border: "1.5px solid var(--color-green)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em" }}>
              {t.pricing.year_discount.toUpperCase()}
            </span>
          )}
        </span>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
        {plans.map((plan, i) => {
          const isPopular = i === 1;
          const price = yearly ? plan.price_year : plan.price_month;
          const isFree = price === "0";
          return (
            <div key={plan.name} style={{
              background: "var(--color-paper)",
              border: isPopular ? "2px solid var(--color-navy)" : "1px solid var(--color-line)",
              borderRadius: 10,
              padding: "28px 24px",
              position: "relative",
              display: "flex", flexDirection: "column",
            }}>
              {isPopular && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "var(--color-navy)", color: "#fff",
                  fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                  padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap",
                }}>
                  {t.pricing.most_popular.toUpperCase()}
                </div>
              )}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.07em", color: "var(--color-slate)", marginBottom: 8, textTransform: "uppercase" }}>
                {plan.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 32, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>
                  {isFree ? "Gratis" : `€${price}`}
                </span>
                {!isFree && (
                  <span style={{ fontSize: 13, color: "var(--color-slate)" }}>{t.pricing.per_month}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-slate)", marginBottom: 20, lineHeight: 1.4 }}>
                {plan.description}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "var(--color-ink)", padding: "5px 0", borderBottom: "1px solid var(--color-line-soft, #eee)" }}>
                    <span style={{ color: "var(--color-green)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/login"
                style={{
                  display: "block", textAlign: "center",
                  background: isPopular ? "var(--color-green)" : "none",
                  color: isPopular ? "#fff" : "var(--color-navy)",
                  border: isPopular ? "none" : "1.5px solid var(--color-navy)",
                  fontWeight: 700, fontSize: 14, padding: "10px 20px",
                  borderRadius: 7, textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                {plan.cta}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
