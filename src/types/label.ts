import type { Database } from "@/types/db";

export type Label = Database["public"]["Tables"]["labels"]["Row"];
export type LabelDraft = Database["public"]["Tables"]["labels"]["Insert"];
export type LabelUpdate = Database["public"]["Tables"]["labels"]["Update"];
export type TaskLabelRecord = Database["public"]["Tables"]["task_labels"]["Row"];
export type TaskLabelDraft = Database["public"]["Tables"]["task_labels"]["Insert"];

export type LabelFilter = string | "all";

export const LABEL_COLOR_OPTIONS = [
  "#2563EB",
  "#0891B2",
  "#0F766E",
  "#65A30D",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#BE185D",
  "#7C3AED",
  "#475569",
] as const;
