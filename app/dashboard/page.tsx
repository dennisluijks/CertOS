import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DashboardSearch, { type SearchItem } from "@/components/DashboardSearch";

function daysTo(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
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
    { data: phases },
  ] = await Promise.all([
    supabase.from("projects").select("id, tenant_id, norm, kind, audit_date, budget_max, client_visible").eq("workspace_id", wsId).order("audit_date", { ascending: true }),
    supabase.from("tenants").select("id, name").eq("workspace_id", wsId),
    supabase.from("tasks").select("id, phase_id, name, done, owner, due").eq("workspace_id", wsId),
    supabase.from("documents").select("id, project_id, name, status, owner, due").eq("workspace_id", wsId),
    supabase.from("findings").select("id, project_id, description, owner, due, status").eq("workspace_id", wsId),
    supabase.from("expiries").select("id, project_id, name, type, holder, date").eq("workspace_id", wsId),
    supabase.from("activities").select("id").eq("workspace_id", wsId).eq("read", false),
    supabase.from("phases").select("id, project_id").eq("workspace_id", wsId),
  ]);

  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));
  const phaseProjectMap = Object.fromEntries((phases ?? []).map(ph => [ph.id, ph.project_id]));
  const projectTenantMap = Object.fromEntries((projects ?? []).map(p => [p.id, p.tenant_id]));

  function projectProgress(projectId: string) {
    const projTasks = (tasks ?? []).filter(t => phaseProjectMap[t.phase_id] === projectId);
    const done = projTasks.filter(t => t.done).length;
    return projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;
  }

  // ── Aandacht nodig items ──────────────────────────────────────────────────
  type AttnItem = { kind: string; what: string; owner: string | null; due: string; projectId: string; tenantId: string | null };

  const attentionItems: AttnItem[] = [
    ...(tasks ?? []).filter(t => !t.done && t.due).map(t => {
      const projectId = phaseProjectMap[t.phase_id];
      return { kind: "Taak", what: t.name, owner: t.owner || null, due: t.due!, projectId, tenantId: projectTenantMap[projectId] ?? null };
    }),
    ...(documents ?? []).filter(d => d.status < 3 && d.due).map(d => ({
      kind: "Document", what: d.name, owner: d.owner || null, due: d.due!, projectId: d.project_id, tenantId: projectTenantMap[d.project_id] ?? null,
    })),
    ...(findings ?? []).filter(f => f.status < 2 && f.due).map(f => ({
      kind: "Afwijking", what: f.description, owner: f.owner || null, due: f.due!, projectId: f.project_id, tenantId: projectTenantMap[f.project_id] ?? null,
    })),
    ...(expiries ?? []).map(e => ({
      kind: e.type ? (e.type.charAt(0).toUpperCase() + e.type.slice(1)) : "Verloopdatum",
      what: e.name + (e.holder ? ` — ${e.holder}` : ""),
      owner: null,
      due: e.date,
      projectId: e.project_id,
      tenantId: projectTenantMap[e.project_id] ?? null,
    })),
  ]
    .filter(i => { const d = daysTo(i.due); return d !== null && d <= 90; })
    .sort((a, b) => a.due < b.due ? -1 : 1);

  const overdueCount = attentionItems.filter(i => daysTo(i.due)! < 0).length;
  const auditSoon = (projects ?? []).filter(p => { const d = daysTo(p.audit_date); return d !== null && d >= 0 && d <= 30; }).length;
  const expiringSoon = (expiries ?? []).filter(e => { const d = daysTo(e.date); return d !== null && d <= 90; }).length;
  const unread = activities?.length ?? 0;

  // ── Zoekdata ──────────────────────────────────────────────────────────────
  const searchItems: SearchItem[] = [
    ...(tenants ?? []).map(t => ({ type: "klant" as const, label: t.name, href: "/dashboard/klanten" })),
    ...(projects ?? []).map(p => ({
      type: "traject" as const,
      label: `${tenantMap[p.tenant_id] ?? "?"} — ${p.norm}`,
      sub: tenantMap[p.tenant_id],
      href: `/dashboard/trajecten/${p.id}`,
    })),
    ...(tasks ?? []).filter(t => !t.done).map(t => {
      const projectId = phaseProjectMap[t.phase_id];
      return { type: "taak" as const, label: t.name, sub: tenantMap[projectTenantMap[projectId]] ?? undefined, href: `/dashboard/trajecten/${projectId ?? ""}` };
    }).filter(i => i.href !== "/dashboard/trajecten/"),
    ...(documents ?? []).map(d => ({
      type: "document" as const, label: d.name, sub: tenantMap[projectTenantMap[d.project_id]] ?? undefined, href: `/dashboard/trajecten/${d.project_id}`,
    })),
    ...(findings ?? []).map(f => ({
      type: "afwijking" as const, label: f.description, sub: tenantMap[projectTenantMap[f.project_id]] ?? undefined, href: `/dashboard/trajecten/${f.project_id}`,
    })),
    ...(expiries ?? []).map(e => ({
      type: "diploma" as const,
      label: `${e.name}${e.holder ? ` — ${e.holder}` : ""}`,
      sub: tenantMap[projectTenantMap[e.project_id]] ?? undefined,
      href: `/dashboard/trajecten/${e.project_id}`,
    })),
  ];

  const kpiStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid var(--color-line)",
    borderRadius: 10,
    padding: "14px 16px",
  };

  const kindColor = (kind: string) => {
    if (kind === "Taak") return { bg: "#EEF4FB", color: "#2563EB" };
    if (kind === "Document") return { bg: "#EEF0EA", color: "var(--color-slate)" };
    if (kind === "Afwijking") return { bg: "#FDECEA", color: "var(--color-red)" };
    return { bg: "var(--color-green-tint)", color: "#157A49" };
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>
        Dashboard
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3, marginBottom: 18 }}>
        Alle certificeringstrajecten in één overzicht
      </div>

      <DashboardSearch items={searchItems} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{projects?.length ?? 0}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Trajecten</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, color: auditSoon ? "var(--color-amber)" : undefined }}>{auditSoon}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Audit &lt; 30 dgn</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, color: overdueCount ? "var(--color-red)" : undefined }}>{overdueCount}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Acties over tijd</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 26, fontWeight: 800, color: expiringSoon ? "var(--color-amber)" : undefined }}>{expiringSoon}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Verloopt &lt; 90 dgn</div>
        </div>
      </div>

      {/* Aandacht nodig */}
      {attentionItems.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid var(--color-amber)", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #EFF0E9", display: "flex", alignItems: "center", gap: 10 }}>
            <b style={{ fontSize: 13.5, flex: 1 }}>Aandacht nodig</b>
            {unread > 0 && (
              <Link href="/dashboard/actiecentrum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-green)", fontWeight: 600, textDecoration: "none" }}>
                {unread} nieuwe klantactiviteit{unread !== 1 ? "en" : ""} →
              </Link>
            )}
            <Link href="/dashboard/actiecentrum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", textDecoration: "none" }}>
              naar actiecentrum →
            </Link>
          </div>
          {attentionItems.slice(0, 8).map((item, k) => {
            const d = daysTo(item.due)!;
            const late = d < 0;
            const urgent = !late && d <= 14;
            const tenantName = tenantMap[item.tenantId ?? ""] ?? "—";
            const rightLabel = item.kind === "Diploma" || item.kind === "Certificaat" || item.kind === "Verloopdatum"
              ? tenantName
              : item.owner ? `${item.owner} (${tenantName})` : tenantName;
            const kc = kindColor(item.kind);
            return (
              <Link key={k} href={`/dashboard/trajecten/${item.projectId}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: "1px solid #EFF0E9", fontSize: 13, textDecoration: "none", color: "inherit" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: late ? "var(--color-red)" : urgent ? "var(--color-amber)" : "var(--color-slate)",
                  width: 90,
                  flexShrink: 0,
                }}>
                  {late ? `${-d}D TE LAAT` : `${d}D`}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: kc.bg,
                  color: kc.color,
                  border: `1px solid ${kc.color}22`,
                  flexShrink: 0,
                }}>
                  {item.kind}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.what}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", flexShrink: 0 }}>
                  {rightLabel}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Geen trajecten */}
      {(!projects || projects.length === 0) && (
        <div style={{ padding: 30, textAlign: "center", color: "var(--color-slate)", fontSize: 13.5, border: "1.5px dashed var(--color-line)", borderRadius: 10 }}>
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
            style={{ display: "block", background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, padding: 16, marginBottom: 10, textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--color-ink)", flex: 1 }}>
                {tenantMap[p.tenant_id] ?? "Onbekende klant"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "var(--color-green-tint)", color: "#157A49", letterSpacing: "0.05em" }}>
                {p.norm}
              </span>
              {p.kind === "Hercertificering" && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "#EFE7D6", color: "var(--color-amber)", letterSpacing: "0.05em" }}>
                  HERCERT
                </span>
              )}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: d !== null && d < 14 ? "var(--color-red)" : d !== null && d < 30 ? "var(--color-amber)" : "var(--color-slate)" }}>
                {p.audit_date
                  ? d! >= 0 ? `Audit over ${d} dgn` : `Audit ${-d!} dgn geleden`
                  : "Geen auditdatum"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="bar">
                <i className="bar-fill" style={{ width: `${pr}%` }} />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, width: 38, textAlign: "right", color: "var(--color-ink)" }}>
                {pr}%
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
