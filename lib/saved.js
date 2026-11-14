
import { readFile, writeFile } from "node:fs/promises";

// Location of the saved jobs JSON file.
const SAVED_FILE = new URL("../saved.json", import.meta.url);

// Read all saved job IDs.
export async function loadSavedIds(path = SAVED_FILE) {
  const raw = await readFile(path, "utf8");
  const savedIds = JSON.parse(raw);

  // Make sure the file contains an array of string IDs.
  if (
    !Array.isArray(savedIds) ||
    !savedIds.every((id) => typeof id === "string")
  ) {
    throw new Error("Saved jobs data must be an array of job IDs");
  }

  return savedIds;
}

// Save a job ID without creating duplicates.
export async function addSavedId(jobId, path = SAVED_FILE) {
  const savedIds = await loadSavedIds(path);

  if (!savedIds.includes(jobId)) {
    savedIds.push(jobId);

    await writeFile(
      path,
      JSON.stringify(savedIds, null, 2) + "\n",
      "utf8"
    );
  }

  return savedIds;
}

// Remove a saved job ID.
export async function removeSavedId(jobId, path = SAVED_FILE) {
  const savedIds = await loadSavedIds(path);

  const updatedIds = savedIds.filter((id) => id !== jobId);

  if (updatedIds.length !== savedIds.length) {
    await writeFile(
      path,
      JSON.stringify(updatedIds, null, 2) + "\n",
      "utf8"
    );
  }

  return updatedIds;
}
