
import { readFile } from "node:fs/promises";

// Load all jobs from the JSON file.
export async function loadJobs(
  path = new URL("../jobs.json", import.meta.url)
) {
  const raw = await readFile(path, "utf8");
  const jobs = JSON.parse(raw);

  if (!Array.isArray(jobs)) {
    throw new Error("Jobs data must be an array");
  }

  return jobs;
}

// Find jobs matching the title, company or location.
export function searchJobs(jobs, query) {
  const searchTerm = String(query ?? "").trim().toLowerCase();

  if (!searchTerm) {
    return jobs;
  }

  return jobs.filter((job) => {
    const searchableFields = [
      job.title,
      job.company,
      job.location
    ];

    return searchableFields.some((field) =>
      String(field ?? "").toLowerCase().includes(searchTerm)
    );
  });
}

// Find a job by its ID.
export function findJob(jobs, id) {
  return jobs.find((job) => job.id === id) ?? null;
}
