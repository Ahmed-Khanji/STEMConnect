import { Eye, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProjectCard({ project }) {
  // compact number for views/likes in card footer e.g. 1.2k
  function formatCompact(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(value || 0);
  }

  // short month + year for updatedAt e.g. Sep 2024
  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // owner info comes from populated ownerId on the backend
  const owner = project.ownerId || {};
  const engagement = project.engagement || {};

  return (
    <Link to={`/projects/${project.id}`} className="block">
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#12131a] shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:border-violet-400/40">
      {/* Cover */}
      <div className="relative h-44 w-full">
        <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover" />

        <span className="absolute left-3 top-3 rounded-md bg-[#0f1020]/90 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-violet-200">
          {project.category}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-4 p-4">
        {/* Title & description */}
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-xl font-semibold text-white">{project.title}</h3>
          <p className="line-clamp-2 text-sm text-slate-300">{project.summary}</p>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2">
          <img
            src={owner.avatar}
            alt={owner.name}
            className="h-6 w-6 rounded-full border border-white/20 object-cover"
          />
          <p className="text-xs text-slate-300">{owner.name}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCompact(engagement.views)}
            </span>

            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {formatCompact(engagement.likes)}
            </span>
          </div>

          <span>{formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </article>
    </Link>
  );
}
