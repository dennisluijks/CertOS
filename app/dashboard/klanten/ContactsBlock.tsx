"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

interface Props {
  tenantId: string;
  workspaceId: string;
  onInvite?: (email: string) => void;
}

export default function ContactsBlock({ tenantId, workspaceId, onInvite }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "var(--color-slate)",
    display: "block",
    marginBottom: 5,
  };

  useEffect(() => {
    supabase
      .from("tenant_contacts")
      .select("id, name, email")
      .eq("tenant_id", tenantId)
      .order("name")
      .then(({ data }) => setContacts(data ?? []));
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addContact() {
    if (!name.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from("tenant_contacts")
      .insert({ workspace_id: workspaceId, tenant_id: tenantId, name: name.trim(), email: email.trim() || null })
      .select("id, name, email")
      .single();
    if (data) setContacts(prev => [...prev, data]);
    setName("");
    setEmail("");
    setLoading(false);
  }

  async function deleteContact(id: string) {
    if (!confirm("Contactpersoon verwijderen?")) return;
    await supabase.from("tenant_contacts").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 14, color: "var(--color-navy)" }}>Contactpersonen</div>

      {contacts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {contacts.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--color-line)", fontSize: 13 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                {c.email && <span style={{ color: "var(--color-slate)", marginLeft: 8, fontSize: 12 }}>{c.email}</span>}
              </div>
              {c.email && onInvite && (
                <button
                  onClick={() => onInvite(c.email!)}
                  style={{ background: "none", border: "1px solid var(--color-green)", color: "var(--color-green)", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, cursor: "pointer" }}
                >
                  Portaaltoegang
                </button>
              )}
              <button
                onClick={() => deleteContact(c.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-red)", fontSize: 12, padding: "4px 8px" }}
              >
                Verwijder
              </button>
            </div>
          ))}
        </div>
      )}

      {contacts.length === 0 && (
        <div style={{ color: "var(--color-slate)", fontSize: 13, marginBottom: 12 }}>
          Nog geen contactpersonen toegevoegd.
        </div>
      )}

      <label style={labelStyle}>Contactpersoon toevoegen</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Naam *"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addContact()}
          style={{ padding: "8px 11px", borderRadius: 7, border: "1px solid var(--color-line)", fontSize: 13.5, fontFamily: "var(--font-archivo)", flex: "1 1 140px", minWidth: 120 }}
        />
        <input
          type="email"
          placeholder="E-mail (optioneel)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addContact()}
          style={{ padding: "8px 11px", borderRadius: 7, border: "1px solid var(--color-line)", fontSize: 13.5, fontFamily: "var(--font-archivo)", flex: "2 1 180px", minWidth: 140 }}
        />
        <button
          onClick={addContact}
          disabled={loading || !name.trim()}
          style={{ background: "var(--color-green)", color: "#fff", fontWeight: 600, fontSize: 13, padding: "8px 14px", borderRadius: 7, border: "none", cursor: loading ? "default" : "pointer", opacity: loading || !name.trim() ? 0.6 : 1 }}
        >
          Toevoegen
        </button>
      </div>
    </div>
  );
}
