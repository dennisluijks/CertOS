"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [accentColor, setAccentColor] = useState("#21A865");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function createWorkspace() {
    const supabase = createClient();
    if (!workspaceName.trim()) {
      setError("Vul een naam in voor je workspace.");
      return;
    }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessie verlopen. Log opnieuw in."); setLoading(false); return; }

    const { data: workspace, error: wsErr } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName.trim(),
        owner_user_id: user.id,
        accent_color: accentColor,
      })
      .select("id")
      .single();

    if (wsErr || !workspace) {
      setError("Er ging iets mis. Probeer opnieuw.");
      setLoading(false);
      return;
    }

    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bone)" }}>
      <div style={{
        background: "#fff",
        border: "1px solid var(--color-line)",
        borderRadius: 12,
        padding: "40px 48px",
        maxWidth: 520,
        width: "100%",
      }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: "var(--color-navy)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Welkom bij CertOS
        </div>
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, marginBottom: 32, lineHeight: 1.55 }}>
          Stel eerst je workspace in. Dit is de omgeving waar al je klanten en trajecten
          in komen. Je kunt dit later altijd aanpassen.
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--color-slate)",
            display: "block",
            marginBottom: 6,
          }}>
            Naam van je workspace *
          </label>
          <input
            value={workspaceName}
            onChange={e => setWorkspaceName(e.target.value)}
            placeholder="bijv. Jouw Naam Consultancy"
            style={{ width: "100%", padding: "10px 12px", fontSize: 14 }}
            onKeyDown={e => e.key === "Enter" && createWorkspace()}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--color-slate)",
            display: "block",
            marginBottom: 6,
          }}>
            Accentkleur (voor het klantportaal)
          </label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              style={{ width: 48, height: 36, padding: 2, border: "1px solid var(--color-line)", borderRadius: 7, cursor: "pointer" }}
            />
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--color-ink)",
              padding: "8px 12px",
              border: "1px solid var(--color-line)",
              borderRadius: 7,
              background: "var(--color-bone)",
            }}>
              {accentColor.toUpperCase()}
            </div>
            <div style={{ width: 40, height: 36, borderRadius: 7, background: accentColor, border: "1px solid var(--color-line)" }} />
          </div>
        </div>

        {error && (
          <div style={{ color: "var(--color-red)", fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <button
          onClick={createWorkspace}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px 20px",
            background: loading ? "var(--color-green-tint)" : "var(--color-green)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 8,
            border: "none",
            cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-archivo)",
          }}
        >
          {loading ? "Workspace aanmaken…" : "Workspace aanmaken"}
        </button>
      </div>
    </div>
  );
}
