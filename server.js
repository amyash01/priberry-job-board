
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { loadJobs, searchJobs, findJob } from "./lib/jobs.js";
import {
  loadSavedIds,
  addSavedId,
  removeSavedId
} from "./lib/saved.js";

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify(body));
}

async function readRequestBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;

    if (body.length > 100_000) {
      throw new Error("Request body too large");
    }
  }

  return JSON.parse(body);
}

export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      // GET: Retrieve available jobs.
      if (req.method === "GET" && url.pathname === "/api/jobs") {
        const jobs = await loadJobs();
        const results = searchJobs(
          jobs,
          url.searchParams.get("q")
        );

        return sendJson(res, 200, results);
      }

      // GET: Retrieve saved jobs.
      if (req.method === "GET" && url.pathname === "/api/saved") {
        const jobs = await loadJobs();
        const savedIds = await loadSavedIds();

        const savedJobs = savedIds
          .map((id) => findJob(jobs, id))
          .filter(Boolean);

        return sendJson(res, 200, savedJobs);
      }

      // POST: Save a job.
      if (req.method === "POST" && url.pathname === "/api/saved") {
        let data;

        try {
          data = await readRequestBody(req);
        } catch (error) {
          return sendJson(res, 400, {
            error: error.message === "Request body too large"
              ? "Request body too large"
              : "Invalid JSON body"
          });
        }

        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data) ||
          typeof data.jobId !== "string" ||
          !data.jobId.trim()
        ) {
          return sendJson(res, 400, {
            error: "A valid jobId is required"
          });
        }

        const jobId = data.jobId.trim();
        const jobs = await loadJobs();
        const job = findJob(jobs, jobId);

        if (!job) {
          return sendJson(res, 404, {
            error: "Job not found"
          });
        }

        const existingIds = await loadSavedIds();
        const alreadySaved = existingIds.includes(jobId);

        await addSavedId(jobId);

        return sendJson(res, alreadySaved ? 200 : 201, {
          message: alreadySaved
            ? "Job already saved"
            : "Job saved successfully",
          job
        });
      }

      // DELETE: Remove a saved job.
      if (
        req.method === "DELETE" &&
        url.pathname.startsWith("/api/saved/")
      ) {
        let jobId;

        try {
          jobId = decodeURIComponent(
            url.pathname.slice("/api/saved/".length)
          );
        } catch {
          return sendJson(res, 400, {
            error: "Invalid job ID"
          });
        }

        if (!jobId.trim() || jobId.includes("/")) {
          return sendJson(res, 400, {
            error: "Invalid job ID"
          });
        }

        const jobs = await loadJobs();
        const job = findJob(jobs, jobId);

        if (!job) {
          return sendJson(res, 404, {
            error: "Job not found"
          });
        }

        const savedIds = await loadSavedIds();

        if (!savedIds.includes(jobId)) {
          return sendJson(res, 404, {
            error: "Job is not saved"
          });
        }

        await removeSavedId(jobId);

        return sendJson(res, 200, {
          message: "Job removed successfully",
          jobId
        });
      }

      // GET: Serve the webpage and frontend JavaScript.
      if (
        req.method === "GET" &&
        (url.pathname === "/" || url.pathname === "/app.js")
      ) {
        const file = url.pathname === "/" ? "index.html" : "app.js";

        const contentType = file.endsWith(".html")
          ? "text/html; charset=utf-8"
          : "text/javascript; charset=utf-8";

        const body = await readFile(
          new URL(`./public/${file}`, import.meta.url)
        );

        res.writeHead(200, {
          "content-type": contentType
        });

        return res.end(body);
      }

      // Handle unknown routes.
      return sendJson(res, 404, {
        error: "Not found"
      });

    } catch (error) {
      console.error(error);

      if (!res.headersSent) {
        return sendJson(res, 500, {
          error: "Something went wrong"
        });
      }

      res.destroy();
    }
  });
}

// Start the server when running npm start.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  createApp().listen(PORT, () => {
    console.log(`Job board on http://localhost:${PORT}`);
  });
}
