export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    CompositeTypes: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    Functions: {
      find_workspace_profile: {
        Args: {
          lookup_guest_code: string;
        };
        Returns: {
          avatar_color: string;
          created_at: string;
          guest_code: string;
          user_id: string;
        }[];
      };
    };
    Tables: {
      task_assignees: {
        Insert: {
          task_id: string;
          team_member_id: string;
        };
        Relationships: [
          {
            columns: ["task_id"];
            foreignKeyName: "task_assignees_task_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "tasks";
          },
          {
            columns: ["team_member_id"];
            foreignKeyName: "task_assignees_team_member_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "team_members";
          },
        ];
        Row: {
          task_id: string;
          team_member_id: string;
        };
        Update: {
          task_id?: string;
          team_member_id?: string;
        };
      };
      tasks: {
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: "low" | "normal" | "high";
          status?: "todo" | "in_progress" | "in_review" | "done";
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Relationships: [
          {
            columns: ["user_id"];
            foreignKeyName: "tasks_user_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "users";
          },
        ];
        Row: {
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: "low" | "normal" | "high";
          status: "todo" | "in_progress" | "in_review" | "done";
          title: string;
          updated_at: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: "low" | "normal" | "high";
          status?: "todo" | "in_progress" | "in_review" | "done";
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      team_members: {
        Insert: {
          avatar_color: string;
          created_at?: string;
          id?: string;
          linked_user_id?: string | null;
          name: string;
          user_id: string;
        };
        Relationships: [
          {
            columns: ["linked_user_id"];
            foreignKeyName: "team_members_linked_user_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "users";
          },
          {
            columns: ["user_id"];
            foreignKeyName: "team_members_user_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "users";
          },
        ];
        Row: {
          avatar_color: string;
          created_at: string;
          id: string;
          linked_user_id: string | null;
          name: string;
          user_id: string;
        };
        Update: {
          avatar_color?: string;
          created_at?: string;
          id?: string;
          linked_user_id?: string | null;
          name?: string;
          user_id?: string;
        };
      };
      workspace_profiles: {
        Insert: {
          avatar_color: string;
          created_at?: string;
          guest_code: string;
          user_id: string;
        };
        Relationships: [
          {
            columns: ["user_id"];
            foreignKeyName: "workspace_profiles_user_id_fkey";
            isOneToOne: true;
            referencedColumns: ["id"];
            referencedRelation: "users";
          },
        ];
        Row: {
          avatar_color: string;
          created_at: string;
          guest_code: string;
          user_id: string;
        };
        Update: {
          avatar_color?: string;
          created_at?: string;
          guest_code?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
  };
}
