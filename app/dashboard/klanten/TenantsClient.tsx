"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database";
import InvitationsBlock from "./InvitationsBlock";

interface Props {
  workspaceId: string;
  initialTenants: Tables<"tenants">[];
  projectCounts: Record<string, number>;
}

export default function TenantsClient({ workspaceId, initialTenants, projectCounts }: Props) {
  const [tenants, setTenants] = useState(initialTenants);
  const [form, setForm] = useState<null | Partial<Tables<"tenants">>>(null);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const emptyForm = { id: undefined, name: "", contact: "", email: "", sector: "" };

  async function save() {
    if (!form?.name?.trim()) return;
    if (form.id) {
      const { data } = await supabase
        .from("tenants")
        .update({ name: form.name, contact: form.contact ?? "", email: form.email ?? "", sector: form.sector ?? "" })
        .eq("id", form.id)
        .select()
        .single();
      if (data) setTenants(ts => ts.map(t => t.id === data.id ? data : t));
    } else {
      const { data } = await supabase
        .from("tenants")
        .insert({ workspace_id: workspaceId, name: form.name, contact: form.contact ?? "", email: form.email ?? "", sector: form.sector ?? "" })
        .select()
        .single();
      if (data) setTenants(ts => [...ts, data]);
    }
    setForm(null);
    router.refresh();
  }

  async function deleteTenant(id: string, name: string) {
    if (!confirm(`${name} en alle bijbehorende trajecten verwijderen?`)) return;
    await supabase.from("tenants").delete().eq("id", id);
    setTenants(ts => ts.filter(t => t.id !== id));
    router.refresh();
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 11px" };
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

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>Klanten</div>
          <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3 }}>Elke klant is een eigen omgeving met eigen trajecten</div>
        </div>
        <button
          onClick={() => setForm(emptyForm)}
          style={{ background: "var(--color-green)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "9px 16px", borderRadius: 7, border: "none", cursor: "pointer" }}
        >
          + Klant toevoegen
        </button>
      </div>

      {form && (
        <div style={{ background: "#fff", border: "1px solid var(--color-green)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Bedrijfsnaam *</label><input style={inputStyle} value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="bijv. ENGR B.V." autoFocus /></div>
            <div><label style={labelStyle}>Sector</label><input style={inputStyle} value={form.sector ?? ""} onChange={e => setForm({ ...form, sector: e.target.value })} /></div>
            <div><label style={labelStyle}>Contactpersoon</label><input style={inputStyle} value={form.contact ?? ""} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
            <div><label style={labelStyle}>E-mail</label><input style={inputStyle} value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={save} style={{ background: "var(--color-green)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer" }}>Opslaan</button>
            <button onClick={() => setForm(null)} style={{ background: "transparent", color: "var(--color-ink)", border: "1px solid var(--color-line)", fontWeight: 500, fontSize: 13, padding: "8px 16px", borderRadius: 7, cursor: "pointer" }}>Annuleren</button>
          </div>
        </div>
      )}

      {tenants.length === 0 && !form && (
        <div style={{ padding: 30, textAlign: "center", color: "var(--color-slate)", fontSize: 13.5, border: "1.5px dashed var(--color-line)", borderRadius: 10 }}>
          Nog geen klanten. Voeg de eerste toe.
        </div>
      )}

      {tenants.map(t => (
        <div key={t.id} style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.name}</div>
              <div style={{ color: "var(--color-slate)", fontSize: 12.5, marginTop: 2 }}>
                {[t.sector, t.contact, t.email].filter(Boolean).join(" · ") || "Geen details"}
              </div>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--color-slate)" }}>
              {projectCounts[t.id] ?? 0} traject{(projectCounts[t.id] ?? 0) === 1 ? "" : "en"}
            </span>
            <button
              onClick={() => setSelectedTenant(selectedTenant === t.id ? null : t.id)}
              style={{ background: "transparent", color: "var(--color-slate)", border: "1px solid var(--color-line)", fontSize: 12, padding: "6px 11px", borderRadius: 7, cursor: "pointer", fontWeight: 500 }}
            >
              Portaaltoegang
            </button>
            <button
              onClick={() => setForm({ id: t.id, name: t.name, contact: t.contact ?? "", email: t.email ?? "", sector: t.sector ?? "" })}
              style={{ background: "transparent", color: "var(--color-ink)", border: "1px solid var(--color-line)", fontSize: 12, padding: "6px 11px", borderRadius: 7, cursor: "pointer", fontWeight: 500 }}
            >
              Bewerken
            </button>
            <button
              onClick={() => deleteTenant(t.id, t.name)}
              style={{ background: "transparent", color: "var(--color-red)", border: "1px solid var(--color-line)", fontSize: 12, padding: "6px 11px", borderRadius: 7, cursor: "pointer", fontWeight: 500 }}
            >
              Verwijderen
            </button>
          </div>
          {selectedTenant === t.id && (
            <div style={{ borderTop: "1px solid var(--color-line)", padding: 16 }}>
              <InvitationsBlock tenantId={t.id} workspaceId={workspaceId} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
