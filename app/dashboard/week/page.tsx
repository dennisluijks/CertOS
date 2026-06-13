import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function daysTo(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default async function WeekPage() {
  const supabase = await createClient();

  const { data: workspace } = await supabase.from("workspaces").select("id").limit(1).single();
  if (!workspace) return <div>Geen workspace</div>;

  const [
    { data: tasks },
    { data: documents },
    { data: findings },
    { data: phases },
    { data: projects },
    { data: tenants },
  ] = await Promise.all([
    supabase.from("tasks").select("id, name, done, owner, due, phase_id").eq("workspace_id", workspace.id).eq("done", false).not("due", "is", null),
    supabase.from("documents").select("id, name, status, owner, due, project_id").eq("workspace_id", workspace.id).lt("status", 3).not("due", "is", null),
    supabase.from("findings").select("id, description, status, owner, due, project_id").eq("workspace_id", workspace.id).lt("status", 2).not("due", "is", null),
    supabase.from("phases").select("id, project_id").eq("workspace_id", workspace.id),
    supabase.from("projects").select("id, tenant_id, norm").eq("workspace_id", workspace.id),
    supabase.from("tenants").select("id, name").eq("workspace_id", workspace.id),
  ]);

  const phaseMap = Object.fromEntries((phases ?? []).map(p => [p.id, p.project_id]));
  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p]));
  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));

  const today = new Date();
  const in7 = new Date(today.getTime() + 7 * 86400000);

  function inWindow(d: string | null) {
    if (!d) return false;
    const dt = new Date(d);
    return dt <= in7;
  }

  const weekItems = [
    ...(tasks ?? []).filter(t => inWindow(t.due)).map(t => ({
      kind: "Taak", what: t.name, owner: t.owner || "—", due: t.due,
      projectId: phaseMap[t.phase_id ?? ""],
    })),
    ...(documents ?? []).filter(d => inWindow(d.due)).map(d => ({
      kind: "Document", what: d.name, owner: d.owner || "—", due: d.due,
      projectId: d.project_id,
    })),
    ...(findings ?? []).filter(f => inWindow(f.due)).map(f => ({
      kind: "Bevinding", what: f.description, owner: f.owner || "—", due: f.due,
      projectId: f.project_id,
    })),
  ].sort((a, b) => (a.due ?? "9999") < (b.due ?? "9999") ? -1 : 1);

  const overdue = weekItems.filter(i => daysTo(i.due)! < 0);
  const upcoming = weekItems.filter(i => daysTo(i.due)! >= 0);

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    borderTop: "1px solid #EFF0E9",
    fontSize: 13,
  };

  function kindChip(kind: string) {
    return (
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        background: "#EEF0EA",
        color: "var(--color-slate)",
        padding: "2px 7px",
        borderRadius: 4,
        border: "1px solid var(--color-line)",
      }}>
        {kind}
      </span>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em" }}>Mijn week</div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginTop: 3 }}>
        Alles met een deadline in de komende 7 dagen, plus wat al over tijd is
      </div>

      {weekItems.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "var(--color-slate)", fontSize: 13.5, border: "1.5px dashed var(--color-line)", borderRadius: 10, marginTop: 20 }}>
          Niets gepland voor deze week. Geef taken en documenten een deadline.
        </div>
      )}

      {overdue.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid var(--color-red)", borderRadius: 10, marginTop: 16, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "#FDF2F1", fontWeight: 700, fontSize: 13.5, color: "var(--color-red)" }}>
            Over tijd ({overdue.length})
          </div>
          {overdue.map((item, k) => {
            const proj = projectMap[item.projectId];
            return (
              <Link key={k} href={`/dashboard/trajecten/${item.projectId}`} style={{ ...rowStyle, textDecoration: "none", color: "inherit", display: "flex" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600, color: "var(--color-red)", width: 80, flexShrink: 0 }}>
                  {-daysTo(item.due)!}d te laat
                </span>
                {kindChip(item.kind)}
                <span style={{ flex: 1 }}>{item.what}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)" }}>
                  {item.owner} · {tenantMap[proj?.tenant_id ?? ""] ?? "—"}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, marginTop: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #EFF0E9", fontWeight: 700, fontSize: 13.5 }}>
            Komende 7 dagen ({upcoming.length})
          </div>
          {upcoming.map((item, k) => {
            const proj = projectMap[item.projectId];
            const d = daysTo(item.due)!;
            return (
              <Link key={k} href={`/dashboard/trajecten/${item.projectId}`} style={{ ...rowStyle, textDecoration: "none", color: "inherit", display: "flex" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: d === 0 ? "var(--color-red)" : d <= 2 ? "var(--color-amber)" : "var(--color-slate)",
                  width: 80,
                  flexShrink: 0,
                }}>
                  {d === 0 ? "vandaag" : `over ${d}d`}
                </span>
                {kindChip(item.kind)}
                <span style={{ flex: 1 }}>{item.what}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)" }}>
                  {item.owner} · {tenantMap[proj?.tenant_id ?? ""] ?? "—"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
