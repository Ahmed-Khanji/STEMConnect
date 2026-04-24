import { Eye, ThumbsUp, Users, Clock, CalendarDays } from "lucide-react";

// status badge color mapping
const STATUS_COLORS = {
  recruiting: "bg-green-500/20 text-green-300 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  archived: "bg-red-500/20 text-red-300 border-red-500/30",
};

const COMMITMENT_LABELS = {
  hackathon: "Hackathon",
  side_project: "Side Project",
  startup: "Startup",
};

export default function ProjectHeader({ project, onJoin }) {
  const owner = project.ownerId || {};
  const engagement = project.engagement || {};
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.archived;
  const commitmentLabel = COMMITMENT_LABELS[project.commitment] || project.commitment;

  function formatCompact(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(value || 0);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1017]">
      {/* Cover image */}
      <div className="relative h-64 w-full md:h-80">
        <img
          src={project.imageUrl}
          alt={project.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1017] via-[#0f1017]/40 to-transparent" />

        {/* Category + status chips */}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-md bg-[#0f1020]/90 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-violet-200">
            {project.category}
          </span>
          <span className={`rounded-md border px-2 py-1 text-[10px] uppercase tracking-[0.08em] ${statusColor}`}>
            {project.status?.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Title + join button */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{project.title}</h1>

            {/* Owner row */}
            <div className="mt-2 flex items-center gap-2">
              <img
                src={owner.avatar}
                alt={owner.name}
                className="h-6 w-6 rounded-full border border-white/20 object-cover"
              />
              <span className="text-sm text-slate-400">{owner.name}</span>
            </div>
          </div>

          {/* Join CTA */}
          <button
            type="button"
            onClick={onJoin}
            className="h-11 rounded-xl bg-violet-500 px-7 text-sm font-semibold text-white transition hover:bg-violet-400 active:scale-95"
          >
            Join Project
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-5 border-t border-white/10 pt-4 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {commitmentLabel}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {(project.rolesNeeded || []).length} role{project.rolesNeeded?.length !== 1 ? "s" : ""} needed
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {formatCompact(engagement.views)} views
          </span>

          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4" />
            {formatCompact(engagement.likes)} likes
          </span>

          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Updated {formatDate(project.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
