
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  rm
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  loadSavedIds,
  addSavedId,
  removeSavedId
} from "../lib/saved.js";

// Create a temporary JSON file for each test.
async function createTestFile(initialData = []) {
  const directory = await mkdtemp(
    join(tmpdir(), "saved-jobs-")
  );

  const file = join(directory, "saved.json");

  await writeFile(
    file,
    JSON.stringify(initialData),
    "utf8"
  );

  return {
    file,
    cleanup: () =>
      rm(directory, { recursive: true, force: true })
  };
}

// Test 1: Load saved job IDs.
test("loads saved job IDs", async () => {
  const temp = await createTestFile(["j2", "j6"]);

  try {
    const result = await loadSavedIds(temp.file);

    assert.deepEqual(result, ["j2", "j6"]);
  } finally {
    await temp.cleanup();
  }
});

// Test 2: Add a new saved job.
test("adds a new saved job ID", async () => {
  const temp = await createTestFile([]);

  try {
    const result = await addSavedId("j2", temp.file);

    assert.deepEqual(result, ["j2"]);
  } finally {
    await temp.cleanup();
  }
});

// Test 3: Prevent duplicate saved jobs.
test("does not save duplicate job IDs", async () => {
  const temp = await createTestFile(["j2"]);

  try {
    const result = await addSavedId("j2", temp.file);

    assert.deepEqual(result, ["j2"]);
  } finally {
    await temp.cleanup();
  }
});

// Test 4: Remove a saved job.
test("removes a saved job ID", async () => {
  const temp = await createTestFile(["j2", "j6"]);

  try {
    const result = await removeSavedId("j2", temp.file);

    assert.deepEqual(result, ["j6"]);
  } finally {
    await temp.cleanup();
  }
});

// Test 5: Saved jobs persist in the JSON file.
test("persists saved jobs after writing", async () => {
  const temp = await createTestFile([]);

  try {
    await addSavedId("j6", temp.file);

    const raw = await readFile(temp.file, "utf8");
    const result = JSON.parse(raw);

    assert.deepEqual(result, ["j6"]);
  } finally {
    await temp.cleanup();
  }
});

// Test 6: Reject invalid saved-job data.
test("rejects saved data that is not an array of strings", async () => {
  const temp = await createTestFile({ jobId: "j2" });

  try {
    await assert.rejects(
      loadSavedIds(temp.file),
      {
        message: "Saved jobs data must be an array of job IDs"
      }
    );
  } finally {
    await temp.cleanup();
  }
});
