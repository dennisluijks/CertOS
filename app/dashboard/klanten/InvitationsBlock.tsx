"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

interface Props {
  tenantId: string;
  workspaceId: string;
  prefillEmail?: string;
}

export default function InvitationsBlock({ tenantId, workspaceId, prefillEmail }: Props) {
  const [invitations, setInvitations] = useState<Tables<"invitations">[]>([]);
  const [members, setMembers] = useState<{ user_id: string; email: string; full_name: string | null }[]>([]);
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: invs }, { data: mems }] = await Promise.all([
        supabase.from("invitations").select("*").eq("tenant_id", tenantId).eq("status", "open").order("created_at"),
        supabase.from("tenant_members").select("user_id, profiles(email, full_name)").eq("tenant_id", tenantId),
      ]);
      setInvitations(invs ?? []);
      setMembers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mems ?? []).map((m: any) => {
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return {
            user_id: m.user_id as string,
            email: profile?.email ?? "?",
            full_name: profile?.full_name ?? null,
          };
        })
      );
    }
    load();
  }, [tenantId]);

  async function invite() {
    if (!email.trim()) return;
    setLoading(true);
    setMsg("");

    // Check of al gebruiker
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email.trim())
      .single();

    if (profile) {
      // Direct koppelen
      await supabase.from("tenant_members").upsert({ tenant_id: tenantId, user_id: profile.user_id, role: "client" });
      setMsg("Gebruiker direct gekoppeld aan dit traject.");
    } else {
      // Uitnodiging aanmaken
      const { error } = await supabase.from("invitations").insert({
        workspace_id: workspaceId,
        tenant_id: tenantId,
        email: email.trim(),
      });
      if (!error) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cert-os.nl";
        setMsg(`Uitnodiging aangemaakt. Stuur de persoon de link naar ${appUrl}/auth/login`);
        const { data: newInv } = await supabase.from("invitations").select("*").eq("tenant_id", tenantId).eq("email", email.trim()).eq("status", "open").single();
        if (newInv) setInvitations(prev => [...prev, newInv]);
      } else if (error.code === "23505") {
        setMsg("Er is al een openstaande uitnodiging voor dit e-mailadres.");
      } else {
        setMsg("Er ging iets mis: " + error.message);
      }
    }
    setEmail("");
    setLoading(false);
  }

  async function revoke(invId: string) {
    await supabase.from("invitations").update({ status: "revoked" }).eq("id", invId);
    setInvitations(prev => prev.filter(i => i.id !== invId));
  }

  async function removeMember(userId: string) {
    if (!confirm("Toegang intrekken voor deze gebruiker?")) return;
    await supabase.from("tenant_members").delete().eq("tenant_id", tenantId).eq("user_id", userId);
    setMembers(prev => prev.filter(m => m.user_id !== userId));
  }

  const inputStyle: React.CSSProperties = { padding: "8px 11px", borderRadius: 7, border: "1px solid var(--color-line)", fontSize: 13.5, fontFamily: "var(--font-archivo)", flex: 1 };
  const labelStyle: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--color-slate)", display: "block", marginBottom: 5 };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14, color: "var(--color-navy)" }}>Portaaltoegang</div>

      {/* Actieve leden */}
      {members.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Actieve klantgebruikers</label>
          {members.map(m => (
            <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{m.full_name ?? m.email}</span>
                {m.full_name && <span style={{ color: "var(--color-slate)", marginLeft: 6, fontSize: 12 }}>{m.email}</span>}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "var(--color-green-tint)", color: "#157A49", border: "1px solid var(--color-green)" }}>ACTIEF</span>
              <button onClick={() => removeMember(m.user_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-red)", fontSize: 12, padding: "4px 8px" }}>Intrekken</button>
            </div>
          ))}
        </div>
      )}

      {/* Open uitnodigingen */}
      {invitations.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Openstaande uitnodigingen</label>
          {invitations.map(inv => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13 }}>
              <span style={{ flex: 1 }}>{inv.email}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#EEF0EA", color: "var(--color-slate)", border: "1px solid var(--color-line)" }}>WACHT</span>
              <button onClick={() => revoke(inv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-red)", fontSize: 12, padding: "4px 8px" }}>Intrekken</button>
            </div>
          ))}
        </div>
      )}

      {/* Uitnodigen */}
      <label style={labelStyle}>Uitnodigen op e-mail</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={inputStyle}
          type="email"
          placeholder="naam@bedrijf.nl"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && invite()}
        />
        <button
          onClick={invite}
          disabled={loading || !email.trim()}
          style={{ background: "var(--color-green)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 14px", borderRadius: 7, border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "…" : "Uitnodigen"}
        </button>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: "var(--color-slate)" }}>{msg}</div>}
    </div>
  );
}
