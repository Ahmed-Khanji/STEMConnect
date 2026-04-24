import { useMemo, useState, useCallback } from "react";
import { Bell, GitBranch, Grid2x2, Home, KanbanSquare, MessageSquare, Folders } from "lucide-react";
import { Link } from "react-router-dom";
import ProjectFilters from "@/components/Project/ProjectFilters";
import ProjectList from "@/components/Project/ProjectList";
import { mockProjects, projectCommitments, projectRoles, projectSortOptions } from "@/utils/mockProjects";

// match project title, summary, category, or techstack against the search query
function matchesQuery(project, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const techMatch = (project.techstack || []).some((t) => t.toLowerCase().includes(q));
  return techMatch || [project.title, project.summary, project.category].some((field) => String(field).toLowerCase().includes(q));
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

  const defaultFilters = { query: "", role: "all", commitment: "all", sortBy: "recent" };

  const hasActiveFilters =
    filters.query !== "" || filters.role !== "all" || filters.commitment !== "all";

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100">
      <div className="flex w-full gap-6 px-4 py-6 md:px-6">
        {/* Sidebar */}
        <aside className="hidden w-20 shrink-0 rounded-2xl border border-white/10 bg-[#0f1017] p-3 lg:flex lg:flex-col lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Link to="/" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-200 transition" title="Home">
              <Home className="h-5 w-5" />
            </Link>

            {/* Navigation for different project types */}
            <nav className="space-y-2">
              
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/20 text-violet-200">
                <Grid2x2 className="h-5 w-5" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
                <MessageSquare className="h-5 w-5" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
                <KanbanSquare className="h-5 w-5" />
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-white/5">
                <GitBranch className="h-5 w-5" />
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
          <header>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Project Discovery</h1>
              <p className="mt-1 text-sm text-slate-400">Explore the next generation of academic innovation.</p>
            </div>
          </header>

          {/* Filters */}
          <ProjectFilters
            query={filters.query}
            role={filters.role}
            commitment={filters.commitment}
            sortBy={filters.sortBy}
            roleOptions={projectRoles}
            commitmentOptions={projectCommitments}
            sortOptions={projectSortOptions}
            onChange={updateFilter}
          />

          {/* Project List */}
          <ProjectList projects={filteredProjects} hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
        </main>
      </div>
    </div>
  );
}
