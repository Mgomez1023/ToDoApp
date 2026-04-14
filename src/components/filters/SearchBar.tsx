import { Search } from "lucide-react";

interface SearchBarProps {
  onChange: (value: string) => void;
  value: string;
}

export function SearchBar({ onChange, value }: SearchBarProps) {
  return (
    <label className="group relative block flex-1">
      <span className="sr-only">Search tasks by title</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft transition group-focus-within:text-ink" />
      <input
        className="h-12 w-full rounded-2xl border border-line bg-white px-12 text-sm text-ink shadow-card outline-none transition placeholder:text-ink-soft focus:border-accent focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tasks by title"
        type="search"
        value={value}
      />
    </label>
  );
}
