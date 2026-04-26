// shared semester helpers keep labels/progress consistent across the app
export function getCurrentSemester(dateInput = new Date()) {
  const now = new Date(dateInput);
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 3) return `Winter ${year}`;
  if (month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

export function getSemesterProgress(dateInput = new Date()) {
  const now = new Date(dateInput);
  const month = now.getMonth();
  const year = now.getFullYear();

  let name = "";
  let start = new Date(year, 0, 1); // January 1st of the year (Winter semester)
  let end = new Date(year, 4, 1); // May 1st of the year (Winter semester)

  if (month <= 3) { // Winter semester
    name = `Winter ${year}`;
    start = new Date(year, 0, 1);
    end = new Date(year, 4, 1);
  } else if (month <= 7) { // Summer semester
    name = `Summer ${year}`;
    start = new Date(year, 4, 1);
    end = new Date(year, 8, 1);
  } else { // Fall semester
    name = `Fall ${year}`;
    start = new Date(year, 8, 1);
    end = new Date(year + 1, 0, 1);
  }

  const totalMs = end.getTime() - start.getTime(); // total milliseconds between start and end
  const elapsedMs = Math.max(0, now.getTime() - start.getTime()); // elapsed milliseconds since start
  const percent = Math.min(100, Math.round((elapsedMs / totalMs) * 100)); // percentage of the semester that has passed

  return { name, percent }; // { name: "Winter 2026", percent: 50 }
}
