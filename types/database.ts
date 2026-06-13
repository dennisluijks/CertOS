export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          owner_user_id: string
          accent_color: string
          logo_url: string | null
          plan: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          accent_color?: string
          logo_url?: string | null
          plan?: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: "owner" | "coordinator"
        }
        Insert: { workspace_id: string; user_id: string; role?: "owner" | "coordinator" }
        Update: Partial<Database["public"]["Tables"]["workspace_members"]["Insert"]>
      }
      profiles: {
        Row: {
          user_id: string
          email: string
          full_name: string | null
          global_role: "coordinator" | "client"
        }
        Insert: {
          user_id: string
          email: string
          full_name?: string | null
          global_role: "coordinator" | "client"
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      tenants: {
        Row: {
          id: string
          workspace_id: string
          name: string
          sector: string | null
          contact: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          sector?: string | null
          contact?: string | null
          email?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>
      }
      tenant_members: {
        Row: {
          tenant_id: string
          user_id: string
          role: string
          invited_by: string | null
          created_at: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          role?: string
          invited_by?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["tenant_members"]["Insert"]>
      }
      invitations: {
        Row: {
          id: string
          workspace_id: string
          tenant_id: string
          email: string
          status: "open" | "accepted" | "revoked"
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          tenant_id: string
          email: string
          status?: "open" | "accepted" | "revoked"
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>
      }
      projects: {
        Row: {
          id: string
          workspace_id: string
          tenant_id: string
          norm: string
          kind: string
          audit_date: string | null
          ci: string | null
          bureau: string | null
          budget_max: number
          client_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          tenant_id: string
          norm: string
          kind: string
          audit_date?: string | null
          ci?: string | null
          bureau?: string | null
          budget_max?: number
          client_visible?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>
      }
      phases: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          name: string
          position: number
          start_date: string | null
          end_date: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          name: string
          position?: number
          start_date?: string | null
          end_date?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["phases"]["Insert"]>
      }
      tasks: {
        Row: {
          id: string
          workspace_id: string
          phase_id: string
          name: string
          done: boolean
          owner: string
          assignee_user_id: string | null
          due: string | null
          position: number
        }
        Insert: {
          id?: string
          workspace_id: string
          phase_id: string
          name: string
          done?: boolean
          owner?: string
          assignee_user_id?: string | null
          due?: string | null
          position?: number
        }
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>
      }
      task_comments: {
        Row: {
          id: string
          workspace_id: string
          task_id: string
          user_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          task_id: string
          user_id: string
          body: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["task_comments"]["Insert"]>
      }
      controls: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          code: string
          name: string
          description: string
          status: 0 | 1 | 2 | 3
          note: string
          link: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          code: string
          name: string
          description: string
          status?: 0 | 1 | 2 | 3
          note?: string
          link?: string
        }
        Update: Partial<Database["public"]["Tables"]["controls"]["Insert"]>
      }
      documents: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          name: string
          status: 0 | 1 | 2 | 3
          owner: string
          assignee_user_id: string | null
          due: string | null
          link: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          name: string
          status?: 0 | 1 | 2 | 3
          owner?: string
          assignee_user_id?: string | null
          due?: string | null
          link?: string
        }
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>
      }
      findings: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          description: string
          source: string | null
          severity: string | null
          status: number
          owner: string
          due: string | null
          note: string
          link: string
          client_visible: boolean
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          description: string
          source?: string | null
          severity?: string | null
          status?: number
          owner?: string
          due?: string | null
          note?: string
          link?: string
          client_visible?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["findings"]["Insert"]>
      }
      risks: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          description: string
          impact: string | null
          mitigation: string | null
          status: number
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          description: string
          impact?: string | null
          mitigation?: string | null
          status?: number
        }
        Update: Partial<Database["public"]["Tables"]["risks"]["Insert"]>
      }
      hours: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          date: string
          category: string
          hours: number
          note: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          date: string
          category: string
          hours: number
          note?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["hours"]["Insert"]>
      }
      log_entries: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          date: string
          text: string
          internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          date: string
          text: string
          internal?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["log_entries"]["Insert"]>
      }
      expiries: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          name: string
          type: string
          holder: string | null
          date: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          name: string
          type: string
          holder?: string | null
          date: string
        }
        Update: Partial<Database["public"]["Tables"]["expiries"]["Insert"]>
      }
      activities: {
        Row: {
          id: string
          workspace_id: string
          project_id: string | null
          actor_user_id: string
          kind: "task_done" | "doc_delivered" | "comment"
          description: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id?: string | null
          actor_user_id: string
          kind: "task_done" | "doc_delivered" | "comment"
          description: string
          read?: boolean
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>
      }
    }
    Views: {
      workspace_branding: {
        Row: {
          workspace_id: string
          name: string
          accent_color: string
          logo_url: string | null
        }
      }
    }
    Functions: {
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      is_tenant_client: { Args: { tenant_id: string }; Returns: boolean }
      client_can_see_project: { Args: { project_id: string }; Returns: boolean }
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
