"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database";

export default function InstellingenPage() {
  const [workspace, setWorkspace] = useState<Tables<"workspaces"> | null>(null);
  const [name, setName] = useState("");
  const [accentColor, setAccentColor] = useState("#21A865");
  const [logoUrl, setLogoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.from("workspaces").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        setWorkspace(data);
        setName(data.name);
        setAccentColor(data.accent_color ?? "#21A865");
        setLogoUrl(data.logo_url ?? "");
      }
    });
  }, []);

  async function save() {
    if (!workspace || !name.trim()) return;
    setLoading(true);
    await supabase.from("workspaces").update({
      name: name.trim(),
      accent_color: accentColor,
      logo_url: logoUrl.trim() || null,
    }).eq("id", workspace.id);
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "var(--color-slate)",
    display: "block",
    marginBottom: 5,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    borderRadius: 7,
    border: "1px solid var(--color-line)",
    fontFamily: "var(--font-archivo)",
    color: "var(--color-ink)",
    background: "#fff",
  };

  if (!workspace) {
    return <div style={{ color: "var(--color-slate)", fontSize: 13.5 }}>Laden…</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>Workspace-instellingen</div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3 }}>
        Naam, accentkleur en logo worden zichtbaar in het klantportaal
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, padding: 24, marginTop: 20, maxWidth: 560 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Naam van de workspace</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Accentkleur (klantportaal)</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              style={{ width: 48, height: 38, padding: 2, border: "1px solid var(--color-line)", borderRadius: 7, cursor: "pointer" }}
            />
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              padding: "9px 12px",
              border: "1px solid var(--color-line)",
              borderRadius: 7,
              background: "var(--color-bone)",
            }}>
              {accentColor.toUpperCase()}
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 7, background: accentColor, border: "1px solid var(--color-line)" }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Logo-URL (optioneel, voor klantportaal)</label>
          <input
            style={inputStyle}
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://jouwdomein.nl/logo.svg"
          />
          <div style={{ fontSize: 12, color: "var(--color-slate)", marginTop: 5 }}>
            Gebruik een publiek bereikbare afbeelding (SVG of PNG, max 200px hoog).
            Als je geen logo instelt, wordt het CertOS-schild gebruikt.
          </div>
        </div>

        <button
          onClick={save}
          disabled={loading}
          style={{
            background: loading ? "var(--color-green-tint)" : "var(--color-green)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            padding: "11px 24px",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-archivo)",
          }}
        >
          {loading ? "Opslaan…" : "Opslaan"}
        </button>

        {saved && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-green)", fontWeight: 600 }}>
            Dat is geregeld.
          </div>
        )}
      </div>

    </div>
  );
}
