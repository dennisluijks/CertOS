"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bone)" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: "var(--color-navy)", marginBottom: 8 }}>
          Er ging iets mis
        </div>
        <div style={{ color: "var(--color-slate)", fontSize: 14, marginBottom: 24 }}>
          Er is een onverwachte fout opgetreden. Probeer het opnieuw.
        </div>
        <button
          onClick={reset}
          style={{ background: "var(--color-green)", color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer" }}
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
