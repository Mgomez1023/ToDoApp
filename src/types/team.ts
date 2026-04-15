import type { Database } from "@/types/db";

export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

export type TeamMemberDraft =
  Database["public"]["Tables"]["team_members"]["Insert"];

export type TeamMemberUpdate =
  Database["public"]["Tables"]["team_members"]["Update"];

export type WorkspaceProfile =
  Database["public"]["Tables"]["workspace_profiles"]["Row"];

export const TEAM_MEMBER_COLOR_OPTIONS = [
  "#2563eb",
  "#0f766e",
  "#dc2626",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#65a30d",
  "#be185d",
] as const;
