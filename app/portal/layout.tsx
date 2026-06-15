export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("global_role")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/auth/login");
  if (profile.global_role === "coordinator") redirect("/dashboard");

  // Haal workspace branding op via eerste tenant van deze client
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenants(workspace_id, workspaces(name, accent_color, logo_url))")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantData = (membership as any)?.tenants;
  const wsData = Array.isArray(tenantData) ? tenantData[0] : tenantData;
  const wsArr = wsData?.workspaces;
  const ws = Array.isArray(wsArr) ? wsArr[0] : wsArr;
  const accentColor = ws?.accent_color ?? "#21A865";
  const workspaceName = ws?.name ?? "CertOS";
  const logoUrl = ws?.logo_url ?? null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bone)", fontFamily: "var(--font-archivo)" }}>
      {/* Portal header */}
      <header style={{
        background: "var(--color-navy)",
        padding: "0 16px",
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: 14,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={workspaceName} style={{ height: 32, objectFit: "contain" }} />
        ) : (
          <>
            <svg width="26" height="30" viewBox="0 0 100 116" fill="none" aria-hidden="true">
              <path d="M50 5 L89 27 V61 L50 83 L11 61 V27 Z" stroke="#FFFFFF" strokeWidth="9" fill="none" strokeLinejoin="round"/>
              <path d="M31 42 L46 57 L73 29" stroke={accentColor} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 80 L50 98 L85 80" stroke={accentColor} strokeWidth="8" fill="none" strokeLinecap="round"/>
              <path d="M15 94 L50 112 L85 94" stroke="#FFFFFF" strokeWidth="8" fill="none" strokeLinecap="round"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>
              Cert<span style={{ color: accentColor }}>OS</span>
            </span>
          </>
        )}
        <span style={{ color: "#7E93C4", fontSize: 13, marginLeft: 4 }}>{workspaceName}</span>
        <div style={{ flex: 1 }} />
        <form action="/auth/signout" method="POST">
          <a href="/auth/login" style={{ color: "#7E93C4", fontSize: 12, textDecoration: "none" }}>Uitloggen</a>
        </form>
      </header>

      {/* Portal nav */}
      <PortalNav accentColor={accentColor} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 40px" }}>
        {children}
      </main>
    </div>
  );
}

function PortalNav({ accentColor }: { accentColor: string }) {
  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid var(--color-line)",
      padding: "0 16px",
      display: "flex",
      gap: 0,
      overflowX: "auto",
    }}>
      {[
        { href: "/portal", label: "Overzicht" },
        { href: "/portal/taken", label: "Mijn taken" },
        { href: "/portal/documenten", label: "Documenten" },
      ].map(item => (
        <a
          key={item.href}
          href={item.href}
          style={{
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-navy)",
            textDecoration: "none",
            borderBottom: `2.5px solid ${accentColor}`,
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
