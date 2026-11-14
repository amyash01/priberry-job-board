
import test from "node:test";
import assert from "node:assert/strict";

import {
  findJob,
  loadJobs,
  searchJobs
} from "../lib/jobs.js";

// Test 1: Load the jobs file.
test("loads the jobs file", async () => {
  const jobs = await loadJobs();

  assert.ok(jobs.length >= 8);
  assert.ok(jobs.every((job) => job.id && job.title));
});

// Test 2: Search jobs by title, company and location.
test("search matches title, company and location, ignoring case", async () => {
  const jobs = await loadJobs();

  assert.equal(searchJobs(jobs, "intern").length, jobs.length);

  assert.deepEqual(
    searchJobs(jobs, "REMOTE").map((job) => job.id),
    ["j1", "j3", "j6", "j8"]
  );

  assert.deepEqual(
    searchJobs(jobs, "kosha").map((job) => job.id),
    ["j4"]
  );

  assert.equal(searchJobs(jobs, "").length, jobs.length);
});

// Test 3: Return no results when nothing matches.
test("returns an empty list when no jobs match", async () => {
  const jobs = await loadJobs();

  assert.deepEqual(searchJobs(jobs, "nonexistent-company"), []);
});

// Test 4: Find an existing job and handle unknown IDs.
test("findJob returns the correct job or null", async () => {
  const jobs = await loadJobs();

  assert.equal(findJob(jobs, "j2").company, "Kite Learning");
  assert.equal(findJob(jobs, "nope"), null);
});
