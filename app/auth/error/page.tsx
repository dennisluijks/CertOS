import Link from "next/link";

export default function AuthErrorPage() {
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
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-red)", marginBottom: 12 }}>
          Inloggen mislukt
        </div>
        <div style={{ fontSize: 13.5, color: "var(--color-slate)", marginBottom: 28, lineHeight: 1.55 }}>
          Er ging iets mis bij het inloggen. Probeer opnieuw, of neem contact op met je
          coördinator als je een uitnodiging hebt ontvangen.
        </div>
        <Link
          href="/auth/login"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "var(--color-green)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Opnieuw proberen
        </Link>
      </div>
    </div>
  );
}
