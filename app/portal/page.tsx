import { createClient } from "@/lib/supabase/server";
import { CTRL_STATUS, CTRL_COLOR } from "@/lib/norms";

function daysTo(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Haal zichtbare projecten op (RLS zorgt dat client alleen eigen trajecten ziet)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, norm, kind, audit_date, tenant_id, client_visible")
    .eq("client_visible", true);

  if (!projects || projects.length === 0) {
    return (
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Overzicht
        </div>
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-slate)", fontSize: 13.5, border: "1.5px dashed var(--color-line)", borderRadius: 10 }}>
          Er zijn nog geen trajecten gedeeld met jou. Je coördinator maakt ze zichtbaar wanneer het zover is.
        </div>
      </div>
    );
  }

  const projectIds = projects.map(p => p.id);

  const [{ data: tenants }, { data: phases }, { data: tasks }, { data: controls }] = await Promise.all([
    supabase.from("tenants").select("id, name"),
    supabase.from("phases").select("id, project_id, name, position").in("project_id", projectIds).order("position"),
    supabase.from("tasks").select("id, phase_id, done").in("phase_id",
      (await supabase.from("phases").select("id").in("project_id", projectIds)).data?.map(p => p.id) ?? []
    ),
    supabase.from("controls").select("id, project_id, status").in("project_id", projectIds),
  ]);

  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]));
  const phasesByProject = (phases ?? []).reduce((acc, ph) => {
    if (!acc[ph.project_id]) acc[ph.project_id] = [];
    acc[ph.project_id].push(ph);
    return acc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any[]>);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasksByPhase = (tasks ?? []).reduce((acc: Record<string, any[]>, t) => {
    if (!acc[t.phase_id]) acc[t.phase_id] = [];
    acc[t.phase_id].push(t);
    return acc;
  }, {});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsByProject = (controls ?? []).reduce((acc: Record<string, any[]>, c) => {
    if (!acc[c.project_id]) acc[c.project_id] = [];
    acc[c.project_id].push(c);
    return acc;
  }, {});

  function calcProgress(projectId: string) {
    const projectPhases = phasesByProject[projectId] ?? [];
    const allTasks = projectPhases.flatMap(ph => tasksByPhase[ph.id] ?? []);
    const allControls = controlsByProject[projectId] ?? [];
    const taskPct = allTasks.length ? allTasks.filter(t => t.done).length / allTasks.length : 0;
    const ctrlPct = allControls.length ? allControls.filter(c => c.status === 3).length / allControls.length : 0;
    return Math.round(((taskPct + ctrlPct) / 2) * 100);
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-navy)", letterSpacing: "-0.02em", marginBottom: 4 }}>
        Overzicht
      </div>
      <div style={{ color: "var(--color-slate)", fontSize: 13, marginBottom: 20 }}>
        De status van jouw certificeringstrajecten
      </div>

      {projects.map(p => {
        const d = daysTo(p.audit_date);
        const pr = calcProgress(p.id);
        const projectPhases = (phasesByProject[p.id] ?? []).sort((a, b) => a.position - b.position);
        const allCtrlStatuses = (controlsByProject[p.id] ?? []).map(c => c.status);
        const ctrlByStatus = [0, 1, 2, 3].map(s => allCtrlStatuses.filter(x => x === s).length);

        return (
          <div key={p.id} style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 10, padding: 20, marginBottom: 14 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "var(--color-navy)" }}>
                  {tenantMap[p.tenant_id] ?? "Traject"}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
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
                </div>
              </div>
              {p.audit_date && (
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: d !== null && d < 30 ? (d < 0 ? "var(--color-red)" : "var(--color-amber)") : "var(--color-slate)",
                  }}>
                    {d !== null ? (d < 0 ? `Audit ${-d} dgn geleden` : d === 0 ? "Audit vandaag" : `Audit over ${d} dagen`) : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-slate)", marginTop: 2 }}>{fmt(p.audit_date)}</div>
                </div>
              )}
            </div>

            {/* Voortgangsbalk */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--color-slate)" }}>Voortgang</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{pr}%</span>
              </div>
              <div style={{ height: 8, background: "#E7E8E0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pr}%`, background: "var(--color-green)", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>

            {/* Maatregelstatus */}
            {allCtrlStatuses.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--color-slate)", marginBottom: 8 }}>Maatregelen</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[0, 1, 2, 3].map(s => ctrlByStatus[s] > 0 && (
                    <span key={s} style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 4,
                      border: `1.5px solid ${CTRL_COLOR[s]}`,
                      color: CTRL_COLOR[s],
                    }}>
                      {ctrlByStatus[s]} {CTRL_STATUS[s]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fasen */}
            {projectPhases.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: "var(--color-slate)", marginBottom: 8 }}>Fasen</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {projectPhases.map(ph => {
                    const phaseTasks = tasksByPhase[ph.id] ?? [];
                    const donePct = phaseTasks.length ? Math.round(phaseTasks.filter(t => t.done).length / phaseTasks.length * 100) : 0;
                    return (
                      <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                        <div style={{ flex: 1 }}>{ph.name}</div>
                        <div style={{ width: 140, height: 5, background: "#E7E8E0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${donePct}%`, background: donePct === 100 ? "var(--color-green)" : "var(--color-sky)", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate)", width: 32, textAlign: "right" }}>
                          {phaseTasks.length ? `${phaseTasks.filter(t => t.done).length}/${phaseTasks.length}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
