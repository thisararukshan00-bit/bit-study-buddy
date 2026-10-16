# Submission Notes — BIT Study Buddy

## Project description (English)

BIT Study Buddy is a free, solo-built web app for the "Build, Ship, Shape:
Amazon Developer Hackathon" (Alexa+ simulated-experience track). A
university student describes their available study time, subjects, and
deadlines in a chat-style box; the app turns that into a weekly study plan
with editable, completable, deletable sessions. All "assistant" behavior
is simulated using transparent, local JavaScript rules — there is no real
AI model, no AWS usage, and no connection of any kind to Alexa+ or any
Amazon device or service. The app runs entirely offline in the browser,
with data stored only in `localStorage`.

## Demo video outline (target: under 3 minutes)

1. **0:00–0:20 — Intro.** Show the welcome screen. State clearly: "This is
   a simulated study-planning assistant, built for the Alexa+ simulated-
   experience track. It does not connect to Alexa+ or any Amazon service."
2. **0:20–0:55 — Chat input.** Tap one of the three example prompts (or
   type a new one). Point out the "understand → plan → result" steps that
   appear in the chat log.
3. **0:55–1:40 — Weekly plan.** Scroll through the generated plan. Mark one
   session complete, edit one (change subject/duration), delete one.
4. **1:40–2:15 — Manual add.** Use the "Add a study session" form to add a
   session directly; show the success message.
5. **2:15–2:40 — Reset + responsiveness.** Click "Reset demo data" and
   confirm the empty state appears. Resize the window (or switch to a
   phone-sized view) to show the responsive layout.
6. **2:40–3:00 — Close.** Repeat the honesty statement: simulated assistant,
   free and open-source, no AWS/paid services used, source available on
   GitHub.

## Product feedback draft (for the Devpost "feedback" field)

- **Tools used:** Plain HTML, CSS, and JavaScript; no frameworks, build
  tools, or paid services. (Optionally: "drafted with AI pair-programming
  assistance" — fill in truthfully based on what was actually used.)
- **What worked well:** Building a fully offline, zero-cost prototype was
  straightforward with plain web technologies; no account setup or SDK
  installation was needed to get something working end-to-end.
- **What needs improvement:** The official hackathon rules for what counts
  as an acceptable Alexa+ "simulated experience" were not fully clear for
  a simple web-app submission (see the open question below) — clearer,
  beginner-oriented guidance here would help first-time participants.
- **Onboarding experience:** [Fill in honestly — e.g., "Devpost
  registration and rule-reading took about X minutes; the biggest point of
  confusion was whether a plain web app qualifies for the Alexa+ track."]
- **Would the student use these tools again:** [Fill in honestly based on
  your own experience.]

## Pre-submission checklist (please verify personally)

- [ ] Open `index.html` yourself and click through every feature at least
      once (see the manual test checklist in `README.md` / below).
- [ ] Re-read the **current, official** hackathon rules and the Alexa+
      track requirements on Devpost — rules can change, and this project
      was built from a summary of rules current as of mid-October 2026.
- [ ] Confirm on the Devpost discussion/Q&A page whether a plain simulated
      web app (with no Agent Skill or MCP server) satisfies the Alexa+
      track for this specific hackathon round.
- [ ] Record the demo video (under 3 minutes), in English or with English
      subtitles, and upload it publicly to YouTube or Vimeo.
- [ ] Make the GitHub repository public, and double check it includes
      working run instructions and this LICENSE file.
- [ ] Fill in the Devpost submission form: project description, GitHub
      link, video link, and the product-feedback/tool-survey field —
      required for eligibility.
- [ ] Optionally complete the "friction log" — it's optional but can add
      up to 10% to the judging score.
- [ ] Do **not** rely on receiving AWS credits — the $150 AWS credit
      request window closed October 7; build and test only with free,
      local tools.
- [ ] Submit before the deadline with margin to spare (aim for October 23,
      not the last minute), since the official cutoff is 12:00 PM PDT on
      October 23, 2026 (around 00:30 on October 24 in Sri Lanka time).

## ⚠️ Open question — confirm with organizers before submitting

The Alexa+ track's official project description mentions building an Agent
Skill, an MCP server, **or** a simulated web app. This project takes the
simulated-web-app path and is explicit on-screen and in the README that it
does *not* connect to Alexa+/Amazon. **Whether this satisfies the current,
official judging criteria for the Alexa+ track has not been independently
confirmed** — hackathon rules can be updated, and no hackathon approval is
implied by this project. Please re-check the live official rules and ask
on the Devpost Q&A/discussion page before final submission, and be ready to
switch tracks (e.g., Ring simulator) if the organizers clarify that a plain
web app does not qualify.

## Manual test checklist (run before recording the demo)

1. Open `index.html` directly in a browser — page loads with no console
   errors, welcome/disclosure text is visible.
2. Click each of the 3 example chips — each produces a chat bubble pair
   (user message + assistant steps) and adds sessions to the plan.
3. Type a custom request (e.g., "I have 3 hours for Physics and Chemistry,
   Physics test on Monday") and submit — plan updates correctly, Physics is
   marked high priority.
4. Submit the chat form with empty input — nothing breaks, no stray
   session is added.
5. In the weekly plan: click ✓ to complete a session (shows strikethrough),
   click again to un-complete.
6. Click ✎ on a session, change the subject and duration via the prompts —
   list updates.
7. Click ✕ on a session — it's removed immediately.
8. Use the "Add a study session" form with a blank subject — see the error
   status message; fix it and submit — see the success message and the new
   session appear in the list.
9. Click "Reset demo data", confirm the dialog — plan and chat log clear,
   empty state reappears.
10. Reload the page after adding a few sessions (without resetting) — the
    plan persists (loaded from `localStorage`).
11. Resize the browser window to a narrow/mobile width — layout stays
    usable, no horizontal scrolling.
12. Tab through the page with the keyboard only — all buttons/inputs are
    reachable and show a visible focus outline.
