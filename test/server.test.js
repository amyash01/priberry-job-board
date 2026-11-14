
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { createApp } from "../server.js";

// Location of the saved jobs JSON file.
const savedFile = new URL("../saved.json", import.meta.url);

test("saved jobs API works correctly", async (t) => {
  // Back up existing saved jobs.
  const originalData = await readFile(savedFile, "utf8");

  const server = createApp();
  let listening = false;

  try {
    // Start with an empty saved jobs list.
    await writeFile(savedFile, "[]", "utf8");

    // Start the server on an available port.
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    listening = true;

    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    await t.test("GET returns an empty list initially", async () => {
      const response = await fetch(`${baseUrl}/api/saved`);
      const data = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(data, []);
    });

    await t.test("POST saves a valid job", async () => {
      const response = await fetch(`${baseUrl}/api/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: "j2" })
      });

      const data = await response.json();

      assert.equal(response.status, 201);
      assert.equal(data.job.id, "j2");
    });

    await t.test("GET returns the saved job", async () => {
      const response = await fetch(`${baseUrl}/api/saved`);
      const data = await response.json();

      assert.equal(response.status, 200);
      assert.equal(data.length, 1);
      assert.equal(data[0].id, "j2");
    });

    await t.test("POST prevents duplicate jobs", async () => {
      const response = await fetch(`${baseUrl}/api/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: "j2" })
      });

      const data = await response.json();

      assert.equal(response.status, 200);
      assert.equal(data.message, "Job already saved");

      const savedResponse = await fetch(`${baseUrl}/api/saved`);
      const savedJobs = await savedResponse.json();

      assert.equal(savedJobs.length, 1);
    });

    await t.test("POST rejects an unknown job ID", async () => {
      const response = await fetch(`${baseUrl}/api/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: "unknown-job" })
      });

      const data = await response.json();

      assert.equal(response.status, 404);
      assert.equal(data.error, "Job not found");
    });

    await t.test("POST rejects invalid JSON", async () => {
      const response = await fetch(`${baseUrl}/api/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid json"
      });

      const data = await response.json();

      assert.equal(response.status, 400);
      assert.equal(data.error, "Invalid JSON body");
    });

    await t.test("POST rejects a missing job ID", async () => {
      const response = await fetch(`${baseUrl}/api/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const data = await response.json();

      assert.equal(response.status, 400);
      assert.equal(data.error, "A valid jobId is required");
    });

    await t.test("POST rejects an oversized request body", async () => {
      const response = await fetch(`${baseUrl}/api/saved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(100_001)
      });

      const data = await response.json();

      assert.equal(response.status, 400);
      assert.equal(data.error, "Request body too large");
    });

    await t.test("DELETE rejects a malformed encoded job ID", async () => {
      const response = await fetch(
        `${baseUrl}/api/saved/%E0%A4%A`,
        { method: "DELETE" }
      );

      const data = await response.json();

      assert.equal(response.status, 400);
      assert.equal(data.error, "Invalid job ID");
    });

    await t.test("DELETE removes a saved job", async () => {
      const response = await fetch(`${baseUrl}/api/saved/j2`, {
        method: "DELETE"
      });

      const data = await response.json();

      assert.equal(response.status, 200);
      assert.equal(data.jobId, "j2");
    });

    await t.test("GET confirms the job was removed", async () => {
      const response = await fetch(`${baseUrl}/api/saved`);
      const data = await response.json();

      assert.deepEqual(data, []);
    });

    await t.test("DELETE rejects a job that is not saved", async () => {
      const response = await fetch(`${baseUrl}/api/saved/j2`, {
        method: "DELETE"
      });

      assert.equal(response.status, 404);
    });

    await t.test("Unknown routes return 404", async () => {
      const response = await fetch(`${baseUrl}/api/unknown`);

      assert.equal(response.status, 404);
    });

  } finally {
    // Close the test server and restore saved jobs.
    if (listening) {
      await new Promise((resolve) => server.close(resolve));
    }

    await writeFile(savedFile, originalData, "utf8");
  }
});
