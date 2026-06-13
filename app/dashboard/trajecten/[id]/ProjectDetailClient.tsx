"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import {
  CTRL_STATUS, CTRL_COLOR,
  DOC_STATUS, DOC_COLOR,
  FIND_STATUS, FIND_COLOR,
  RISK_STATUS, RISK_COLOR,
  HOUR_CATS, EXP_TYPES,
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

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "fasen", label: "Fasen" },
  { id: "maatregelen", label: "Maatregelen" },
  { id: "documenten", label: "Documenten" },
  { id: "bevindingen", label: "Bevindingen" },
  { id: "risicos", label: "Risico's" },
  { id: "uren", label: "Uren" },
  { id: "logboek", label: "Logboek" },
  { id: "vervaldata", label: "Vervaldata" },
  { id: "planning", label: "Planning" },
  { id: "ai", label: "AI-coach" },
  { id: "auditmode", label: "Auditmodus" },
  { id: "update", label: "Snelle update" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── FasenTab ─────────────────────────────────────────────────────────────────

function FasenTab({ phases, tasks, project, workspace, onRefresh }: {
  phases: Phase[];
  tasks: Task[];
  project: Project;
  workspace: { id: string };
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTaskName, setNewTaskName] = useState<Record<string, string>>({});
  const [newPhaseName, setNewPhaseName] = useState("");

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
                    <input
                      type="text"
                      defaultValue={task.owner}
                      placeholder="Eigenaar"
                      onBlur={e => { if (e.target.value !== task.owner) updateTask(task.id, { owner: e.target.value }); }}
                      style={{ ...S.input, width: 110 }}
                    />
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

function MaatregelenTab({ controls, project, workspace, onRefresh }: {
  controls: Control[];
  project: Project;
  workspace: { id: string };
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

function BevindingenTab({ findings, project, workspace, onRefresh }: {
  findings: Finding[];
  project: Project;
  workspace: { id: string };
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
    if (!confirm("Bevinding verwijderen?")) return;
    await supabase.from("findings").delete().eq("id", id);
    onRefresh();
  }

  return (
    <div>
      {findings.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "12px 0" }}>
          Geen bevindingen.
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-slate)" }}>
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
                  <label style={S.label as React.CSSProperties}>Bron</label>
                  <input
                    type="text"
                    defaultValue={f.source ?? ""}
                    onBlur={e => { if (e.target.value !== (f.source ?? "")) updateFinding(f.id, { source: e.target.value || null }); }}
                    style={{ ...S.input, width: "100%" }}
                  />
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Ernst</label>
                  <select
                    value={f.severity ?? ""}
                    onChange={e => updateFinding(f.id, { severity: e.target.value || null })}
                    style={{ ...S.input, width: "100%" }}
                  >
                    <option value="">— Ernst —</option>
                    <option value="Afwijking">Afwijking</option>
                    <option value="Observatie">Observatie</option>
                    <option value="OFI">OFI</option>
                  </select>
                </div>
                <div>
                  <label style={S.label as React.CSSProperties}>Eigenaar</label>
                  <input
                    type="text"
                    defaultValue={f.owner}
                    onBlur={e => { if (e.target.value !== f.owner) updateFinding(f.id, { owner: e.target.value }); }}
                    style={{ ...S.input, width: "100%" }}
                  />
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
                  <label style={S.label as React.CSSProperties}>Aantekening</label>
                  <textarea
                    defaultValue={f.note}
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
          placeholder="Nieuwe bevinding…"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFinding(); } }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="button" onClick={addFinding} style={S.btnGhost}>
          + Bevinding
        </button>
      </div>
    </div>
  );
}

// ─── RisicosTab ───────────────────────────────────────────────────────────────

function RisicosTab({ risks, project, workspace, onRefresh }: {
  risks: Risk[];
  project: Project;
  workspace: { id: string };
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

  return (
    <div>
      {risks.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "12px 0" }}>
          Geen risico&apos;s.
        </div>
      )}
      {risks.map(r => (
        <div key={r.id} style={S.card}>
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
              <label style={S.label as React.CSSProperties}>Impact</label>
              <textarea
                defaultValue={r.impact ?? ""}
                onBlur={e => { if (e.target.value !== (r.impact ?? "")) updateRisk(r.id, { impact: e.target.value || null }); }}
                rows={2}
                style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
              />
            </div>
            <div>
              <label style={S.label as React.CSSProperties}>Maatregel</label>
              <textarea
                defaultValue={r.mitigation ?? ""}
                onBlur={e => { if (e.target.value !== (r.mitigation ?? "")) updateRisk(r.id, { mitigation: e.target.value || null }); }}
                rows={2}
                style={{ ...S.input, width: "100%", resize: "vertical", fontSize: 12.5 }}
              />
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Nieuw risico…"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRisk(); } }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="button" onClick={addRisk} style={S.btnGhost}>
          + Risico
        </button>
      </div>
    </div>
  );
}

// ─── UrenTab ──────────────────────────────────────────────────────────────────

function UrenTab({ hours, project, workspace, onRefresh }: {
  hours: HourRow[];
  project: Project;
  workspace: { id: string };
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>(HOUR_CATS[0]);
  const [hoursVal, setHoursVal] = useState("");
  const [note, setNote] = useState("");

  const totalHours = hours.reduce((s, h) => s + h.hours, 0);
  const pct = project.budget_max > 0 ? Math.min(100, Math.round((totalHours / project.budget_max) * 100)) : 0;
  const barColor = pct >= 90 ? "var(--color-red)" : pct >= 70 ? "var(--color-amber)" : "var(--color-green)";

  const byCategory: Record<string, number> = {};
  for (const h of hours) {
    byCategory[h.category] = (byCategory[h.category] ?? 0) + h.hours;
  }

  async function addHours() {
    const h = parseFloat(hoursVal);
    if (!h || isNaN(h)) return;
    await supabase.from("hours").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      date,
      category,
      hours: h,
      note: note || null,
    });
    setHoursVal("");
    setNote("");
    onRefresh();
  }

  return (
    <div>
      {/* Budget bar */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>Uren verbruikt</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {totalHours.toFixed(1)} / {project.budget_max} uur ({pct}%)
          </span>
        </div>
        <div style={{ height: 9, background: "#E7E8E0", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {Object.entries(byCategory).map(([cat, total]) => (
            <div key={cat} style={{
              background: "var(--color-bone)",
              border: "1px solid var(--color-line)",
              borderRadius: 7,
              padding: "5px 12px",
              fontSize: 12,
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-slate)", display: "block" }}>{cat}</span>
              <span style={{ fontWeight: 600 }}>{total.toFixed(1)}u</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add hours form */}
      <div style={S.card}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 12 }}>Uren registreren</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...S.input, width: 140 }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ ...S.input, flex: 1, minWidth: 160 }}
          >
            {HOUR_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={hoursVal}
            onChange={e => setHoursVal(e.target.value)}
            placeholder="Uren"
            style={{ ...S.input, width: 80 }}
          />
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Aantekening (optioneel)"
            style={{ ...S.input, flex: 1 }}
          />
          <button type="button" onClick={addHours} style={S.btnPrimary}>
            Toevoegen
          </button>
        </div>
      </div>

      {/* Hour entries */}
      {hours.length === 0 ? (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5 }}>Nog geen uren geregistreerd.</div>
      ) : (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-line)" }}>
                {["Datum", "Categorie", "Uren", "Aantekening"].map(h => (
                  <th key={h} style={{ ...S.label, padding: "4px 8px", textAlign: "left" } as React.CSSProperties}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map(h => (
                <tr key={h.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <td style={{ padding: "7px 8px", color: "var(--color-slate)", fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{fmt(h.date)}</td>
                  <td style={{ padding: "7px 8px" }}>{h.category}</td>
                  <td style={{ padding: "7px 8px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{h.hours}u</td>
                  <td style={{ padding: "7px 8px", color: "var(--color-slate)" }}>{h.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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

// ─── VervaldataTab ────────────────────────────────────────────────────────────

function VervaldataTab({ expiries, project, workspace, onRefresh }: {
  expiries: Expiry[];
  project: Project;
  workspace: { id: string };
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>(EXP_TYPES[0]);
  const [newHolder, setNewHolder] = useState("");
  const [newDate, setNewDate] = useState("");

  async function addExpiry() {
    if (!newName.trim() || !newDate) return;
    await supabase.from("expiries").insert({
      workspace_id: workspace.id,
      project_id: project.id,
      name: newName.trim(),
      type: newType,
      holder: newHolder || null,
      date: newDate,
    });
    setNewName(""); setNewHolder(""); setNewDate("");
    onRefresh();
  }

  function expiryColor(d: string) {
    const days = daysTo(d);
    if (days === null) return "var(--color-ink)";
    if (days < 0 || days < 30) return "var(--color-red)";
    if (days < 90) return "var(--color-amber)";
    return "var(--color-ink)";
  }

  return (
    <div>
      {expiries.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "12px 0" }}>
          Geen vervaldata.
        </div>
      )}
      {expiries.map(e => {
        const d = daysTo(e.date);
        const color = expiryColor(e.date);
        return (
          <div key={e.id} style={{ ...S.card, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-slate)", marginTop: 2 }}>
                  {e.type}{e.holder ? ` · ${e.holder}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color }}>{fmt(e.date)}</div>
                {d !== null && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color, marginTop: 2 }}>
                    {d < 0 ? `${-d} dagen geleden verlopen` : d === 0 ? "Verloopt vandaag" : `Nog ${d} dagen`}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ ...S.card, marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 12 }}>Vervaldatum toevoegen</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Naam"
            style={{ ...S.input, flex: 1, minWidth: 140 }}
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value)}
            style={{ ...S.input, width: 150 }}
          >
            {EXP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="text"
            value={newHolder}
            onChange={e => setNewHolder(e.target.value)}
            placeholder="Houder (optioneel)"
            style={{ ...S.input, width: 140 }}
          />
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            style={{ ...S.input, width: 140 }}
          />
          <button type="button" onClick={addExpiry} style={S.btnPrimary}>
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}

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
    tasks_to_create?: { name: string; phase_name?: string }[];
    tasks_to_update?: { name: string; done?: boolean; owner?: string }[];
    log_entry?: string;
    status_updates?: { description: string; field: string; value: string }[];
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
      setAnalysisResult(data.result ?? data.content ?? JSON.stringify(data));
    } catch (e) {
      setAnalysisResult(`Fout: ${(e as Error).message}`);
    }
    setLoading(null);
  }

  async function runAuditPrep() {
    setLoading("audit");
    try {
      const data = await callAI("/api/ai/audit-prep");
      setAuditResult(data.result ?? data.content ?? JSON.stringify(data));
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
        project_context: projectSummary,
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

    // Update tasks
    if (aiResponse.tasks_to_update) {
      for (const t of aiResponse.tasks_to_update) {
        const match = tasks.find(tk => tk.name.toLowerCase().includes(t.name.toLowerCase()));
        if (match) {
          const updates: Partial<Task> = {};
          if (t.done !== undefined) updates.done = t.done;
          if (t.owner) updates.owner = t.owner;
          await supabase.from("tasks").update(updates).eq("id", match.id);
        }
      }
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
          <p style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{analysisResult}</p>
        </div>
      )}

      {auditResult && (
        <div style={{ ...S.card, borderLeft: "3px solid var(--color-sky)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-sky)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Auditvoorbereiding
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{auditResult}</p>
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

          {aiResponse.tasks_to_update && aiResponse.tasks_to_update.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={S.label as React.CSSProperties}>Taakupdates ({aiResponse.tasks_to_update.length})</div>
              <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                {aiResponse.tasks_to_update.map((t, i) => (
                  <li key={i}>{t.name}{t.done ? " → afgerond" : ""}{t.owner ? ` → eigenaar: ${t.owner}` : ""}</li>
                ))}
              </ul>
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

// ─── SnelleUpdateTab ──────────────────────────────────────────────────────────

function SnelleUpdateTab({ project, phases, tasks, tenant }: {
  project: Project;
  phases: Phase[];
  tasks: Task[];
  tenant: { name: string } | null;
}) {
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const openTasks = tasks.filter(t => !t.done).slice(0, 3);
  const d = daysTo(project.audit_date);

  const statusText = `*${tenant?.name ?? "Project"} – ${project.norm} update*

📅 Audit: ${project.audit_date ? (d !== null ? (d >= 0 ? `over ${d} dagen (${fmt(project.audit_date)})` : `${fmt(project.audit_date)} – al geweest`) : fmt(project.audit_date)) : "Nog niet gepland"}
📊 Voortgang: ${progress}% (${doneTasks}/${totalTasks} taken)

🔔 Top acties:
${openTasks.map(t => `- ${t.name}${t.due ? ` (voor ${fmt(t.due)})` : ""}`).join("\n") || "- Geen openstaande acties"}`;

  async function generateAI() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: statusText, format: "whatsapp" }),
      });
      const data = await res.json();
      setAiResult(data.result ?? data.content ?? "");
    } catch {
      setAiResult("Kon AI niet bereiken.");
    }
    setLoading(false);
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div style={S.card}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10 }}>WhatsApp statusupdate</div>
        <pre style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          background: "var(--color-bone)",
          padding: 14,
          borderRadius: 7,
          marginBottom: 12,
        }}>
          {statusText}
        </pre>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => copyToClipboard(statusText)}
            style={S.btnPrimary}
          >
            {copied ? "Gekopieerd!" : "Kopieer"}
          </button>
          <button
            type="button"
            onClick={generateAI}
            disabled={loading}
            style={{ ...S.btnGhost, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Bezig…" : "AI-versie genereren"}
          </button>
        </div>
      </div>

      {aiResult && (
        <div style={S.card}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-green)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            AI-verbeterde versie
          </div>
          <pre style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            background: "var(--color-bone)",
            padding: 14,
            borderRadius: 7,
            marginBottom: 12,
          }}>
            {aiResult}
          </pre>
          <button
            type="button"
            onClick={() => copyToClipboard(aiResult)}
            style={S.btnGhost}
          >
            Kopieer AI-versie
          </button>
        </div>
      )}
    </div>
  );
}

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
  hours: initialHours,
  logEntries: initialLogEntries,
  expiries: initialExpiries,
  tenantMembers,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("fasen");

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Use initial data (refresh reloads from server)
  const phases = initialPhases;
  const tasks = initialTasks;
  const controls = initialControls;
  const documents = initialDocuments;
  const findings = initialFindings;
  const risks = initialRisks;
  const hours = initialHours;
  const logEntries = initialLogEntries;
  const expiries = initialExpiries;
  const project = initialProject;

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
              padding: "9px 14px",
              fontSize: 13,
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
        <FasenTab phases={phases} tasks={tasks} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "maatregelen" && (
        <MaatregelenTab controls={controls} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "documenten" && (
        <DocumentenTab documents={documents} project={project} workspace={workspace} tenantMembers={tenantMembers} onRefresh={refresh} />
      )}
      {activeTab === "bevindingen" && (
        <BevindingenTab findings={findings} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "risicos" && (
        <RisicosTab risks={risks} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "uren" && (
        <UrenTab hours={hours} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "logboek" && (
        <LogboekTab logEntries={logEntries} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "vervaldata" && (
        <VervaldataTab expiries={expiries} project={project} workspace={workspace} onRefresh={refresh} />
      )}
      {activeTab === "planning" && (
        <PlanningTab phases={phases} tasks={tasks} project={project} onRefresh={refresh} />
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
      {activeTab === "update" && (
        <SnelleUpdateTab project={project} phases={phases} tasks={tasks} tenant={tenant} />
      )}
    </div>
  );
}
