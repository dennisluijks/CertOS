"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import { NORMS, phasesFor, controlsFor } from "@/lib/norms";

type Tenant = Pick<Tables<"tenants">, "id" | "name">;

const KINDS = ["Certificering", "Hercertificering"] as const;

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--color-slate)",
  marginBottom: 5,
  display: "block",
};

const field: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13.5,
  border: "1px solid var(--color-line)",
  borderRadius: 7,
  background: "#fff",
  color: "var(--color-ink)",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--color-line)",
  borderRadius: 10,
  padding: 24,
  maxWidth: 580,
};

export default function NieuwTrajectPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState("");
  const [norm, setNorm] = useState<string>(NORMS[0]);
  const [kind, setKind] = useState<string>(KINDS[0]);
  const [auditDate, setAuditDate] = useState("");
  const [ci, setCi] = useState("");
  const [bureau, setBureau] = useState("");
  const [budget, setBudget] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .single();
      if (!ws) { setLoading(false); return; }
      const { data } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("workspace_id", ws.id)
        .order("name");
      setTenants(data ?? []);
      if (data && data.length > 0) setTenantId(data[0].id);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) { setError("Selecteer een klant."); return; }
    setSaving(true);
    setError(null);

    const { data: ws } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1)
      .single();
    if (!ws) { setError("Geen workspace gevonden."); setSaving(false); return; }

    const wsId = ws.id;

    // 1. Insert project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        workspace_id: wsId,
        tenant_id: tenantId,
        norm,
        kind,
        audit_date: auditDate || null,
        ci: ci || null,
        bureau: bureau || null,
        budget_max: budget,
      })
      .select("id")
      .single();

    if (projErr || !project) {
      setError(projErr?.message ?? "Fout bij aanmaken project.");
      setSaving(false);
      return;
    }

    const projectId = project.id;

    // 2. Insert phases + tasks
    const phases = phasesFor(norm as Parameters<typeof phasesFor>[0], kind);
    for (let i = 0; i < phases.length; i++) {
      const [phaseName, taskNames] = phases[i];
      const { data: phase, error: phaseErr } = await supabase
        .from("phases")
        .insert({
          workspace_id: wsId,
          project_id: projectId,
          name: phaseName,
          position: i,
        })
        .select("id")
        .single();

      if (phaseErr || !phase) continue;

      for (let j = 0; j < taskNames.length; j++) {
        await supabase.from("tasks").insert({
          workspace_id: wsId,
          phase_id: phase.id,
          name: taskNames[j],
          position: j,
        });
      }
    }

    // 3. Insert controls
    const controls = controlsFor(norm as Parameters<typeof controlsFor>[0]);
    for (const [code, name, description] of controls) {
      await supabase.from("controls").insert({
        workspace_id: wsId,
        project_id: projectId,
        code,
        name,
        description,
      });
    }

    router.push(`/dashboard/trajecten/${projectId}`);
  }

  if (loading) {
    return (
      <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: 20 }}>
        Laden…
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 6 }}>
        Nieuw traject
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginBottom: 24 }}>
        Vul de gegevens in om een certificeringstraject te starten.
      </div>

      <div style={card}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            {/* Klant */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label}>Klant</label>
              {tenants.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--color-slate)", padding: "9px 0" }}>
                  Geen klanten gevonden.{" "}
                  <a href="/dashboard/klanten" style={{ color: "var(--color-green)", fontWeight: 600 }}>
                    Voeg eerst een klant toe →
                  </a>
                </div>
              ) : (
                <select
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                  style={field}
                  required
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Norm */}
            <div>
              <label style={label}>Norm</label>
              <select
                value={norm}
                onChange={e => setNorm(e.target.value)}
                style={field}
              >
                {NORMS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label style={label}>Type</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value)}
                style={field}
              >
                {KINDS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Streefdatum audit */}
            <div>
              <label style={label}>Streefdatum audit</label>
              <input
                type="date"
                value={auditDate}
                onChange={e => setAuditDate(e.target.value)}
                style={field}
              />
            </div>

            {/* CI */}
            <div>
              <label style={label}>CI (certificerende instelling)</label>
              <input
                type="text"
                value={ci}
                onChange={e => setCi(e.target.value)}
                placeholder="bijv. Lloyds, DNV, Bureau Veritas"
                style={field}
              />
            </div>

            {/* Bureau */}
            <div>
              <label style={label}>Bureau</label>
              <input
                type="text"
                value={bureau}
                onChange={e => setBureau(e.target.value)}
                placeholder="Naam adviesbureau"
                style={field}
              />
            </div>

            {/* Budget */}
            <div>
              <label style={label}>Maximaal budget (uren)</label>
              <input
                type="number"
                min={0}
                value={budget || ""}
                onChange={e => setBudget(Number(e.target.value))}
                placeholder="bijv. 40"
                style={field}
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "#FDF2F0",
              border: "1px solid var(--color-red)",
              borderRadius: 7,
              color: "var(--color-red)",
              fontSize: 13.5,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={saving || tenants.length === 0}
              style={{
                background: "var(--color-green)",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "10px 22px",
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Aanmaken…" : "Traject aanmaken"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: "#fff",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                borderRadius: 7,
                padding: "10px 18px",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
