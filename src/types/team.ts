import type { Database } from "@/types/db";

export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

export type TeamMemberDraft =
  Database["public"]["Tables"]["team_members"]["Insert"];

export type TeamMemberUpdate =
  Database["public"]["Tables"]["team_members"]["Update"];
