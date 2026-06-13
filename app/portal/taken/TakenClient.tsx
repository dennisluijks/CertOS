"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

interface Props {
  tasks: Tables<"tasks">[];
  phaseMap: Record<string, { id: string; project_id: string; name: string }>;
  projectMap: Record<string, { id: string; norm: string; tenant_id: string; audit_date: string | null }>;
  tenantMap: Record<string, string>;
  comments: Tables<"task_comments">[];
  userId: string;
}

function daysTo(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function fmt(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function TakenClient({ tasks: initialTasks, phaseMap, projectMap, tenantMap, comments: initialComments, userId }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [comments, setComments] = useState(initialComments);
  const [openCommentTask, setOpenCommentTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  async function toggleDone(taskId: string, currentDone: boolean) {
    if (currentDone) return; // kan alleen van niet-gedaan naar gedaan
    const { error } = await supabase.from("tasks").update({ done: true }).eq("id", taskId);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  }

  async function postComment(taskId: string, workspaceId: string) {
    if (!commentText.trim()) return;
    setPosting(true);
    const { data } = await supabase.from("task_comments").insert({
      task_id: taskId,
      workspace_id: workspaceId,
      user_id: userId,
      body: commentText.trim(),
    }).select().single();
    if (data) {
      setComments(prev => [...prev, data]);
      setCommentText("");
    }
    setPosting(false);
  }

  if (tasks.length === 0) {
    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Mijn taken
        </div>
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-slate)", fontSize: 13.5, border: "1.5px dashed var(--color-line)", borderRadius: 10 }}>
          Je hebt geen openstaande taken. Goed werk.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 4 }}>
        Mijn taken
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginBottom: 20 }}>
        Vink taken af zodra je ze hebt afgerond. Je coördinator ziet dit direct.
      </div>

      {tasks.map(task => {
        const phase = phaseMap[task.phase_id];
        const project = phase ? projectMap[phase.project_id] : null;
        const tenantName = project ? tenantMap[project.tenant_id] : "—";
        const d = daysTo(task.due);
        const taskComments = comments.filter(c => c.task_id === task.id);
        const isOpen = openCommentTask === task.id;

        return (
          <div key={task.id} style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
              {/* Checkbox */}
              <button
                onClick={() => toggleDone(task.id, task.done)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `2px solid var(--color-green)`,
                  background: task.done ? "var(--color-green)" : "#fff",
                  cursor: "pointer",
                  flexShrink: 0,
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {task.done && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6 L5 9 L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-ink)" }}>{task.name}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--color-slate)" }}>
                    {tenantName} · {phase?.name ?? "—"}
                  </span>
                  {task.due && (
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: d !== null && d < 0 ? "var(--color-red)" : d !== null && d <= 3 ? "var(--color-amber)" : "var(--color-slate)",
                    }}>
                      {d !== null && d < 0 ? `${-d}d te laat` : d === 0 ? "vandaag" : fmt(task.due)}
                    </span>
                  )}
                </div>
              </div>

              {/* Reactie knop */}
              <button
                onClick={() => setOpenCommentTask(isOpen ? null : task.id)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-line)",
                  borderRadius: 7,
                  padding: "5px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--color-slate)",
                  fontFamily: "var(--font-archivo)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {taskComments.length > 0 && taskComments.length}
              </button>
            </div>

            {/* Commentaarblok */}
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--color-line)", padding: 14, background: "var(--color-bone)" }}>
                {taskComments.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--color-slate)", marginBottom: 10 }}>
                    Nog geen reacties. Stel hier een vraag aan je coördinator.
                  </div>
                )}
                {taskComments.map(c => (
                  <div key={c.id} style={{ marginBottom: 8, fontSize: 13 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-slate)" }}>
                        {new Date(c.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div style={{
                      background: c.user_id === userId ? "var(--color-green-tint)" : "#fff",
                      border: "1px solid var(--color-line)",
                      borderRadius: 7,
                      padding: "8px 12px",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}>
                      {c.body}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !posting && postComment(task.id, task.workspace_id)}
                    placeholder="Typ een reactie…"
                    style={{ flex: 1, padding: "8px 11px", fontSize: 13, borderRadius: 7, border: "1px solid var(--color-line)", fontFamily: "var(--font-archivo)" }}
                  />
                  <button
                    onClick={() => postComment(task.id, task.workspace_id)}
                    disabled={posting || !commentText.trim()}
                    style={{
                      background: "var(--color-green)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: posting ? "default" : "pointer",
                      fontFamily: "var(--font-archivo)",
                    }}
                  >
                    Versturen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
