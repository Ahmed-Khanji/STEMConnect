import { Link } from "react-router-dom";
import ProjectCard from "./ProjectCard";

export default function ProjectList({ projects, hasActiveFilters = false, onReset }) {
  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-[#101118] px-6 py-14 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">No projects found</h3>
        {hasActiveFilters ? (
          <>
            <p className="text-sm text-slate-400">No results match your current filters.</p>
            <button
              type="button"
              onClick={onReset}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition"
            >
              Reset filters
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">Be the first to share your work with the community.</p>
            <Link
              to="/projects/new"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition"
            >
              Create a project
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    // Grid of projects
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
