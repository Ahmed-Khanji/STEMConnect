import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProjectHeader from "@/components/Project/ProjectHeader";
import { getMockProjectById } from "@/utils/mockProjects";

export default function ProjectShowcase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = getMockProjectById(id);

  // keep all "back to discovery" actions consistent
  function handleBackToDiscovery(event) {
    if (event) event.preventDefault();
    navigate("/projects");
  }

  // let users close showcase quickly with Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      handleBackToDiscovery();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // not-found state
  if (!project) {
    return (
      <div className="min-h-screen bg-[#090a10] text-slate-100 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-white">Project not found</h1>
        <p className="text-sm text-slate-400">This project may have been removed or the link is invalid.</p>
        <Link
          to="/projects"
          onClick={handleBackToDiscovery}
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discovery
        </Link>
      </div>
    );
  }

  function handleJoin() {
    // placeholder — join flow will be wired in next step
  }

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 space-y-6">
        {/* Back link */}
        <Link
          to="/projects"
          onClick={handleBackToDiscovery}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discovery
        </Link>

        {/* Header with cover + join CTA */}
        <ProjectHeader project={project} onJoin={handleJoin} />

        {/* About — full width, prominent */}
        <section className="rounded-2xl border border-white/10 bg-[#0f1017] p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">About this project</h2>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-4">
            {String(project.description || "")
              .split(/\n\n+/)
              .map((para, i) => (
                <p key={i} className="text-base leading-8 text-slate-300">{para.trim()}</p>
              ))}
          </div>
        </section>

        {/* Tech stack + Roles */}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#0f1017] p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {(project.techstack || []).map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0f1017] p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Roles Needed</h2>
            <div className="flex flex-wrap gap-2">
              {(project.rolesNeeded || []).map((role) => (
                <span
                  key={role}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                >
                  {role}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
