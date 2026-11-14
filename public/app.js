
const jobsList = document.getElementById("jobs");
const search = document.getElementById("search");
const savedJobsList = document.getElementById("saved-jobs");
const savedMessage = document.getElementById("saved-message");

// Keep track of saved jobs and ongoing actions.
let savedJobIds = new Set();
const pendingActions = new Set();

// Send an API request and handle errors.
async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response");
  }

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

// Create a job list item.
function createJobItem(job, isSaved = false) {
  const li = document.createElement("li");

  const details = document.createElement("div");
  details.className = "job-details";

  details.textContent =
    `${job.title} at ${job.company}, ${job.location}. ` +
    `Rs ${job.stipend.toLocaleString("en-IN")} a month.`;

  const button = document.createElement("button");

  if (isSaved) {
    button.textContent = "Remove";
    button.className = "remove-button";
    button.disabled = pendingActions.has(job.id);

    button.addEventListener("click", () => removeJob(job.id));
  } else {
    button.textContent = savedJobIds.has(job.id) ? "Saved" : "Save";
    button.className = "save-button";

    button.disabled =
      savedJobIds.has(job.id) || pendingActions.has(job.id);

    button.addEventListener("click", () => saveJob(job.id));
  }

  li.append(details, button);

  return li;
}

// Display available jobs.
async function showJobs(query = "") {
  try {
    const jobs = await apiRequest(
      `/api/jobs?q=${encodeURIComponent(query)}`
    );

    jobsList.replaceChildren();

    if (jobs.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No jobs found.";
      jobsList.append(li);
      return;
    }

    for (const job of jobs) {
      jobsList.append(createJobItem(job));
    }
  } catch (error) {
    jobsList.replaceChildren();

    const li = document.createElement("li");
    li.textContent = `Could not load jobs: ${error.message}`;

    jobsList.append(li);
  }
}

// Load and display saved jobs.
async function showSavedJobs() {
  try {
    const savedJobs = await apiRequest("/api/saved");

    savedJobIds = new Set(savedJobs.map((job) => job.id));

    savedJobsList.replaceChildren();

    if (savedJobs.length === 0) {
      savedMessage.textContent = "No saved jobs yet.";
      return;
    }

    savedMessage.textContent =
      `${savedJobs.length} saved job(s).`;

    for (const job of savedJobs) {
      savedJobsList.append(createJobItem(job, true));
    }
  } catch (error) {
    savedJobsList.replaceChildren();
    savedMessage.textContent =
      `Could not load saved jobs: ${error.message}`;
  }
}

// Save a job.
async function saveJob(jobId) {
  if (pendingActions.has(jobId) || savedJobIds.has(jobId)) {
    return;
  }

  pendingActions.add(jobId);

  await showJobs(search.value);

  try {
    await apiRequest("/api/saved", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ jobId })
    });

    savedMessage.textContent = "Job saved successfully!";
  } catch (error) {
    savedMessage.textContent = error.message;
  } finally {
    pendingActions.delete(jobId);
    await showSavedJobs();
    await showJobs(search.value);
  }
}

// Remove a saved job.
async function removeJob(jobId) {
  if (pendingActions.has(jobId)) {
    return;
  }

  pendingActions.add(jobId);

  try {
    await apiRequest(`/api/saved/${encodeURIComponent(jobId)}`, {
      method: "DELETE"
    });

    savedMessage.textContent = "Job removed successfully!";
  } catch (error) {
    savedMessage.textContent = error.message;
  } finally {
    pendingActions.delete(jobId);
    await showSavedJobs();
    await showJobs(search.value);
  }
}

// Search jobs when the user types.
search.addEventListener("input", () => {
  showJobs(search.value);
});

// Load jobs and saved jobs when the page opens.
async function initialize() {
  await showSavedJobs();
  await showJobs();
}

initialize();
