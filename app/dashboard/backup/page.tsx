"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState("");
  const supabase = createClient();

  async function exportWorkspace() {
    setLoading(true);
    try {
      const { data: workspace } = await supabase.from("workspaces").select("*").limit(1).single();
      if (!workspace) { alert("Geen workspace gevonden."); setLoading(false); return; }
      const wsId = workspace.id;

      const [
        { data: tenants },
        { data: projects },
        { data: phases },
        { data: tasks },
        { data: controls },
        { data: documents },
        { data: findings },
        { data: risks },
        { data: hours },
        { data: logEntries },
        { data: expiries },
      ] = await Promise.all([
        supabase.from("tenants").select("*").eq("workspace_id", wsId),
        supabase.from("projects").select("*").eq("workspace_id", wsId),
        supabase.from("phases").select("*").eq("workspace_id", wsId),
        supabase.from("tasks").select("*").eq("workspace_id", wsId),
        supabase.from("controls").select("*").eq("workspace_id", wsId),
        supabase.from("documents").select("*").eq("workspace_id", wsId),
        supabase.from("findings").select("*").eq("workspace_id", wsId),
        supabase.from("risks").select("*").eq("workspace_id", wsId),
        supabase.from("hours").select("*").eq("workspace_id", wsId),
        supabase.from("log_entries").select("*").eq("workspace_id", wsId),
        supabase.from("expiries").select("*").eq("workspace_id", wsId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        version: 1,
        workspace,
        tenants,
        projects,
        phases,
        tasks,
        controls,
        documents,
        findings,
        risks,
        hours,
        log_entries: logEntries,
        expiries,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export mislukt: " + (e as Error).message);
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>Back-up</div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3 }}>
        Exporteer een volledige JSON-back-up van je workspace
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, padding: 24, marginTop: 20, maxWidth: 560 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Workspace exporteren</div>
        <div style={{ fontSize: 13.5, color: "var(--color-slate)", marginBottom: 20, lineHeight: 1.55 }}>
          De export bevat alle klanten, trajecten, fasen, taken, maatregelen, documenten, bevindingen,
          risico&apos;s, uren, logboekregels en vervaldata. Sla het bestand op een veilige plek op.
        </div>

        <button
          onClick={exportWorkspace}
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
          {loading ? "Exporteren…" : "Exporteren als JSON"}
        </button>

        <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--color-bone)", borderRadius: 8, fontSize: 12.5, color: "var(--color-slate)", lineHeight: 1.55 }}>
          <b style={{ color: "var(--color-ink)" }}>Let op:</b> De back-up bevat geen wachtwoorden of
          authenticatiegegevens. Gebruikersaccounts zijn gekoppeld via Google en staan bij Supabase.
        </div>
      </div>

      {imported && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-green-tint)", borderRadius: 8, fontSize: 13, color: "#157A49" }}>
          Dat is geregeld.
        </div>
      )}
      {importError && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#FDF2F1", borderRadius: 8, fontSize: 13, color: "var(--color-red)" }}>
          {importError}
        </div>
      )}
    </div>
  );
}
