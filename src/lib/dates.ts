import {
  differenceInCalendarDays,
  format,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";

export type DueDateTone = "normal" | "soon" | "today" | "overdue";

export interface DueDateMeta {
  formattedDate: string;
  shortLabel: string;
  tone: DueDateTone;
}

export function getDueDateMeta(dueDate: string | null) {
  if (!dueDate) {
    return null;
  }

  const parsedDate = startOfDay(parseISO(dueDate));
  const today = startOfDay(new Date());
  const daysUntilDue = differenceInCalendarDays(parsedDate, today);

  if (daysUntilDue < 0) {
    return {
      formattedDate: format(parsedDate, "EEE, MMM d"),
      shortLabel: "Overdue",
      tone: "overdue",
    } satisfies DueDateMeta;
  }

  if (isToday(parsedDate)) {
    return {
      formattedDate: format(parsedDate, "EEE, MMM d"),
      shortLabel: "Due today",
      tone: "today",
    } satisfies DueDateMeta;
  }

  if (daysUntilDue <= 3) {
    return {
      formattedDate: format(parsedDate, "EEE, MMM d"),
      shortLabel: "Due soon",
      tone: "soon",
    } satisfies DueDateMeta;
  }

  return {
    formattedDate: format(parsedDate, "EEE, MMM d"),
    shortLabel: format(parsedDate, "MMM d"),
    tone: "normal",
  } satisfies DueDateMeta;
}
