import {
  differenceInCalendarDays,
  format,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";

export type DueDateTone = "normal" | "soon" | "today" | "overdue";

export interface DueDateMeta {
  compactDate: string;
  formattedDate: string;
  mobileLabel: string;
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
      compactDate: format(parsedDate, "MMM d"),
      formattedDate: format(parsedDate, "EEE, MMM d"),
      mobileLabel: "Late",
      shortLabel: "Overdue",
      tone: "overdue",
    } satisfies DueDateMeta;
  }

  if (isToday(parsedDate)) {
    return {
      compactDate: format(parsedDate, "MMM d"),
      formattedDate: format(parsedDate, "EEE, MMM d"),
      mobileLabel: "Today",
      shortLabel: "Due today",
      tone: "today",
    } satisfies DueDateMeta;
  }

  if (daysUntilDue <= 3) {
    return {
      compactDate: format(parsedDate, "MMM d"),
      formattedDate: format(parsedDate, "EEE, MMM d"),
      mobileLabel: "Soon",
      shortLabel: "Due soon",
      tone: "soon",
    } satisfies DueDateMeta;
  }

  return {
    compactDate: format(parsedDate, "MMM d"),
    formattedDate: format(parsedDate, "EEE, MMM d"),
    mobileLabel: format(parsedDate, "MMM d"),
    shortLabel: format(parsedDate, "MMM d"),
    tone: "normal",
  } satisfies DueDateMeta;
}
