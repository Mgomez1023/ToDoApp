import type { Database } from "@/types/db";

export type TaskComment = Database["public"]["Tables"]["comments"]["Row"];
export type TaskCommentDraft = Database["public"]["Tables"]["comments"]["Insert"];
export type TaskCommentUpdate = Database["public"]["Tables"]["comments"]["Update"];
