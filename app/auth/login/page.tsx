"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signInWithEmail() {
    if (!email.trim()) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 8,
    border: "1.5px solid var(--color-line)",
    fontSize: 14,
    fontFamily: "var(--font-archivo)",
    marginBottom: 10,
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bone)" }}>
      <div style={{
        background: "#fff",
        border: "1px solid var(--color-line)",
        borderRadius: 12,
        padding: "40px 48px",
        maxWidth: 440,
        width: "100%",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 32 }}>
          <svg width="44" height="52" viewBox="0 0 100 116" fill="none" aria-hidden="true">
            <path d="M50 5 L89 27 V61 L50 83 L11 61 V27 Z" stroke="var(--color-navy)" strokeWidth="9" fill="none" strokeLinejoin="round"/>
            <path d="M31 42 L46 57 L73 29" stroke="var(--color-green)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 80 L50 98 L85 80" stroke="var(--color-green)" strokeWidth="8" fill="none" strokeLinecap="round"/>
            <path d="M15 94 L50 112 L85 94" stroke="var(--color-navy)" strokeWidth="8" fill="none" strokeLinecap="round"/>
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", color: "var(--color-navy)" }}>
              Cert<span style={{ color: "var(--color-green)" }}>OS</span>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-slate)",
              marginTop: 2,
            }}>
              Certificeringsbeheer
            </div>
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-navy)", marginBottom: 8 }}>
          Inloggen bij CertOS
        </div>

        {!emailMode ? (
          <>
            <div style={{ fontSize: 13.5, color: "var(--color-slate)", marginBottom: 32, lineHeight: 1.55 }}>
              Log in met Google of ontvang een inloglink op je e-mailadres.
            </div>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: "11px 20px",
                borderRadius: 8,
                border: "1.5px solid var(--color-line)",
                background: loading ? "var(--color-bone)" : "#fff",
                color: "var(--color-ink)",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                fontFamily: "var(--font-archivo)",
                marginBottom: 10,
              }}
            >
              {loading ? (
                <span className="spin" style={{ borderColor: "var(--color-navy)", borderTopColor: "transparent" }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? "Doorsturen…" : "Doorgaan met Google"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.06em" }}>of</span>
              <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
            </div>

            <button
              onClick={() => setEmailMode(true)}
              style={{
                width: "100%",
                padding: "11px 20px",
                borderRadius: 8,
                border: "1.5px solid var(--color-line)",
                background: "#fff",
                color: "var(--color-ink)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-archivo)",
              }}
            >
              Inloggen met e-mailadres
            </button>
          </>
        ) : sent ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-navy)", marginBottom: 8 }}>
              Check je inbox
            </div>
            <div style={{ fontSize: 13.5, color: "var(--color-slate)", lineHeight: 1.6 }}>
              We hebben een inloglink gestuurd naar <b>{email}</b>. Klik op de link in de mail om in te loggen.
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{ marginTop: 20, background: "none", border: "none", color: "var(--color-green)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
            >
              Ander e-mailadres gebruiken
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13.5, color: "var(--color-slate)", marginBottom: 24, lineHeight: 1.55 }}>
              Vul je e-mailadres in. Je ontvangt een inloglink — geen wachtwoord nodig.
            </div>
            <input
              type="email"
              placeholder="jouw@emailadres.nl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && signInWithEmail()}
              autoFocus
              style={inputStyle}
            />
            <button
              onClick={signInWithEmail}
              disabled={loading || !email.trim()}
              style={{
                width: "100%",
                padding: "11px 20px",
                borderRadius: 8,
                border: "none",
                background: loading || !email.trim() ? "var(--color-line)" : "var(--color-navy)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !email.trim() ? "default" : "pointer",
                fontFamily: "var(--font-archivo)",
                marginBottom: 10,
              }}
            >
              {loading ? "Versturen…" : "Stuur inloglink"}
            </button>
            <button
              onClick={() => setEmailMode(false)}
              style={{ background: "none", border: "none", color: "var(--color-slate)", fontSize: 13, cursor: "pointer" }}
            >
              ← Terug
            </button>
          </>
        )}

        <div style={{ marginTop: 28, fontSize: 12, color: "var(--color-slate)", lineHeight: 1.6 }}>
          Jij coordineert, CertOS weet.
        </div>
      </div>
    </div>
  );
}
