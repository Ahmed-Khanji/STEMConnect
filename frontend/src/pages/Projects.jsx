import { useMemo, useState } from "react";
import { Bell, Grid2x2, MessageSquare, Rocket, Settings, GraduationCap } from "lucide-react";
import ProjectFilters from "@/components/Project/ProjectFilters";
import ProjectList from "@/components/Project/ProjectList";
import { mockProjects, projectCommitments, projectRoles, projectSortOptions } from "@/lib/mockProjects";

// match project title, description or category against the search query
function matchesQuery(project, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [project.title, project.description, project.category].some((field) => String(field).toLowerCase().includes(q));
}

// sort by most recent update or by total engagement (views + likes)
function sortProjects(projects, sortBy) {
  if (sortBy === "popular") {
    return [...projects].sort((a, b) => {
      const aScore = (a.engagement?.views || 0) + (a.engagement?.likes || 0);
      const bScore = (b.engagement?.views || 0) + (b.engagement?.likes || 0);
      return bScore - aScore;
    });
  }
  return [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export default function Projects() {
  const [filters, setFilters] = useState({
    query: "",
    role: "all",
    commitment: "all",
    sortBy: "recent",
  });

  const filteredProjects = useMemo(() => {
    const base = mockProjects.filter((project) => {
      const roleMatch = filters.role === "all" || (project.rolesNeeded || []).includes(filters.role);
      const commitmentMatch = filters.commitment === "all" || project.commitment === filters.commitment;
      return roleMatch && commitmentMatch && matchesQuery(project, filters.query);
    });
    return sortProjects(base, filters.sortBy);
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-6">
        {/* Sidebar */}
        <aside className="hidden w-20 shrink-0 rounded-2xl border border-white/10 bg-[#0f1017] p-3 lg:flex lg:flex-col lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/20 text-violet-200">
              <Grid2x2 className="h-5 w-5" />
            </div>

            {/* Navigation for different project types */}
            <nav className="space-y-2">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/20 text-violet-200">
                <Rocket className="h-5 w-5" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
                <GraduationCap className="h-5 w-5" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
                <Settings className="h-5 w-5" />
              </button>
            </nav>
          </div>

          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
            <Bell className="h-5 w-5" />
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-5">
          {/* Header */}
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Project Discovery</h1>
              <p className="mt-1 text-sm text-slate-400">Explore the next generation of academic innovation.</p>
            </div>
            {/* Sort by */}
            <label className="text-sm text-slate-400">
              <span className="mr-2">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(event) => updateFilter("sortBy", event.target.value)}
                className="h-10 rounded-lg border border-white/10 bg-[#12131a] px-3 text-sm text-slate-200 outline-none transition focus:border-violet-400/70"
              >
                {projectSortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </header>

          {/* Filters */}
          <ProjectFilters
            query={filters.query}
            role={filters.role}
            commitment={filters.commitment}
            roleOptions={projectRoles}
            commitmentOptions={projectCommitments}
            onChange={updateFilter}
          />

          {/* Project List */}
          <ProjectList projects={filteredProjects} />
        </main>
      </div>
    </div>
  );
}
