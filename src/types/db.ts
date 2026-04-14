export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      task_assignees: {
        Row: {
          task_id: string;
          team_member_id: string;
        };
        Insert: {
          task_id: string;
          team_member_id: string;
        };
        Update: {
          task_id?: string;
          team_member_id?: string;
        };
      };
      tasks: {
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
        Row: {
          avatar_color: string;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          avatar_color: string;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          avatar_color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
      };
    };
  };
}
