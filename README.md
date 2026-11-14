# Job Board – Saved Jobs Feature

A small job board built as part of a software development work sample. Users can browse and search internship listings, save jobs, view saved jobs, and remove them.

All jobs and company names are fictional.

## Features

- Browse available job listings.
- Search by job title, company, or location.
- Save and remove jobs.
- View saved jobs on the same page.
- Prevent duplicate saved jobs.
- Persist saved jobs using a JSON file.
- Handle invalid requests and unknown job IDs.

## Technologies

- JavaScript (ES Modules)
- Node.js built-in HTTP server
- HTML and CSS
- JSON file storage
- Node.js built-in test runner

No external packages are required.

## Requirements

- Node.js 20 or newer.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/amyash01/priberry-job-board.git
cd priberry-job-board
```

Start the application:

```bash
npm start
```

Open http://localhost:3000 in your browser.

## Running Tests

Run the automated tests:

```bash
npm test
```

The tests cover job listing, searching, saved-job storage, duplicate prevention, API operations, and error handling.

## Saved Jobs API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/saved` | Retrieve saved jobs |
| POST | `/api/saved` | Save a job |
| DELETE | `/api/saved/:jobId` | Remove a saved job |

Example POST request:

```json
{
  "jobId": "j2"
}
```

Here, `j2` is the ID of an existing job in `jobs.json`. The API uses this ID to identify which job to save.

Saved job IDs are stored in `saved.json`, allowing them to persist after application restarts and browser refreshes.

## Technical Decision

I chose a local JSON file (`saved.json`) to store saved job IDs instead of introducing a database.

This keeps the application lightweight, avoids external dependencies, and is sufficient for the requirements of this work sample.

## Future Improvements

- Add user-specific saved job lists.
- Introduce a database for larger-scale storage.
- Further improve frontend accessibility and user feedback.

## AI Assistance Disclosure

AI assistance was used to help draft parts of the implementation, tests, and documentation. I reviewed the code, worked through the implementation, ran automated tests, and manually tested the save, remove, search, and persistence functionality.
