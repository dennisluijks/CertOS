"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import {
  CTRL_STATUS, CTRL_COLOR,
  DOC_STATUS, DOC_COLOR,
  FIND_STATUS, FIND_COLOR,
  RISK_STATUS, RISK_COLOR,
  // HOUR_CATS, EXP_TYPES, (tabs verborgen)
  GUIDE,
} from "@/lib/norms";

// ─── Types ───────────────────────────────────────────────────────────────────

type Project = Tables<"projects">;
type Phase = Tables<"phases">;
type Task = Tables<"tasks">;
type Control = Tables<"controls">;
type Document = Tables<"documents">;
type Finding = Tables<"findings">;
type Risk = Tables<"risks">;
type HourRow = Tables<"hours">;
type LogEntry = Tables<"log_entries">;
type Expiry = Tables<"expiries">;

interface TenantMember {
  user_id: string;
  role: string;
  profiles: { full_name: string | null; email: string } | null;
}

interface Props {
  project: Project;
  tenant: Pick<Tables<"tenants">, "id" | "name" | "contact" | "email"> | null;
  workspace: { id: string; name: string; accent_color: string };
  phases: Phase[];
  tasks: Task[];
  controls: Control[];
  documents: Document[];
  findings: Finding[];
  risks: Risk[];
  hours: HourRow[];
  logEntries: LogEntry[];
  expiries: Expiry[];
  tenantMembers: TenantMember[];
  tenantContacts: TenantContact[];
  coordinatorName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

function daysTo(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const S: Record<string, React.CSSProperties> = {
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "var(--color-slate)",
    marginBottom: 5,
    display: "block",
  },
  input: {
    padding: "7px 10px",
    fontSize: 13,
    border: "1px solid var(--color-line)",
    borderRadius: 7,
    background: "#fff",
    color: "var(--color-ink)",
  },
  card: {
    background: "#fff",
    border: "1px solid var(--color-line)",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  btnPrimary: {
    background: "var(--color-green)",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  btnGhost: {
    background: "#fff",
    color: "var(--color-ink)",
    border: "1px solid var(--color-line)",
    borderRadius: 7,
    padding: "7px 14px",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
  },
  btnDanger: {
    background: "transparent",
    color: "var(--color-red)",
    border: "1px solid var(--color-line)",
    borderRadius: 7,
    padding: "6px 11px",
    fontSize: 12,
    cursor: "pointer",
  },
};

function Stamp({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "3px 9px",
      borderRadius: 4,
      border: `1.5px solid ${color}`,
      color,
      display: "inline-block",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── Markdown renderer (voor AI-output) ───────────────────────────────────────

function renderInlineMd(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
  );
}

function MarkdownText({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--color-ink)" }}>
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        if (t.startsWith("### ")) return <div key={i} style={{ fontWeight: 700, fontSize: 13, color: "var(--color-navy)", marginTop: 10, marginBottom: 2 }}>{t.slice(4)}</div>;
        if (t.startsWith("## ")) return <div key={i} style={{ fontWeight: 800, fontSize: 14, color: "var(--color-navy)", marginTop: 14, marginBottom: 4 }}>{t.slice(3)}</div>;
        if (t.startsWith("# ")) return <div key={i} style={{ fontWeight: 800, fontSize: 15, color: "var(--color-navy)", marginTop: 16, marginBottom: 6 }}>{t.slice(2)}</div>;
        if (t.startsWith("- ") || t.startsWith("* ")) return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 2, paddingLeft: 4 }}>
            <span style={{ color: "var(--color-green)", flexShrink: 0, fontWeight: 700 }}>•</span>
            <span>{renderInlineMd(t.slice(2))}</span>
          </div>
        );
        const num = t.match(/^(\d+)\.\s/);
        if (num) return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4 }}>
            <span style={{ color: "var(--color-navy)", fontWeight: 700, minWidth: 18, flexShrink: 0 }}>{num[1]}.</span>
            <span>{renderInlineMd(t.slice(num[0].length))}</span>
          </div>
        );
        return <div key={i} style={{ marginBottom: 2 }}>{renderInlineMd(t)}</div>;
      })}
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "fasen", label: "Fasen" },
  { id: "maatregelen", label: "Maatregelen" },
  { id: "documenten", label: "Documenten" },
  { id: "afwijkingen", label: "Afwijkingen" },
  { id: "verbeterpunten", label: "Verbeterpunten" },
  { id: "logboek", label: "Logboek" },
  { id: "planning", label: "Planning" },
  { id: "ai", label: "AI-coach" },
  { id: "auditmode", label: "Auditmodus" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── FasenTab ─────────────────────────────────────────────────────────────────

function FasenTab({ phases, tasks, project, workspace, tenantContacts, coordinatorName, onRefresh }: {
  phases: Phase[];
  tasks: Task[];
  project: Project;
  workspace: { id: string };
  tenantContacts: TenantContact[];
  coordinatorName: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTaskName, setNewTaskName] = useState<Record<string, string>>({});
  const [newPhaseName, setNewPhaseName] = useState("");
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>(
    () => Object.fromEntries(tasks.map(t => [t.id, t.owner ?? ""]))
  );
  useEffect(() => {
    setOwnerMap(Object.fromEntries(tasks.map(t => [t.id, t.owner ?? ""])));
  }, [tasks]);

  function tasksByPhase(phaseId: string) {
    return tasks.filter(t => t.phase_id === phaseId);
  }

  async function toggleTask(task: Task) {
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
    onRefresh();
  }

  async function updateTask(taskId: string, field: Partial<Task>) {
    await supabase.from("tasks").update(field).eq("id", taskId);
    onRefresh();
  }

  async function updatePhase(phaseId: string, field: Partial<Phase>) {
    await supabase.from("phases").update(field).eq("id", phaseId);
    onRefresh();
  }

  async function addTask(phaseId: string) {
    const name = newTaskName[phaseId]?.trim();
    if (!name) return;
    const phaseTasks = tasksByPhase(phaseId);
    await supabase.from("tasks").insert({
      workspace_id: workspace.id,
      phase_id: phaseId,
      name,
      position: phaseTasks.length,
    });
    setNewTaskName(prev => ({ ...prev, [phaseId]: "" }));
    onRefresh();
  }

  async function addPhase() {
    const name = newPhaseName.trim();
    if (!name) return;
    await supabase.from("phases").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      name,
      position: phases.length,
    });
    setNewPhaseName("");
    onRefresh();
  }

  return (
    <div>
      {phases.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "20px 0" }}>
          Geen fasen gevonden.
        </div>
      )}
      {phases.map(phase => {
        const phaseTasks = tasksByPhase(phase.id);
        const done = phaseTasks.filter(t => t.done).length;
        const pct = phaseTasks.length > 0 ? Math.round((done / phaseTasks.length) * 100) : 0;
        const open = expanded[phase.id] !== false;

        return (
          <div key={phase.id} style={S.card}>
            {/* Phase header */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              onClick={() => setExpanded(prev => ({ ...prev, [phase.id]: !open }))}
            >
              <span style={{
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                color: "var(--color-slate)",
                userSelect: "none",
              }}>
                {open ? "▾" : "▸"}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{phase.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80, height: 6, background: "#E7E8E0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "var(--color-green)" : "var(--color-amber)", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)" }}>
                  {done}/{phaseTasks.length}
                </span>
              </div>
            </div>

            {open && (
              <div style={{ marginTop: 12 }}>
                {/* Phase dates */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ ...S.label, marginBottom: 3 }}>Start</label>
                    <input
                      type="date"
                      value={phase.start_date ?? ""}
                      onChange={e => updatePhase(phase.id, { start_date: e.target.value || null })}
                      style={{ ...S.input, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ ...S.label, marginBottom: 3 }}>Eind</label>
                    <input
                      type="date"
                      value={phase.end_date ?? ""}
                      onChange={e => updatePhase(phase.id, { end_date: e.target.value || null })}
                      style={{ ...S.input, fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                {phaseTasks.length === 0 && (
                  <div style={{ color: "var(--color-slate)", fontSize: 12.5, marginBottom: 8 }}>
                    Geen taken.
                  </div>
                )}
                {phaseTasks.map(task => (
                  <div key={task.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--color-line)",
                  }}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task)}
                      style={{ width: 16, height: 16, flexShrink: 0, accentColor: "var(--color-green)" }}
                    />
                    <input
                      type="text"
                      defaultValue={task.name}
                      onBlur={e => { if (e.target.value !== task.name) updateTask(task.id, { name: e.target.value }); }}
                      style={{ ...S.input, flex: 1, textDecoration: task.done ? "line-through" : "none", color: task.done ? "var(--color-grey)" : "var(--color-ink)" }}
                    />
                    <select
                      value={ownerMap[task.id] ?? ""}
                      onChange={e => {
                        setOwnerMap(prev => ({ ...prev, [task.id]: e.target.value }));
                        updateTask(task.id, { owner: e.target.value });
                      }}
                      style={{ ...S.input, width: 140 }}
                    >
                      <option value="">— Eigenaar —</option>
                      <option value={coordinatorName}>{coordinatorName} (ik)</option>
                      {tenantContacts.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      defaultValue={task.due ?? ""}
                      onBlur={e => updateTask(task.id, { due: e.target.value || null })}
                      style={{ ...S.input, width: 130 }}
                    />
                    {task.assignee_user_id && (
                      <span style={{ fontSize: 13, color: "var(--color-sky)" }} title="Gekoppeld aan klantportal">
                        🔗
                      </span>
                    )}
                  </div>
                ))}

                {/* Add task */}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input
                    type="text"
                    value={newTaskName[phase.id] ?? ""}
                    onChange={e => setNewTaskName(prev => ({ ...prev, [phase.id]: e.target.value }))}
                    placeholder="Nieuwe taak toevoegen…"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(phase.id); } }}
                    style={{ ...S.input, flex: 1 }}
                  />
                  <button type="button" onClick={() => addTask(phase.id)} style={S.btnGhost}>
                    + Taak
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add phase */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={newPhaseName}
          onChange={e => setNewPhaseName(e.target.value)}
          placeholder="Nieuwe fase toevoegen…"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPhase(); } }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="button" onClick={addPhase} style={S.btnGhost}>
          + Fase
        </button>
      </div>
    </div>
  );
}

// ─── MaatregelenTab ───────────────────────────────────────────────────────────

function MaatregelenTab({ controls, project, workspace, tenant, coordinatorName, onRefresh }: {
  controls: Control[];
  project: Project;
  workspace: { id: string };
  tenant: { name: string; contact?: string | null } | null;
  coordinatorName: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [requestText, setRequestText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generateRequest(ctrl: Control, guide: { u: string; v: string[]; b: string[]; q: string }) {
    const bewijslijst = guide.b.map(b => `- ${b}`).join("\n");
    const text = [
      `Betreft: Bewijs aanleveren – ${ctrl.code} ${ctrl.name}`,
      ``,
      `Beste${tenant?.contact ? ` ${tenant.contact}` : ""},`,
      ``,
      `Voor de certificering van ${tenant?.name ?? "jullie organisatie"} werk ik het onderdeel **${ctrl.code} – ${ctrl.name}** uit. Hiervoor heb ik van jullie kant het volgende bewijs nodig.`,
      ``,
      `Wat ik nodig heb:`,
      bewijslijst,
      ``,
      `Achtergrond:`,
      guide.u,
      ``,
      `Ter info: dit is wat de auditor hierover zal vragen:`,
      `"${guide.q}"`,
      ``,
      `Kun je me dit zo snel mogelijk toesturen, zodat we tijdig klaar zijn voor de audit?`,
      ``,
      `Met vriendelijke groet,`,
      coordinatorName,
    ].join("\n");
    setRequestText(text);
    setCopied(false);
  }

  async function copyText() {
    if (!requestText) return;
    await navigator.clipboard.writeText(requestText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function cycleStatus(ctrl: Control) {
    const next = ((ctrl.status + 1) % 4) as 0 | 1 | 2 | 3;
    await supabase.from("controls").update({ status: next }).eq("id", ctrl.id);
    onRefresh();
  }

  async function updateCtrl(id: string, field: Partial<Control>) {
    await supabase.from("controls").update(field).eq("id", id);
    onRefresh();
  }

  async function addEvidenceDocs(ctrl: Control) {
    const guide = GUIDE[ctrl.code];
    if (!guide) return;
    for (const b of guide.b) {
      await supabase.from("documents").insert({
        workspace_id: workspace.id,
        project_id: project.id,
        name: b,
      });
    }
    onRefresh();
  }

  return (
    <div>
      {controls.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "20px 0" }}>
          Geen maatregelen gevonden.
        </div>
      )}
      {controls.map(ctrl => {
        const guide = GUIDE[ctrl.code];
        const open = expanded[ctrl.id];
        return (
          <div key={ctrl.id} style={S.card}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* Code stamp */}
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "3px 8px",
                borderRadius: 4,
                border: "1.5px solid var(--color-line)",
                color: "var(--color-slate)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {ctrl.code}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>{ctrl.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--color-slate)", marginBottom: 8 }}>{ctrl.description}</div>

                {/* Status + actions row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => cycleStatus(ctrl)}
                    style={{ all: "unset", cursor: "pointer" }}
                    title="Klik om status te wijzigen"
                  >
                    <Stamp label={CTRL_STATUS[ctrl.status]} color={CTRL_COLOR[ctrl.status]} />
                  </button>

                  {guide && (
                    <button
                      type="button"
                      onClick={() => setExpanded(prev => ({ ...prev, [ctrl.id]: !open }))}
                      style={{ ...S.btnGhost, fontSize: 11.5, padding: "4px 10px" }}
                    >
                      {open ? "▾ Sluit gids" : "▸ Toon gids"}
                    </button>
                  )}

                  {guide && (
                    <button
                      type="button"
                      onClick={() => addEvidenceDocs(ctrl)}
                      style={{ ...S.btnGhost, fontSize: 11.5, padding: "4px 10px" }}
                    >
                      + Bewijs naar documenten
                    </button>
                  )}

                  {guide && (
                    <button
                      type="button"
                      onClick={() => generateRequest(ctrl, guide)}
                      style={{ ...S.btnGhost, fontSize: 11.5, padding: "4px 10px" }}
                    >
                      Verzoek opstellen
                    </button>
                  )}
                </div>

                {/* Guide panel */}
                {open && guide && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: "var(--color-bone)",
                    borderRadius: 7,
                    border: "1px solid var(--color-line)",
                    fontSize: 12.5,
                  }}>
                    <div style={{ marginBottom: 8 }}>
                      <span style={S.label as React.CSSProperties}>Uitleg</span>
                      <p>{guide.u}</p>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={S.label as React.CSSProperties}>Vereisten</span>
                      <ul style={{ paddingLeft: 16 }}>
                        {guide.v.map((v, i) => <li key={i}>{v}</li>)}
                      </ul>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={S.label as React.CSSProperties}>Bewijsmateriaal</span>
                      <ul style={{ paddingLeft: 16 }}>
                        {guide.b.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span style={S.label as React.CSSProperties}>Auditeersvraag</span>
                      <p style={{ fontStyle: "italic" }}>{guide.q}</p>
                    </div>
                  </div>
                )}

                {/* Note + link */}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <textarea
                    defaultValue={ctrl.note}
                    placeholder="Aantekening…"
                    onBlur={e => { if (e.target.value !== ctrl.note) updateCtrl(ctrl.id, { note: e.target.value }); }}
                    rows={2}
                    style={{ ...S.input, flex: 1, resize: "vertical", fontSize: 12.5 }}
                  />
                  <input
                    type="url"
                    defaultValue={ctrl.link}
                    placeholder="Bewijs-URL"
                    onBlur={e => { if (e.target.value !== ctrl.link) updateCtrl(ctrl.id, { link: e.target.value }); }}
                    style={{ ...S.input, width: 220, fontSize: 12.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Verzoek-modal */}
      {requestText !== null && (
        <div
          onClick={() => setRequestText(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 10, padding: 24, width: "100%", maxWidth: 560, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-navy)" }}>Verzoek aan klant</div>
              <button onClick={() => setRequestText(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-slate)", lineHeight: 1 }}>×</button>
            </div>
            <textarea
              readOnly
              value={requestText}
              rows={14}
              style={{ width: "100%", resize: "vertical", padding: "10px 12px", borderRadius: 7, border: "1px solid var(--color-line)", fontSize: 12.5, fontFamily: "var(--font-archivo)", lineHeight: 1.6, boxSizing: "border-box", color: "var(--color-ink)", background: "var(--color-bone)" }}
              onFocus={e => e.target.select()}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={copyText}
                style={{ background: copied ? "var(--color-green)" : "var(--color-navy)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "9px 18px", borderRadius: 7, border: "none", cursor: "pointer", transition: "background 0.2s" }}
              >
                {copied ? "Gekopieerd!" : "Kopieer tekst"}
              </button>
              <button
                onClick={() => setRequestText(null)}
                style={{ background: "transparent", color: "var(--color-ink)", border: "1px solid var(--color-line)", fontWeight: 500, fontSize: 13, padding: "9px 14px", borderRadius: 7, cursor: "pointer" }}
              >
                Sluiten
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--color-slate)" }}>Plak dit in Outlook, WhatsApp of een ander kanaal naar keuze.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DocumentenTab ────────────────────────────────────────────────────────────

function DocumentenTab({ documents, project, workspace, tenantMembers, onRefresh }: {
  documents: Document[];
  project: Project;
  workspace: { id: string };
  tenantMembers: TenantMember[];
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [newName, setNewName] = useState("");

  async function addDoc() {
    const name = newName.trim();
    if (!name) return;
    await supabase.from("documents").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      name,
    });
    setNewName("");
    onRefresh();
  }

  async function updateDoc(id: string, field: Partial<Document>) {
    await supabase.from("documents").update(field).eq("id", id);
    onRefresh();
  }

  async function cycleStatus(doc: Document) {
    const next = ((doc.status + 1) % 4) as 0 | 1 | 2 | 3;
    await supabase.from("documents").update({ status: next }).eq("id", doc.id);
    onRefresh();
  }

  async function deleteDoc(id: string) {
    if (!confirm("Document verwijderen?")) return;
    await supabase.from("documents").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div>
      {documents.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "12px 0" }}>
          Geen documenten.
        </div>
      )}
      {documents.map(doc => (
        <div key={doc.id} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => cycleStatus(doc)}
              style={{ all: "unset", cursor: "pointer" }}
              title="Klik om status te wijzigen"
            >
              <Stamp label={DOC_STATUS[doc.status]} color={DOC_COLOR[doc.status]} />
            </button>
            <input
              type="text"
              defaultValue={doc.name}
              onBlur={e => { if (e.target.value !== doc.name) updateDoc(doc.id, { name: e.target.value }); }}
              style={{ ...S.input, flex: 1, minWidth: 160 }}
            />
            <input
              type="text"
              defaultValue={doc.owner}
              placeholder="Eigenaar"
              onBlur={e => { if (e.target.value !== doc.owner) updateDoc(doc.id, { owner: e.target.value }); }}
              style={{ ...S.input, width: 110 }}
            />
            <input
              type="date"
              defaultValue={doc.due ?? ""}
              onBlur={e => updateDoc(doc.id, { due: e.target.value || null })}
              style={{ ...S.input, width: 130 }}
            />
            <select
              value={doc.assignee_user_id ?? ""}
              onChange={e => updateDoc(doc.id, { assignee_user_id: e.target.value || null })}
              style={{ ...S.input, width: 140 }}
            >
              <option value="">— Toewijzen —</option>
              {tenantMembers.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name ?? m.profiles?.email ?? m.user_id}
                </option>
              ))}
            </select>
            <input
              type="url"
              defaultValue={doc.link}
              placeholder="Link"
              onBlur={e => { if (e.target.value !== doc.link) updateDoc(doc.id, { link: e.target.value }); }}
              style={{ ...S.input, width: 180 }}
            />
            <button
              type="button"
              onClick={() => deleteDoc(doc.id)}
              style={S.btnDanger}
            >
              Verwijder
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nieuw document toevoegen…"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDoc(); } }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="button" onClick={addDoc} style={S.btnGhost}>
          + Document
        </button>
      </div>
    </div>
  );
}

// ─── BevindingenTab ───────────────────────────────────────────────────────────

interface TenantContact {
  id: string;
  name: string;
  email: string | null;
}

function BevindingenTab({ findings, project, workspace, tenantMembers, tenantContacts, coordinatorName, onRefresh }: {
  findings: Finding[];
  project: Project;
  workspace: { id: string };
  tenantMembers: TenantMember[];
  tenantContacts: TenantContact[];
  coordinatorName: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [newDesc, setNewDesc] = useState("");

  async function addFinding() {
    const desc = newDesc.trim();
    if (!desc) return;
    await supabase.from("findings").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      description: desc,
    });
    setNewDesc("");
    onRefresh();
  }

  async function updateFinding(id: string, field: Partial<Finding>) {
    await supabase.from("findings").update(field).eq("id", id);
    onRefresh();
  }

  async function cycleStatus(f: Finding) {
    const next = ((f.status + 1) % 4) as 0 | 1 | 2 | 3;
    await supabase.from("findings").update({ status: next }).eq("id", f.id);
    onRefresh();
  }

  async function deleteFinding(id: string) {
    if (!confirm("Afwijking verwijderen?")) return;
    await supabase.from("findings").delete().eq("id", id);
    onRefresh();
  }

  const SEVERITY_DEFS = [
    { label: "Major", bg: "#FDECEA", color: "var(--color-red)", border: "var(--color-red)", desc: "Systematische non-conformiteit — risico voor auditresultaat" },
    { label: "Minor", bg: "#FEF3E2", color: "var(--color-amber)", border: "var(--color-amber)", desc: "Geïsoleerde afwijking — herstelbaar voor re-audit" },
    { label: "Observatie", bg: "#EAF4FB", color: "var(--color-sky)", border: "var(--color-sky)", desc: "Auditopmerking — geen non-conformiteit" },
  ];

  return (
    <div>
      {/* Definitielegenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, padding: "10px 14px", background: "var(--color-bone)", borderRadius: 8, border: "1px solid var(--color-line)" }}>
        {SEVERITY_DEFS.map(({ label, bg, color, border, desc }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, background: bg, color, border: `1.5px solid ${border}` }}>
              {label}
            </span>
            <span style={{ fontSize: 12, color: "var(--color-slate)" }}>{desc}</span>
          </div>
        ))}
      </div>

      {findings.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "12px 0" }}>
          Geen afwijkingen.
        </div>
      )}
      {findings.map(f => (
        <div key={f.id} style={S.card}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => cycleStatus(f)}
                  style={{ all: "unset", cursor: "pointer" }}
                >
                  <Stamp label={FIND_STATUS[f.status]} color={FIND_COLOR[f.status]} />
                </button>
                {f.severity && (
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: f.severity === "Major" ? "#FDECEA" : f.severity === "Minor" ? "#FEF3E2" : "#EAF4FB",
                    color: f.severity === "Major" ? "var(--color-red)" : f.severity === "Minor" ? "var(--color-amber)" : "var(--color-sky)",
                    border: `1.5px solid ${f.severity === "Major" ? "var(--color-red)" : f.severity === "Minor" ? "var(--color-amber)" : "var(--color-sky)"}`,
                  }}>
                    {f.severity}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => updateFinding(f.id, { client_visible: !f.client_visible })}
                  title={f.client_visible ? "Zichtbaar voor klant (klik om te verbergen)" : "Verborgen voor klant (klik om te delen)"}
                  style={{ all: "unset", cursor: "pointer", fontSize: 14 }}
                >
                  {f.client_visible ? "👁️" : "🔒"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={S.label as React.CSSProperties}>Beschrijving</label>
                  <textarea
                    defaultValue={f.description}
                    onBlur={e => { if (e.target.value !== f.description) updateFinding(f.id, { description: e.target.value }); }}
                    rows={2}
                    style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Norm/eis</label>
                  <input
                    type="text"
                    defaultValue={f.source ?? ""}
                    placeholder="bijv. VCU 3.1"
                    onBlur={e => { if (e.target.value !== (f.source ?? "")) updateFinding(f.id, { source: e.target.value || null }); }}
                    style={{ ...S.input, width: "100%" }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Type</label>
                  <select
                    value={f.severity ?? ""}
                    onChange={e => updateFinding(f.id, { severity: e.target.value || null })}
                    style={{ ...S.input, width: "100%" }}
                  >
                    <option value="">— Type —</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                    <option value="Observatie">Observatie</option>
                  </select>
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Eigenaar</label>
                  <select
                    value={f.owner ?? ""}
                    onChange={e => updateFinding(f.id, { owner: e.target.value })}
                    style={{ ...S.input, width: "100%" }}
                  >
                    <option value="">— Kies eigenaar —</option>
                    <option value={coordinatorName}>{coordinatorName} (ik)</option>
                    {tenantContacts.map(c => (
                      <option key={c.id} value={c.name}>{c.name}{c.email ? ` (${c.email})` : ""}</option>
                    ))}
                    {tenantMembers
                      .filter(m => {
                        const email = m.profiles?.email;
                        return !email || !tenantContacts.some(c => c.email === email);
                      })
                      .map(m => {
                        const name = m.profiles?.full_name ?? m.profiles?.email ?? m.user_id;
                        return <option key={m.user_id} value={name}>{name} (portaal)</option>;
                      })}
                  </select>
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Deadline</label>
                  <input
                    type="date"
                    defaultValue={f.due ?? ""}
                    onBlur={e => updateFinding(f.id, { due: e.target.value || null })}
                    style={{ ...S.input, width: "100%" }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Link</label>
                  <input
                    type="url"
                    defaultValue={f.link}
                    onBlur={e => { if (e.target.value !== f.link) updateFinding(f.id, { link: e.target.value }); }}
                    style={{ ...S.input, width: "100%" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.label as React.CSSProperties}>Corrigerende maatregel</label>
                  <textarea
                    defaultValue={f.note}
                    placeholder="Beschrijf welke actie is of wordt ondernomen…"
                    onBlur={e => { if (e.target.value !== f.note) updateFinding(f.id, { note: e.target.value }); }}
                    rows={2}
                    style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
                  />
                </div>
              </div>
            </div>
            <button type="button" onClick={() => deleteFinding(f.id)} style={S.btnDanger}>
              Verwijder
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Nieuwe afwijking…"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFinding(); } }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="button" onClick={addFinding} style={S.btnGhost}>
          + Afwijking
        </button>
      </div>
    </div>
  );
}

// ─── RisicosTab ───────────────────────────────────────────────────────────────

function RisicosTab({ risks, project, workspace, tenantContacts, coordinatorName, onRefresh }: {
  risks: Risk[];
  project: Project;
  workspace: { id: string };
  tenantContacts: TenantContact[];
  coordinatorName: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [newDesc, setNewDesc] = useState("");

  async function addRisk() {
    const desc = newDesc.trim();
    if (!desc) return;
    await supabase.from("risks").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      description: desc,
    });
    setNewDesc("");
    onRefresh();
  }

  async function updateRisk(id: string, field: Partial<Risk>) {
    await supabase.from("risks").update(field).eq("id", id);
    onRefresh();
  }

  async function cycleStatus(r: Risk) {
    const next = (r.status + 1) % RISK_STATUS.length;
    await supabase.from("risks").update({ status: next }).eq("id", r.id);
    onRefresh();
  }

  async function deleteRisk(id: string) {
    if (!confirm("Verbeterpunt verwijderen?")) return;
    await supabase.from("risks").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div>
      {risks.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "12px 0" }}>
          Geen verbeterpunten.
        </div>
      )}
      {risks.map(r => (
        <div key={r.id} style={S.card}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => cycleStatus(r)}
                  style={{ all: "unset", cursor: "pointer" }}
                >
                  <Stamp label={RISK_STATUS[r.status]} color={RISK_COLOR[r.status]} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={S.label as React.CSSProperties}>Beschrijving</label>
                  <textarea
                    defaultValue={r.description}
                    onBlur={e => { if (e.target.value !== r.description) updateRisk(r.id, { description: e.target.value }); }}
                    rows={2}
                    style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Toelichting</label>
                  <textarea
                    defaultValue={r.impact ?? ""}
                    onBlur={e => { if (e.target.value !== (r.impact ?? "")) updateRisk(r.id, { impact: e.target.value || null }); }}
                    rows={2}
                    style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Actie</label>
                  <textarea
                    defaultValue={r.mitigation ?? ""}
                    onBlur={e => { if (e.target.value !== (r.mitigation ?? "")) updateRisk(r.id, { mitigation: e.target.value || null }); }}
                    rows={2}
                    style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Bron</label>
                  <select
                    value={r.source ?? ""}
                    onChange={e => updateRisk(r.id, { source: e.target.value || null })}
                    style={{ ...S.input, width: "100%" }}
                  >
                    <option value="">— Bron —</option>
                    <option value="Intern">Intern</option>
                    <option value="Interne audit">Interne audit</option>
                    <option value="Externe audit">Externe audit</option>
                    <option value="Klacht">Klacht</option>
                    <option value="Management review">Management review</option>
                    <option value="Anders">Anders</option>
                  </select>
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Eigenaar</label>
                  <select
                    value={r.owner ?? ""}
                    onChange={e => updateRisk(r.id, { owner: e.target.value || null })}
                    style={{ ...S.input, width: "100%" }}
                  >
                    <option value="">— Kies eigenaar —</option>
                    <option value={coordinatorName}>{coordinatorName} (ik)</option>
                    {tenantContacts.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Deadline</label>
                  <input
                    type="date"
                    defaultValue={r.due ?? ""}
                    onBlur={e => updateRisk(r.id, { due: e.target.value || null })}
                    style={{ ...S.input, width: "100%" }}
                  />
                </div>
              </div>
            </div>
            <button type="button" onClick={() => deleteRisk(r.id)} style={S.btnDanger}>
              Verwijder
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Nieuw verbeterpunt…"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRisk(); } }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="button" onClick={addRisk} style={S.btnGhost}>
          + Verbeterpunt
        </button>
      </div>
    </div>
  );
}

// ─── UrenTab (verborgen — niet meer in gebruik) ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function UrenTab(_props: unknown) { return null; }

// ─── LogboekTab ───────────────────────────────────────────────────────────────

function LogboekTab({ logEntries, project, workspace, onRefresh }: {
  logEntries: LogEntry[];
  project: Project;
  workspace: { id: string };
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function addEntry() {
    const t = text.trim();
    if (!t) return;
    await supabase.from("log_entries").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      date,
      text: t,
      internal,
    });
    setText("");
    onRefresh();
  }

  return (
    <div>
      {/* Add entry */}
      <div style={S.card}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10 }}>Nieuwe logboekinvoer</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...S.input, width: 140 }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!internal}
              onChange={e => setInternal(!e.target.checked)}
              style={{ accentColor: "var(--color-green)" }}
            />
            Gedeeld met klant
          </label>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Noteer wat er is besproken, besloten of afgesproken…"
          rows={3}
          style={{ ...S.input, width: "100%", resize: "vertical", marginBottom: 10 }}
        />
        <button type="button" onClick={addEntry} style={S.btnPrimary}>
          Toevoegen
        </button>
      </div>

      {/* Entries list */}
      {logEntries.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5 }}>Nog geen logboekinvoeren.</div>
      )}
      {logEntries.map(e => (
        <div key={e.id} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-slate)",
            }}>
              {fmt(e.date)}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 4,
              background: e.internal ? "#F0F0F0" : "var(--color-green-tint, #E2F4EA)",
              color: e.internal ? "var(--color-grey)" : "var(--color-green)",
              border: `1px solid ${e.internal ? "var(--color-line)" : "var(--color-green)"}`,
            }}>
              {e.internal ? "INTERN" : "GEDEELD"}
            </span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{e.text}</p>
        </div>
      ))}
    </div>
  );
}

// ─── VervaldataTab (verborgen — niet meer in gebruik) ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VervaldataTab(_props: unknown) { return null; }

// ─── PlanningTab (Gantt) ──────────────────────────────────────────────────────

function PlanningTab({ phases, tasks, project, onRefresh }: {
  phases: Phase[];
  tasks: Task[];
  project: Project;
  onRefresh: () => void;
}) {
  const supabase = createClient();

  async function updatePhase(phaseId: string, field: Partial<Phase>) {
    await supabase.from("phases").update(field).eq("id", phaseId);
    onRefresh();
  }

  // Determine date range
  const allDates = [
    ...phases.filter(p => p.start_date).map(p => new Date(p.start_date!)),
    ...phases.filter(p => p.end_date).map(p => new Date(p.end_date!)),
  ];

  const now = new Date();
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : now;
  const maxDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : new Date(now.getFullYear(), now.getMonth() + 12, 1);

  // Ensure at least 1 month range
  if (maxDate <= minDate) maxDate.setMonth(minDate.getMonth() + 3);

  const rangeMs = maxDate.getTime() - minDate.getTime();

  function pct(d: Date) {
    return Math.max(0, Math.min(100, ((d.getTime() - minDate.getTime()) / rangeMs) * 100));
  }

  // Generate month labels
  const months: { label: string; pct: number }[] = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    months.push({
      label: cur.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" }),
      pct: pct(cur),
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  const todayPct = pct(now);
  const auditPct = project.audit_date ? pct(new Date(project.audit_date)) : null;

  return (
    <div>
      {/* Gantt area */}
      <div style={{ ...S.card, overflowX: "auto" }}>
        <div style={{ minWidth: 600, position: "relative" }}>
          {/* Month labels */}
          <div style={{ position: "relative", height: 22, marginBottom: 8 }}>
            {months.map((m, i) => (
              <span key={i} style={{
                position: "absolute",
                left: `${m.pct}%`,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--color-slate)",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Phase bars */}
          {phases.map(phase => {
            const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
            const donePct = phaseTasks.length > 0
              ? (phaseTasks.filter(t => t.done).length / phaseTasks.length) * 100
              : 0;
            const barColor = donePct === 100 ? "var(--color-green)" : donePct > 50 ? "var(--color-sky)" : "var(--color-amber)";

            const startPct = phase.start_date ? pct(new Date(phase.start_date)) : null;
            const endPct = phase.end_date ? pct(new Date(phase.end_date)) : null;

            return (
              <div key={phase.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: "var(--color-ink)" }}>
                  {phase.name}
                </div>
                <div style={{ position: "relative", height: 22, background: "#F0F0F0", borderRadius: 4 }}>
                  {startPct !== null && endPct !== null && (
                    <div style={{
                      position: "absolute",
                      left: `${startPct}%`,
                      width: `${endPct - startPct}%`,
                      height: "100%",
                      background: barColor,
                      borderRadius: 4,
                      opacity: 0.85,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 6,
                      fontSize: 10,
                      color: "#fff",
                      fontWeight: 600,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}>
                      {Math.round(donePct)}%
                    </div>
                  )}
                  {(startPct === null || endPct === null) && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      fontSize: 10.5,
                      color: "var(--color-grey)",
                      fontStyle: "italic",
                    }}>
                      Geen data — stel hieronder datum in
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    type="date"
                    defaultValue={phase.start_date ?? ""}
                    onBlur={e => updatePhase(phase.id, { start_date: e.target.value || null })}
                    style={{ ...S.input, fontSize: 11, padding: "3px 7px", width: 120 }}
                  />
                  <span style={{ fontSize: 11, color: "var(--color-slate)", lineHeight: "24px" }}>→</span>
                  <input
                    type="date"
                    defaultValue={phase.end_date ?? ""}
                    onBlur={e => updatePhase(phase.id, { end_date: e.target.value || null })}
                    style={{ ...S.input, fontSize: 11, padding: "3px 7px", width: 120 }}
                  />
                </div>
              </div>
            );
          })}

          {/* Today line */}
          <div style={{
            position: "absolute",
            top: 22,
            bottom: 0,
            left: `${todayPct}%`,
            width: 2,
            background: "var(--color-navy)",
            opacity: 0.5,
            pointerEvents: "none",
          }} />

          {/* Audit date line */}
          {auditPct !== null && (
            <div style={{
              position: "absolute",
              top: 22,
              bottom: 0,
              left: `${auditPct}%`,
              width: 2,
              borderLeft: "2px dashed var(--color-amber)",
              pointerEvents: "none",
            }} />
          )}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--color-slate)", display: "flex", gap: 16, marginTop: 6 }}>
        <span>▌ Navy lijn = vandaag</span>
        <span>▌ Amber gestippeld = auditdatum</span>
      </div>
    </div>
  );
}

// ─── AICoachTab ───────────────────────────────────────────────────────────────

function AICoachTab({ project, phases, tasks, controls, documents, findings, tenant, onRefresh }: {
  project: Project;
  phases: Phase[];
  tasks: Task[];
  controls: Control[];
  documents: Document[];
  findings: Finding[];
  tenant: { name: string } | null;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [analysisResult, setAnalysisResult] = useState("");
  const [auditResult, setAuditResult] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [aiResponse, setAiResponse] = useState<{
    tasks_to_create?: { name: string; owner?: string; due?: string | null; phase_name?: string }[];
    tasks_to_complete?: string[];
    status_updates?: { control_code: string; new_status: 0 | 1 | 2 | 3; note: string }[];
    audit_date?: string | null;
    log_entry?: string;
    summary?: string;
  } | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const controlsDone = controls.filter(c => c.status === 3).length;
  const docsDone = documents.filter(d => d.status === 3).length;
  const openFindings = findings.filter(f => f.status < 2).length;

  const projectSummary = `Project: ${tenant?.name ?? "Onbekend"} – ${project.norm} (${project.kind})
Auditdatum: ${fmt(project.audit_date)}
Voortgang: ${progress}% (${doneTasks}/${totalTasks} taken)
Maatregelen aantoonbaar: ${controlsDone}/${controls.length}
Documenten aangeleverd: ${docsDone}/${documents.length}
Open bevindingen: ${openFindings}
Fasen: ${phases.map(p => p.name).join(", ")}`;

  async function callAI(endpoint: string, extra?: object) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: projectSummary, ...extra }),
    });
    if (!res.ok) throw new Error(`API fout: ${res.status}`);
    return res.json();
  }

  async function runAnalysis() {
    setLoading("analysis");
    try {
      const data = await callAI("/api/ai/analyze");
      setAnalysisResult(data.text ?? data.result ?? data.content ?? JSON.stringify(data));
    } catch (e) {
      setAnalysisResult(`Fout: ${(e as Error).message}`);
    }
    setLoading(null);
  }

  async function runAuditPrep() {
    setLoading("audit");
    try {
      const data = await callAI("/api/ai/audit-prep");
      setAuditResult(data.text ?? data.result ?? data.content ?? JSON.stringify(data));
    } catch (e) {
      setAuditResult(`Fout: ${(e as Error).message}`);
    }
    setLoading(null);
  }

  async function processMeetingNotes() {
    if (!meetingNotes.trim()) return;
    setLoading("notes");
    setAiResponse(null);
    setApplied(false);
    try {
      const data = await callAI("/api/ai/process-notes", {
        notes: meetingNotes,
        project_context: {
          norm: project.norm,
          tenant: tenant?.name ?? "Onbekend",
          currentPhase: phases[0]?.name ?? "onbekend",
          auditDate: project.audit_date ?? null,
          openTasks: tasks.filter(t => !t.done).map(t => t.name),
          controls: controls.map(c => ({ code: c.code, name: c.name, status: c.status })),
        },
      });
      setAiResponse(data);
    } catch (e) {
      setAiResponse(null);
      alert(`Fout bij verwerken: ${(e as Error).message}`);
    }
    setLoading(null);
  }

  async function applyAIChanges() {
    if (!aiResponse) return;
    setApplying(true);

    const { data: ws } = await supabase.from("workspaces").select("id").limit(1).single();
    if (!ws) { setApplying(false); return; }

    // Create tasks
    if (aiResponse.tasks_to_create) {
      for (const t of aiResponse.tasks_to_create) {
        // Find matching phase or use first phase
        const matchPhase = phases.find(p =>
          t.phase_name && p.name.toLowerCase().includes(t.phase_name.toLowerCase())
        ) ?? phases[0];
        if (matchPhase) {
          await supabase.from("tasks").insert({
            workspace_id: ws.id,
            phase_id: matchPhase.id,
            name: t.name,
            position: tasks.filter(tk => tk.phase_id === matchPhase.id).length,
          });
        }
      }
    }

    // Complete tasks
    if (aiResponse.tasks_to_complete) {
      for (const name of aiResponse.tasks_to_complete) {
        const match = tasks.find(tk => tk.name.toLowerCase().includes(name.toLowerCase()));
        if (match) {
          await supabase.from("tasks").update({ done: true }).eq("id", match.id);
        }
      }
    }

    // Update control statuses
    if (aiResponse.status_updates) {
      for (const u of aiResponse.status_updates) {
        const match = controls.find(c => c.code === u.control_code);
        if (match) {
          await supabase.from("controls").update({ status: u.new_status }).eq("id", match.id);
        }
      }
    }

    // Update audit date
    if (aiResponse.audit_date) {
      await supabase.from("projects").update({ audit_date: aiResponse.audit_date }).eq("id", project.id);
    }

    // Log entry
    if (aiResponse.log_entry) {
      await supabase.from("log_entries").insert({
        workspace_id: ws.id,
        project_id: project.id,
        date: new Date().toISOString().slice(0, 10),
        text: aiResponse.log_entry,
        internal: true,
      });
    }

    setApplying(false);
    setApplied(true);
    onRefresh();
  }

  return (
    <div>
      {/* Project summary */}
      <div style={S.card}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10 }}>Projectsamenvatting</div>
        <pre style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          color: "var(--color-slate)",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}>
          {projectSummary}
        </pre>
      </div>

      {/* Analysis buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading !== null}
          style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}
        >
          {loading === "analysis" ? "Analyseren…" : "Voortgangsanalyse"}
        </button>
        <button
          type="button"
          onClick={runAuditPrep}
          disabled={loading !== null}
          style={{ ...S.btnGhost, opacity: loading ? 0.7 : 1 }}
        >
          {loading === "audit" ? "Laden…" : "Auditvoorbereiding"}
        </button>
      </div>

      {analysisResult && (

        <div style={{ ...S.card, borderLeft: "3px solid var(--color-green)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-green)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Voortgangsanalyse
          </div>
          <MarkdownText text={analysisResult} />
        </div>
      )}

      {auditResult && (
        <div style={{ ...S.card, borderLeft: "3px solid var(--color-sky)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-sky)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Auditvoorbereiding
          </div>
          <MarkdownText text={auditResult} />
        </div>
      )}

      {/* Meeting notes processor */}
      <div style={S.card}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Gespreksverslag verwerken</div>
        <div style={{ fontSize: 12.5, color: "var(--color-slate)", marginBottom: 10 }}>
          Plak een vergaderverslag of notities hieronder. De AI detecteert taken, actiepunten en updates.
        </div>
        <textarea
          value={meetingNotes}
          onChange={e => setMeetingNotes(e.target.value)}
          placeholder="Plak hier het verslag of de aantekeningen van de vergadering…"
          rows={6}
          style={{ ...S.input, width: "100%", resize: "vertical", marginBottom: 10 }}
        />
        <button
          type="button"
          onClick={processMeetingNotes}
          disabled={loading !== null || !meetingNotes.trim()}
          style={{ ...S.btnPrimary, opacity: loading === "notes" ? 0.7 : 1 }}
        >
          {loading === "notes" ? "Verwerken…" : "Verwerken met AI"}
        </button>
      </div>

      {/* AI response preview */}
      {aiResponse && (
        <div style={S.card}>
          <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 12 }}>AI heeft het volgende gevonden:</div>

          {aiResponse.tasks_to_create && aiResponse.tasks_to_create.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={S.label as React.CSSProperties}>Nieuwe taken ({aiResponse.tasks_to_create.length})</div>
              <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                {aiResponse.tasks_to_create.map((t, i) => (
                  <li key={i}>{t.name}{t.phase_name ? ` (fase: ${t.phase_name})` : ""}</li>
                ))}
              </ul>
            </div>
          )}

          {aiResponse.tasks_to_complete && aiResponse.tasks_to_complete.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={S.label as React.CSSProperties}>Taken afgerond ({aiResponse.tasks_to_complete.length})</div>
              <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                {aiResponse.tasks_to_complete.map((name, i) => (
                  <li key={i}>{name} → afgerond</li>
                ))}
              </ul>
            </div>
          )}

          {aiResponse.status_updates && aiResponse.status_updates.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={S.label as React.CSSProperties}>Maatregelstatussen ({aiResponse.status_updates.length})</div>
              <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                {aiResponse.status_updates.map((u, i) => (
                  <li key={i}>{u.control_code} → {["Niet gestart","In uitvoering","Geïmplementeerd","Aantoonbaar"][u.new_status]}</li>
                ))}
              </ul>
            </div>
          )}

          {aiResponse.audit_date && (
            <div style={{ marginBottom: 12 }}>
              <div style={S.label as React.CSSProperties}>Auditdatum</div>
              <p style={{ fontSize: 13 }}>Wordt bijgewerkt naar <b>{aiResponse.audit_date}</b></p>
            </div>
          )}

          {aiResponse.log_entry && (
            <div style={{ marginBottom: 12 }}>
              <div style={S.label as React.CSSProperties}>Logboekvermelding</div>
              <p style={{ fontSize: 13, fontStyle: "italic", background: "var(--color-bone)", padding: "8px 12px", borderRadius: 6 }}>
                {aiResponse.log_entry}
              </p>
            </div>
          )}

          {applied ? (
            <div style={{ color: "var(--color-green)", fontWeight: 600, fontSize: 13.5 }}>
              ✓ Wijzigingen toegepast!
            </div>
          ) : (
            <button
              type="button"
              onClick={applyAIChanges}
              disabled={applying}
              style={{ ...S.btnPrimary, opacity: applying ? 0.7 : 1 }}
            >
              {applying ? "Toepassen…" : "Toepassen"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AuditmodeTab ─────────────────────────────────────────────────────────────

function AuditmodeTab({ controls }: { controls: Control[] }) {
  // Group by status (aantoonbaar first)
  const grouped: Record<number, Control[]> = { 3: [], 2: [], 1: [], 0: [] };
  for (const c of controls) {
    grouped[c.status].push(c);
  }

  return (
    <div>
      <div style={{
        padding: "10px 14px",
        background: "var(--color-navy)",
        color: "#fff",
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span>📋</span>
        <span><b>Auditmodus</b> — alleen-lezen overzicht. Geschikt voor printweergave.</span>
      </div>

      {([3, 2, 1, 0] as const).map(status => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <div key={status} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Stamp label={CTRL_STATUS[status]} color={CTRL_COLOR[status]} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)" }}>
                {items.length} maatregel{items.length !== 1 ? "en" : ""}
              </span>
            </div>
            {items.map(ctrl => (
              <div key={ctrl.id} style={{
                ...S.card,
                borderLeft: `3px solid ${CTRL_COLOR[status]}`,
              }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1.5px solid var(--color-line)",
                    color: "var(--color-slate)",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                  }}>
                    {ctrl.code}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ctrl.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-slate)", marginTop: 2 }}>{ctrl.description}</div>
                    {ctrl.note && (
                      <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--color-ink)", fontStyle: "italic" }}>
                        {ctrl.note}
                      </div>
                    )}
                    {ctrl.link && (
                      <a
                        href={ctrl.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "var(--color-sky)", display: "inline-block", marginTop: 4 }}
                      >
                        Bewijs →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── SnelleUpdateTab (verborgen — niet meer in gebruik) ───────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SnelleUpdateTab(_props: unknown) { return null; }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectDetailClient({
  project: initialProject,
  tenant,
  workspace,
  phases: initialPhases,
  tasks: initialTasks,
  controls: initialControls,
  documents: initialDocuments,
  findings: initialFindings,
  risks: initialRisks,
  hours: _initialHours,
  logEntries: initialLogEntries,
  expiries: _initialExpiries,
  tenantMembers,
  tenantContacts,
  coordinatorName,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("fasen");

  // Local state — mutaties updaten dit direct zonder server-roundtrip
  const [phases, setPhases] = useState(initialPhases);
  const [tasks, setTasks] = useState(initialTasks);
  const [controls, setControls] = useState(initialControls);
  const [documents, setDocuments] = useState(initialDocuments);
  const [findings, setFindings] = useState(initialFindings);
  const [risks, setRisks] = useState(initialRisks);
  const [logEntries, setLogEntries] = useState(initialLogEntries);
  const [project, setProject] = useState(initialProject);

  // Sync wanneer server nieuwe data stuurt (bijv. na navigatie)
  useEffect(() => setPhases(initialPhases), [initialPhases]);
  useEffect(() => setTasks(initialTasks), [initialTasks]);
  useEffect(() => setControls(initialControls), [initialControls]);
  useEffect(() => setDocuments(initialDocuments), [initialDocuments]);
  useEffect(() => setFindings(initialFindings), [initialFindings]);
  useEffect(() => setRisks(initialRisks), [initialRisks]);
  useEffect(() => setLogEntries(initialLogEntries), [initialLogEntries]);
  useEffect(() => setProject(initialProject), [initialProject]);

  const pid = initialProject.id;

  // Gerichte refresh-functies — halen alleen het relevante data type opnieuw op
  const refreshFindings = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("findings").select("*").eq("project_id", pid);
    if (data) setFindings(data as Finding[]);
  }, [pid]);

  const refreshRisks = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("risks").select("*").eq("project_id", pid);
    if (data) setRisks(data as Risk[]);
  }, [pid]);

  const refreshTasks = useCallback(async () => {
    const db = createClient();
    const phaseIds = phases.map(p => p.id);
    if (phaseIds.length === 0) return;
    const { data } = await db.from("tasks").select("*").in("phase_id", phaseIds).order("position");
    if (data) setTasks(data as Task[]);
  }, [pid, phases]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshControls = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("controls").select("*").eq("project_id", pid).order("code");
    if (data) setControls(data as Control[]);
  }, [pid]);

  const refreshDocuments = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("documents").select("*").eq("project_id", pid);
    if (data) setDocuments(data as Document[]);
  }, [pid]);

  const refreshLogEntries = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("log_entries").select("*").eq("project_id", pid).order("date", { ascending: false });
    if (data) setLogEntries(data as LogEntry[]);
  }, [pid]);

  const refreshPhases = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("phases").select("*").eq("project_id", pid).order("position");
    if (data) setPhases(data as Phase[]);
  }, [pid]);

  const refreshProject = useCallback(async () => {
    const db = createClient();
    const { data } = await db.from("projects").select("*").eq("id", pid).single();
    if (data) setProject(data as Project);
  }, [pid]);

  // Volledige server refresh — alleen voor AI (raakt meerdere data types)
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const d = daysTo(project.audit_date);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", flex: 1 }}>
            {tenant?.name ?? "Project"}
          </div>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 4,
            background: "#E2F4EA",
            color: "#157A49",
            letterSpacing: "0.05em",
          }}>
            {project.norm}
          </span>
          {project.kind === "Hercertificering" && (
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: 4,
              background: "#EFE7D6",
              color: "var(--color-amber)",
              letterSpacing: "0.05em",
            }}>
              HERCERT
            </span>
          )}
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            color: d !== null && d < 14 ? "var(--color-red)" : d !== null && d < 30 ? "var(--color-amber)" : "var(--color-slate)",
          }}>
            {project.audit_date
              ? d! >= 0 ? `Audit over ${d} dgn (${fmt(project.audit_date)})` : `Audit ${fmt(project.audit_date)}`
              : "Geen auditdatum"}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1, height: 7, background: "#E7E8E0", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--color-green)", borderRadius: 4, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, width: 42, textAlign: "right" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: 2,
        borderBottom: "1px solid var(--color-line)",
        marginBottom: 20,
        overflowX: "auto",
        paddingBottom: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-green)" : "2px solid transparent",
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? "var(--color-ink)" : "var(--color-slate)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "fasen" && (
        <FasenTab phases={phases} tasks={tasks} project={project} workspace={workspace} tenantContacts={tenantContacts} coordinatorName={coordinatorName} onRefresh={refreshPhases} />
      )}
      {activeTab === "maatregelen" && (
        <MaatregelenTab controls={controls} project={project} workspace={workspace} tenant={tenant} coordinatorName={coordinatorName} onRefresh={refreshControls} />
      )}
      {activeTab === "documenten" && (
        <DocumentenTab documents={documents} project={project} workspace={workspace} tenantMembers={tenantMembers} onRefresh={refreshDocuments} />
      )}
      {activeTab === "afwijkingen" && (
        <BevindingenTab findings={findings} project={project} workspace={workspace} tenantMembers={tenantMembers} tenantContacts={tenantContacts} coordinatorName={coordinatorName} onRefresh={refreshFindings} />
      )}
      {activeTab === "verbeterpunten" && (
        <RisicosTab risks={risks} project={project} workspace={workspace} tenantContacts={tenantContacts} coordinatorName={coordinatorName} onRefresh={refreshRisks} />
      )}
      {activeTab === "logboek" && (
        <LogboekTab logEntries={logEntries} project={project} workspace={workspace} onRefresh={refreshLogEntries} />
      )}
      {activeTab === "planning" && (
        <PlanningTab phases={phases} tasks={tasks} project={project} onRefresh={refreshTasks} />
      )}
      {activeTab === "ai" && (
        <AICoachTab
          project={project}
          phases={phases}
          tasks={tasks}
          controls={controls}
          documents={documents}
          findings={findings}
          tenant={tenant}
          onRefresh={refresh}
        />
      )}
      {activeTab === "auditmode" && (
        <AuditmodeTab controls={controls} />
      )}
    </div>
  );
}
