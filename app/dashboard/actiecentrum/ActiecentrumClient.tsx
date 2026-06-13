"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

function daysTo(d: string | null | undefined) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

interface TaskItem {
  id: string;
  phase_id: string;
  name: string;
  done: boolean;
  owner: string;
  due: string | null;
  assignee_user_id: string | null;
  project_id: string;
  tenant_name: string;
}

interface DocItem {
  id: string;
  project_id: string;
  name: string;
  status: number;
  owner: string;
  due: string | null;
  tenant_name: string;
}

interface FindingItem {
  id: string;
  project_id: string;
  description: string;
  owner: string;
  due: string | null;
  status: number;
  tenant_name: string;
}

interface Activity {
  id: string;
  project_id: string | null;
  actor_user_id: string;
  kind: "task_done" | "doc_delivered" | "comment";
  description: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  wsId: string;
  tasks: TaskItem[];
  documents: DocItem[];
  findings: FindingItem[];
  activities: Activity[];
  profiles: Profile[];
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
  card: {
    background: "#fff",
    border: "1px solid var(--color-line)",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid var(--color-line)",
    fontSize: 13,
  },
};

function DueBadge({ due }: { due: string | null }) {
  const d = daysTo(due);
  if (d === null) return null;
  const color = d < 0 ? "var(--color-red)" : d < 7 ? "var(--color-amber)" : "var(--color-slate)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      fontWeight: 600,
      color,
      whiteSpace: "nowrap",
    }}>
      {d < 0 ? `${-d}d te laat` : d === 0 ? "Vandaag" : `${d}d`}
    </span>
  );
}

function KindBadge({ kind }: { kind: string }) {
  const colors: Record<string, string> = {
    Taak: "var(--color-sky)",
    Document: "var(--color-amber)",
    Bevinding: "var(--color-red)",
  };
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 4,
      background: "#F0F0F0",
      color: colors[kind] ?? "var(--color-slate)",
      border: "1px solid var(--color-line)",
      flexShrink: 0,
    }}>
      {kind}
    </span>
  );
}

const KIND_LABELS: Record<string, string> = {
  task_done: "Taak afgerond",
  doc_delivered: "Document aangeleverd",
  comment: "Reactie",
};

export default function ActiecentrumClient({
  wsId,
  tasks,
  documents,
  findings,
  activities,
  profiles,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [ownerFilter, setOwnerFilter] = useState("");
  const [markingRead, setMarkingRead] = useState(false);

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name ?? p.email]));

  // Collect all unique owners
  const allOwners = Array.from(new Set([
    ...tasks.map(t => t.owner),
    ...documents.map(d => d.owner),
    ...findings.map(f => f.owner),
  ].filter(Boolean)));

  // Combined items
  type ActionItem = {
    kind: string;
    name: string;
    owner: string;
    due: string | null;
    tenant_name: string;
    project_id: string;
  };

  const allItems: ActionItem[] = [
    ...tasks.map(t => ({ kind: "Taak", name: t.name, owner: t.owner, due: t.due, tenant_name: t.tenant_name, project_id: t.project_id })),
    ...documents.map(d => ({ kind: "Document", name: d.name, owner: d.owner, due: d.due, tenant_name: d.tenant_name, project_id: d.project_id })),
    ...findings.map(f => ({ kind: "Bevinding", name: f.description, owner: f.owner, due: f.due, tenant_name: f.tenant_name, project_id: f.project_id })),
  ].sort((a, b) => {
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  });

  const filtered = ownerFilter
    ? allItems.filter(i => i.owner === ownerFilter)
    : allItems;

  const unreadCount = activities.filter(a => !a.read).length;

  async function markAllRead() {
    setMarkingRead(true);
    await supabase
      .from("activities")
      .update({ read: true })
      .eq("workspace_id", wsId)
      .eq("read", false);
    setMarkingRead(false);
    router.refresh();
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 6 }}>
        Actiecentrum
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginBottom: 20 }}>
        Alle openstaande taken, documenten en bevindingen gesorteerd op deadline.
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <label style={S.label as React.CSSProperties}>Filter op eigenaar</label>
        <select
          value={ownerFilter}
          onChange={e => setOwnerFilter(e.target.value)}
          style={{
            padding: "7px 12px",
            fontSize: 13,
            border: "1px solid var(--color-line)",
            borderRadius: 7,
            background: "#fff",
            color: "var(--color-ink)",
          }}
        >
          <option value="">— Iedereen —</option>
          {allOwners.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", marginLeft: "auto" }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items list */}
      <div style={S.card}>
        {filtered.length === 0 ? (
          <div style={{ color: "var(--color-slate)", fontSize: 13.5, padding: "8px 0" }}>
            Geen openstaande acties.
          </div>
        ) : (
          filtered.map((item, i) => (
            <div key={i} style={S.row}>
              <DueBadge due={item.due} />
              <KindBadge kind={item.kind} />
              <Link
                href={`/dashboard/trajecten/${item.project_id}`}
                style={{ flex: 1, color: "var(--color-ink)", textDecoration: "none", fontWeight: 500 }}
              >
                {item.name}
              </Link>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", flexShrink: 0 }}>
                {item.owner || "—"} · {item.tenant_name}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", flexShrink: 0 }}>
                {fmt(item.due)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Klantactiviteit */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-navy)", flex: 1 }}>
            Klantactiviteit
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8,
                background: "var(--color-red)",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 10,
                verticalAlign: "middle",
              }}>
                {unreadCount} nieuw
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingRead}
              style={{
                background: "#fff",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
                borderRadius: 7,
                padding: "6px 14px",
                fontSize: 12.5,
                cursor: markingRead ? "not-allowed" : "pointer",
                opacity: markingRead ? 0.6 : 1,
              }}
            >
              {markingRead ? "Markeren…" : "Alles als gelezen markeren"}
            </button>
          )}
        </div>

        <div style={S.card}>
          {activities.length === 0 ? (
            <div style={{ color: "var(--color-slate)", fontSize: 13.5 }}>
              Geen klantactiviteiten.
            </div>
          ) : (
            activities.map((a, i) => (
              <div
                key={a.id}
                style={{
                  ...S.row,
                  background: !a.read ? "#FFFBF0" : "transparent",
                  marginLeft: !a.read ? -4 : 0,
                  paddingLeft: !a.read ? 12 : 0,
                  borderRadius: !a.read ? 4 : 0,
                  borderBottom: i < activities.length - 1 ? "1px solid var(--color-line)" : "none",
                }}
              >
                {!a.read && (
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--color-amber)",
                    flexShrink: 0,
                    display: "inline-block",
                  }} />
                )}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--color-slate)", flexShrink: 0 }}>
                  {KIND_LABELS[a.kind] ?? a.kind}
                </span>
                {a.project_id ? (
                  <Link
                    href={`/dashboard/trajecten/${a.project_id}`}
                    style={{ flex: 1, color: "var(--color-ink)", textDecoration: "none" }}
                  >
                    {a.description}
                  </Link>
                ) : (
                  <span style={{ flex: 1 }}>{a.description}</span>
                )}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", flexShrink: 0 }}>
                  {profileMap[a.actor_user_id] ?? a.actor_user_id}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-grey)", flexShrink: 0 }}>
                  {fmt(a.created_at.slice(0, 10))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
