import { Search } from "lucide-react";

export default function ProjectFilters({
  query,
  role,
  commitment,
  sortBy,
  roleOptions,
  commitmentOptions,
  sortOptions,
  onChange,
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#11121a] p-3 lg:grid-cols-[1fr_auto_auto_auto]">
      {/* Search */}
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

        <input
          type="text"
          value={query}
          onChange={(event) => onChange("query", event.target.value)}
          placeholder="Search projects, stacks, or keywords..."
          className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0c12] pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400/70"
        />
      </label>

      {/* Role */}
      <select
        value={role}
        onChange={(event) => onChange("role", event.target.value)}
        className="h-11 min-w-40 rounded-xl border border-white/10 bg-[#0b0c12] px-3 text-sm text-slate-200 outline-none transition focus:border-violet-400/70"
      >
        {roleOptions.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "Role" : option}
          </option>
        ))}
      </select>

      {/* Commitment */}
      <select
        value={commitment}
        onChange={(event) => onChange("commitment", event.target.value)}
        className="h-11 min-w-40 rounded-xl border border-white/10 bg-[#0b0c12] px-3 text-sm text-slate-200 outline-none transition focus:border-violet-400/70"
      >
        {commitmentOptions.map((option) => (
          <option key={option} value={option}>
            {option === "all" ? "Commitment" : option}
          </option>
        ))}
      </select>

      {/* Sort by */}
      <select
        value={sortBy}
        onChange={(event) => onChange("sortBy", event.target.value)}
        className="h-11 min-w-40 rounded-xl border border-white/10 bg-[#0b0c12] px-3 text-sm text-slate-200 outline-none transition focus:border-violet-400/70"
      >
        {sortOptions.map((option) => (
          <option key={option} value={option}>
            {option[0].toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
