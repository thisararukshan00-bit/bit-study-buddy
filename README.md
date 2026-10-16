# BIT Study Buddy

A free, beginner-friendly study-planning web app, built as a solo student
submission for the **Build, Ship, Shape: Amazon Developer Hackathon**
(Alexa+ simulated-experience track).

## What this is

BIT Study Buddy lets a student describe their available study time,
subjects, and deadlines in a chat-style box, and get back a simple weekly
study plan they can edit, complete, and delete tasks from.

**This is a simulated assistant, not a real Alexa+ or Amazon integration.**
There is no AI model, no AWS, no server, and no network calls of any kind.
All "understanding" and "planning" is done by plain, readable JavaScript
rules in `app.js` (see the `parseRequest` and `buildPlan` functions), and
all data is stored only in your own browser's `localStorage`. Closing the
tab or clearing site data removes everything; nothing is ever sent to any
server.

## How it works (honestly)

1. **Understand** — `parseRequest()` looks for a number of hours, a list
   of subjects, and simple keywords like "exam" or "urgent" in the text you
   type. This is basic text pattern-matching, not natural-language AI.
2. **Plan** — `buildPlan()` divides your stated hours evenly across your
   subjects and spreads them Monday–Saturday, with deadline/urgency hints
   bumping a subject to "high" priority.
3. **Result** — the generated sessions are added to the weekly plan list,
   and the chat log shows the three steps above so the "workflow" is
   visible rather than hidden behind a black box.

The quality of the plan depends entirely on these simple rules — it will
not understand complex or ambiguous requests the way a real AI assistant
might.

## Running it locally

No build step, no installation, no account needed.

1. Download/copy the project folder (`index.html`, `styles.css`, `app.js`).
2. Double-click `index.html` to open it in any modern browser
   (Chrome, Firefox, Edge, Safari) — or right-click → "Open with" your
   browser.
3. That's it. The app works fully offline.

Optional, if your browser restricts file:// access to localStorage: serve
the folder locally instead, e.g. from inside the project folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000` in your browser.

## Features

- Welcome screen explaining the simulated nature of the assistant.
- Chat-style box to describe study time, subjects, and deadlines, plus
  three clickable example prompts for an instant demo.
- Visible "understand → plan → result" steps for each generated plan.
- Weekly plan list grouped and sorted by day, showing subject, duration,
  and priority.
- Add, edit, mark complete, and delete study sessions.
- A manual "Add a study session" form for direct control.
- Reset/clear-demo-data control (with a confirmation prompt).
- Empty, success, and error states throughout.
- Responsive layout (mobile and desktop) and accessible markup: labeled
  form fields, visible focus outlines, `aria-live` regions, and a
  skip-to-content link.

## Limitations

- The language understanding is rule-based keyword matching, not a real
  AI/NLP model — unusual phrasing may be parsed incorrectly.
- Data is local to one browser on one device; there is no account, sync,
  or cloud backup.
- This was built and tested in recent desktop Chrome/Firefox; other
  browsers should work but have not been exhaustively tested.
- No automated test suite is included; see `SUBMISSION_NOTES.md` for the
  manual test checklist that was run instead.
- **Hackathon rule-fit is not guaranteed.** See `SUBMISSION_NOTES.md` for
  an explicit flag on this and what to confirm with organizers before
  submitting.

## License

MIT — see `LICENSE`.
