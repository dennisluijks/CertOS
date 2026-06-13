"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DOC_STATUS, DOC_COLOR } from "@/lib/norms";
import type { Tables } from "@/types/database";

interface Props {
  documents: Tables<"documents">[];
  projectMap: Record<string, { id: string; norm: string; tenant_id: string }>;
  tenantMap: Record<string, string>;
}

function daysTo(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function DocumentenClient({ documents: initialDocs, projectMap, tenantMap }: Props) {
  const [docs, setDocs] = useState(initialDocs);
  const [links, setLinks] = useState<Record<string, string>>(
    Object.fromEntries(initialDocs.map(d => [d.id, d.link ?? ""]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = createClient();

  async function aanleveren(docId: string) {
    const link = links[docId]?.trim();
    if (!link) {
      alert("Plak eerst een link naar het document (bijv. SharePoint of Google Drive).");
      return;
    }
    setSaving(docId);
    const { error } = await supabase
      .from("documents")
      .update({ link, status: 1 })
      .eq("id", docId);
    if (!error) {
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, link, status: 1 } : d));
    }
    setSaving(null);
  }

  const pending = docs.filter(d => d.status === 0);
  const received = docs.filter(d => d.status >= 1);

  if (docs.length === 0) {
    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Documenten
        </div>
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-slate)", fontSize: 13.5, border: "1.5px dashed var(--color-line)", borderRadius: 10 }}>
          Er zijn geen documenten aan jou toegewezen.
        </div>
      </div>
    );
  }

  function DocCard({ doc }: { doc: Tables<"documents"> }) {
    const project = projectMap[doc.project_id];
    const tenantName = project ? tenantMap[project.tenant_id] : "—";
    const d = daysTo(doc.due);
    const isPending = doc.status === 0;

    return (
      <div style={{
        background: "#fff",
        border: `1px solid ${isPending ? "var(--color-amber)" : "var(--color-line)"}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: isPending ? 12 : 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.name}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 5, alignItems: "center', flexWrap: 'wrap" }}>
              <span style={{ fontSize: 12, color: "var(--color-slate)" }}>
                {tenantName} · {project?.norm ?? "—"}
              </span>
              {doc.due && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: d !== null && d < 0 ? "var(--color-red)" : d !== null && d <= 3 ? "var(--color-amber)" : "var(--color-slate)",
                }}>
                  {d !== null && d < 0 ? `${-d}d te laat` : d === 0 ? "vandaag" : new Date(doc.due).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 4,
            border: `1.5px solid ${DOC_COLOR[doc.status]}`,
            color: DOC_COLOR[doc.status],
            flexShrink: 0,
          }}>
            {DOC_STATUS[doc.status]}
          </span>
        </div>

        {/* Aanleverveld */}
        {isPending && (
          <div>
            <div style={{ fontSize: 13, color: "var(--color-slate)", marginBottom: 8 }}>
              Plak de link naar het document (SharePoint, Google Drive, of een andere locatie).
              Je coördinator valideert het daarna.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={links[doc.id] ?? ""}
                onChange={e => setLinks(prev => ({ ...prev, [doc.id]: e.target.value }))}
                placeholder="https://..."
                style={{ flex: 1, padding: "8px 11px", fontSize: 13, borderRadius: 7, border: "1px solid var(--color-line)", fontFamily: "var(--font-archivo)" }}
              />
              <button
                onClick={() => aanleveren(doc.id)}
                disabled={saving === doc.id || !links[doc.id]?.trim()}
                style={{
                  background: "var(--color-green)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving === doc.id ? "default" : "pointer",
                  fontFamily: "var(--font-archivo)",
                  whiteSpace: "nowrap",
                }}
              >
                {saving === doc.id ? "…" : "Aangeleverd"}
              </button>
            </div>
          </div>
        )}

        {/* Aangeleverd: toon link */}
        {!isPending && doc.link && (
          <div style={{ marginTop: 8 }}>
            <a
              href={doc.link}
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
              }}
            >
              ↗ Document bekijken
            </a>
            <span style={{ fontSize: 12, color: "var(--color-slate)", marginLeft: 10 }}>
              Je coördinator valideert dit document.
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 4 }}>
        Documenten
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginBottom: 20 }}>
        Lever documenten aan door een link te plakken. Je coördinator valideert ze daarna.
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-amber)", marginBottom: 8 }}>
            Gevraagd ({pending.length})
          </div>
          {pending.map(d => <DocCard key={d.id} doc={d} />)}
        </div>
      )}

      {received.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-slate)", marginBottom: 8 }}>
            Aangeleverd ({received.length})
          </div>
          {received.map(d => <DocCard key={d.id} doc={d} />)}
        </div>
      )}
    </div>
  );
}
