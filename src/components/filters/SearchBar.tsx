import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface SearchBarProps {
  onChange: (value: string) => void;
  onClear: () => void;
  value: string;
}

export function SearchBar({ onChange, onClear, value }: SearchBarProps) {
  return (
    <div className="group relative block flex-1">
      <label className="sr-only" htmlFor="task-search">
        Search tasks
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft transition group-focus-within:text-ink" />
      <input
        id="task-search"
        className="h-10 w-full rounded-xl border border-line/80 bg-slate-50/85 pl-10 pr-10 text-sm text-ink shadow-card outline-none transition placeholder:text-ink-soft focus:border-accent focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search task titles"
        type="search"
        value={value}
      />
      {value ? (
        <Button
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 rounded-lg px-0"
          onClick={onClear}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
