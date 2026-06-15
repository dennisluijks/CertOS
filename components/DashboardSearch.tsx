"use client";

import { useState, useRef, useEffect } from "react";

export type SearchItem = {
  type: "klant" | "traject" | "taak" | "document" | "afwijking" | "diploma";
  label: string;
  sub?: string;
  href: string;
};

const TYPE_LABEL: Record<string, string> = {
  klant: "Klanten",
  traject: "Trajecten",
  taak: "Taken",
  document: "Documenten",
  afwijking: "Afwijkingen",
  diploma: "Diploma's & certificaten",
};

const TYPE_ORDER = ["klant", "traject", "taak", "document", "afwijking", "diploma"];

export default function DashboardSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const q = query.toLowerCase().trim();
  const results = q.length < 2
    ? []
    : items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        (i.sub && i.sub.toLowerCase().includes(q))
      ).slice(0, 20);

  const grouped = TYPE_ORDER.reduce((acc, t) => {
    const hits = results.filter(r => r.type === t);
    if (hits.length) acc[t] = hits.slice(0, 5);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const hasResults = results.length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", marginBottom: 20 }}>
      <div style={{ position: "relative" }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-slate)", pointerEvents: "none" }}
        >
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Zoek klant, traject, taak, document, afwijking…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{
            width: "100%",
            padding: "10px 12px 10px 34px",
            borderRadius: 8,
            border: "1px solid var(--color-line)",
            fontSize: 13.5,
            fontFamily: "var(--font-archivo)",
            background: "#fff",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {open && q.length >= 2 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid var(--color-line)",
          borderRadius: 9,
          boxShadow: "0 6px 20px rgba(0,0,0,0.09)",
          zIndex: 200,
          overflow: "hidden",
          maxHeight: 420,
          overflowY: "auto",
        }}>
          {hasResults ? Object.entries(grouped).map(([type, hits]) => (
            <div key={type}>
              <div style={{ padding: "7px 12px 4px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-slate)", background: "var(--color-bone)", borderBottom: "1px solid var(--color-line)" }}>
                {TYPE_LABEL[type]}
              </div>
              {hits.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", fontSize: 13, color: "var(--color-ink)", textDecoration: "none", borderBottom: "1px solid #F2F3EE" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bone)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                  {item.sub && (
                    <span style={{ fontSize: 11.5, color: "var(--color-slate)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{item.sub}</span>
                  )}
                </a>
              ))}
            </div>
          )) : (
            <div style={{ padding: "14px 12px", fontSize: 13, color: "var(--color-slate)" }}>
              Geen resultaten voor &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
