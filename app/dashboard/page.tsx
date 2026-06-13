import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CTRL_COLOR, CTRL_STATUS } from "@/lib/norms";

function daysTo(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .single();

  if (!workspace) {
    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Dashboard
        </div>
        <div style={{ color: "var(--color-slate)", fontSize: 13.5 }}>
          Geen workspace gevonden. <Link href="/auth/onboarding" style={{ color: "var(--color-green)", fontWeight: 600 }}>Maak er een aan</Link>.
        </div>
      </div>
    );
  }

  const wsId = workspace.id;

  const [
    { data: projects },
    { data: tenants },
    { data: tasks },
    { data: documents },
    { data: findings },
    { data: expiries },
    { data: activities },
  ] = await Promise.all([
    supabase.from("projects").select("id, tenant_id, norm, kind, audit_date, budget_max, client_visible").eq("workspace_id", wsId).order("audit_date", { ascending: true }),
    supabase.from("tenants").select("id, name").eq("workspace_id", wsId),
    supabase.from("tasks").select("id, phase_id, name, done, owner, due, assignee_user_id").eq("workspace_id", wsId),
    supabase.from("documents").select("id, project_id, name, status, owner, due").eq("workspace_id", wsId),
    supabase.from("findings").select("id, project_id, description, owner, due, status").eq("workspace_id", wsId),
    supabase.from("expiries").select("id, project_id, name, type, holder, date").eq("workspace_id", wsId),
    supabase.from("activities").select("id").eq("workspace_id", wsId).eq("read", false),
  ]);

  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));

  // Bereken voortgang per project
  const phaseData = await supabase.from("phases").select("id, project_id").eq("workspace_id", wsId);
  const tasksByPhase = Object.fromEntries(
    (phaseData.data ?? []).map(ph => [ph.id, ph.project_id])
  );

  function projectProgress(projectId: string) {
    const projTasks = (tasks ?? []).filter(t => tasksByPhase[t.phase_id] === projectId);
    const done = projTasks.filter(t => t.done).length;
    return projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
  }

  // Chase items (open taken/docs/findings met due)
  const chaseItems = [
    ...(tasks ?? []).filter(t => !t.done && t.due).map(t => ({
      kind: "Taak", what: t.name, owner: t.owner || "—", due: t.due!,
      projectId: tasksByPhase[t.phase_id],
    })),
    ...(documents ?? []).filter(d => d.status < 3 && d.due).map(d => ({
      kind: "Document", what: d.name, owner: d.owner || "—", due: d.due!,
      projectId: d.project_id,
    })),
    ...(findings ?? []).filter(f => f.status < 2 && f.due).map(f => ({
      kind: "Bevinding", what: f.description, owner: f.owner || "—", due: f.due!,
      projectId: f.project_id,
    })),
  ].sort((a, b) => a.due < b.due ? -1 : 1);

  const overdue = chaseItems.filter(i => daysTo(i.due)! < 0).length;
  const auditSoon = (projects ?? []).filter(p => { const d = daysTo(p.audit_date); return d !== null && d >= 0 && d <= 30; }).length;
  const expiringSoon = (expiries ?? []).filter(e => { const d = daysTo(e.date); return d !== null && d <= 90; }).length;
  const unread = activities?.length ?? 0;

  const kpiStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid var(--color-line)",
    borderRadius: 10,
    padding: "14px 16px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>
        Dashboard
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3 }}>
        Alle certificeringstrajecten in één overzicht
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, margin: "20px 0" }}>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{projects?.length ?? 0}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Trajecten</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, color: auditSoon ? "var(--color-amber)" : undefined }}>{auditSoon}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Audit &lt; 30 dgn</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, color: overdue ? "var(--color-red)" : undefined }}>{overdue}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Acties over tijd</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, color: expiringSoon ? "var(--color-amber)" : undefined }}>{expiringSoon}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Verloopt &lt; 90 dgn</div>
        </div>
      </div>

      {/* Attentiepunten */}
      {(overdue > 0 || unread > 0) && (
        <div style={{
          background: "#fff",
          border: "1px solid var(--color-amber)",
          borderRadius: 10,
          marginBottom: 12,
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #EFF0E9", display: "flex", alignItems: "center", gap: 10 }}>
            <b style={{ fontSize: 13.5 }}>Aandacht nodig</b>
            {unread > 0 && (
              <Link href="/dashboard/actiecentrum" style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-green)",
                fontWeight: 600,
                textDecoration: "none",
              }}>
                {unread} nieuwe klantactiviteit{unread !== 1 ? "en" : ""} →
              </Link>
            )}
          </div>
          {chaseItems.filter(i => daysTo(i.due)! < 0).slice(0, 5).map((item, k) => (
            <div key={k} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 14px",
              borderTop: k > 0 ? "1px solid #EFF0E9" : undefined,
              fontSize: 13,
            }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--color-red)",
                width: 84,
                flexShrink: 0,
              }}>
                {-daysTo(item.due)!}d te laat
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                background: "#EEF0EA",
                color: "var(--color-slate)",
                padding: "2px 7px",
                borderRadius: 4,
                border: "1px solid var(--color-line)",
              }}>
                {item.kind}
              </span>
              <span style={{ flex: 1 }}>{item.what}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)" }}>
                {item.owner} · {tenantMap[item.projectId] ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Geen trajecten */}
      {(!projects || projects.length === 0) && (
        <div style={{
          padding: 30,
          textAlign: "center",
          color: "var(--color-slate)",
          fontSize: 13.5,
          border: "1.5px dashed var(--color-line)",
          borderRadius: 10,
        }}>
          Nog geen trajecten.{" "}
          <Link href="/dashboard/nieuw" style={{ color: "var(--color-green)", fontWeight: 600 }}>
            Start een eerste traject →
          </Link>
        </div>
      )}

      {/* Trajectkaarten */}
      {(projects ?? []).map(p => {
        const d = daysTo(p.audit_date);
        const pr = projectProgress(p.id);
        return (
          <Link
            key={p.id}
            href={`/dashboard/trajecten/${p.id}`}
            style={{
              display: "block",
              background: "#fff",
              border: "1px solid var(--color-line)",
              borderRadius: 10,
              padding: 16,
              marginBottom: 10,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-ink)", flex: 1 }}>
                {tenantMap[p.tenant_id] ?? "Onbekende klant"}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 4,
                background: "var(--color-green-tint)",
                color: "#157A49",
                letterSpacing: "0.05em",
              }}>
                {p.norm}
              </span>
              {p.kind === "Hercertificering" && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "3px 8px",
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
                {p.audit_date
                  ? d! >= 0 ? `Audit over ${d} dgn` : `Audit ${-d!} dgn geleden`
                  : "Geen auditdatum"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="bar">
                <i className="bar-fill" style={{ width: `${pr}%` }} />
              </div>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 600,
                width: 38,
                textAlign: "right",
                color: "var(--color-ink)",
              }}>
                {pr}%
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
