import ProjectCard from "./ProjectCard";

export default function ProjectList({ projects }) {
  if (!projects.length) {
    return (
      // Empty state
      <div className="rounded-2xl border border-dashed border-white/20 bg-[#101118] px-6 py-14 text-center">
        <h3 className="text-lg font-semibold text-white">No projects found</h3>
        <p className="mt-2 text-sm text-slate-400">Try a different keyword or filter combination.</p>
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
