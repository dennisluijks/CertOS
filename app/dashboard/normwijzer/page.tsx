"use client";

import { useState } from "react";
import { NORMS, NORM_INFO, controlsFor, GUIDE, type Norm } from "@/lib/norms";

function GuidePanel({ code, norm }: { code: string; norm: Norm }) {
  const g = GUIDE[code];
  const [ai, setAi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function deepen() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/guide-deepen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, norm }),
      });
      const data = await res.json();
      setAi(data.text ?? "Geen reactie ontvangen.");
    } catch {
      setAi("AI-uitleg niet beschikbaar; probeer later opnieuw.");
    }
    setBusy(false);
  }

  if (!g) return null;

  const sectionLabel: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-green)",
    margin: "10px 0 4px",
    display: "block",
  };

  return (
    <div style={{
      marginTop: 10,
      marginLeft: 86,
      background: "#FAFAF6",
      border: "1px solid #E8E9E0",
      borderRadius: 8,
      padding: "12px 14px",
      fontSize: 12.5,
      lineHeight: 1.55,
    }}>
      <span style={{ ...sectionLabel, marginTop: 0 }}>Wat houdt dit in</span>
      <div>{g.u}</div>

      <span style={sectionLabel}>Wat verwacht de auditor</span>
      <ul style={{ margin: "0 0 0 16px" }}>
        {g.v.map((x, i) => <li key={i}>{x}</li>)}
      </ul>

      <span style={sectionLabel}>Wat lever je aan</span>
      <ul style={{ margin: "0 0 0 16px" }}>
        {g.b.map((x, i) => <li key={i}>{x}</li>)}
      </ul>

      <span style={sectionLabel}>Zo vraag je het intern uit</span>
      <div style={{
        background: "#fff",
        borderLeft: "3px solid var(--color-green)",
        padding: "7px 10px",
        borderRadius: "0 6px 6px 0",
        fontStyle: "italic",
        color: "var(--color-slate)",
      }}>
        &ldquo;{g.q}&rdquo;
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => !busy && deepen()}
          disabled={busy}
          style={{
            background: "transparent",
            color: "var(--color-ink)",
            border: "1px solid var(--color-line)",
            borderRadius: 7,
            padding: "6px 11px",
            fontSize: 12,
            cursor: busy ? "default" : "pointer",
            fontFamily: "var(--font-archivo)",
          }}
        >
          {busy ? "…" : "Verdieping (AI)"}
        </button>
      </div>

      {ai && (
        <pre style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          background: "#FAFAF6",
          border: "1px solid var(--color-line)",
          borderRadius: 8,
          padding: 14,
          lineHeight: 1.55,
          marginTop: 10,
        }}>
          {ai}
        </pre>
      )}
    </div>
  );
}

function ControlRow({ code, name, desc, norm }: { code: string; name: string; desc: string; norm: Norm }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "11px 14px", borderTop: "1px solid #EFF0E9" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "74px 1fr 100px", gap: 12, alignItems: "start", cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600, color: "var(--color-slate)", paddingTop: 2 }}>{code}</span>
        <div>
          <b style={{ fontSize: 13.5, display: "block" }}>{name}</b>
          <small style={{ color: "var(--color-slate)", fontSize: 12, lineHeight: 1.45 }}>{desc}</small>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-green)", fontWeight: 600 }}>
            {open ? "uitleg ▾" : "uitleg ▸"}
          </span>
        </div>
      </div>
      {open && <GuidePanel code={code} norm={norm} />}
    </div>
  );
}

export default function NormwijzerPage() {
  const [norm, setNorm] = useState<Norm>("VCU");
  const info = NORM_INFO[norm];
  const controls = controlsFor(norm);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>Normwijzer</div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3 }}>
        Spiekbrief per norm: wat is het, waar let de auditor op en wat moet er per maatregel liggen
      </div>

      {/* Norm tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "2px solid var(--color-line)", margin: "18px 0 14px", overflowX: "auto" }}>
        {NORMS.map(n => (
          <button
            key={n}
            onClick={() => setNorm(n)}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: norm === n ? "var(--color-navy)" : "var(--color-slate)",
              borderBottom: `2.5px solid ${norm === n ? "var(--color-green)" : "transparent"}`,
              marginBottom: -2,
              whiteSpace: "nowrap",
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Norm info card */}
      <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <b style={{ fontSize: 15 }}>{norm} · {info.titel}</b>
        <div style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>{info.uitleg}</div>
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5, color: "var(--color-amber)" }}>
          <b>Let op:</b> {info.letop}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {info.links.map(([text, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-sky)",
                border: "1px solid var(--color-line)",
                borderRadius: 5,
                padding: "4px 9px",
                textDecoration: "none",
                background: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              ↗ {text}
            </a>
          ))}
        </div>
      </div>

      {/* Controls list */}
      <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, padding: 0, overflow: "hidden" }}>
        {controls.map(([code, name, desc]) => (
          <ControlRow key={code} code={code} name={name} desc={desc} norm={norm} />
        ))}
      </div>
    </div>
  );
}
