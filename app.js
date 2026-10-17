/**
 * BIT Study Buddy — app.js
 *
 * IMPORTANT (read this before you edit):
 * This app is a SIMULATED study-planning assistant. There is no real AI model,
 * no Alexa+/Amazon connection, and no server. Every "understand → plan → result"
 * step below is a transparent, local JavaScript rule — written out in plain code
 * so a beginner can read and change it. Everything is stored only in this
 * browser's localStorage; nothing is ever sent anywhere.
 */

(function () {
  "use strict";

  // ---------- Storage ----------
  const STORAGE_KEY = "bitStudyBuddy.tasks.v1";
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DAY_LABELS = { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" };

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("Could not read saved plan, starting fresh.", err);
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn("Could not save plan (browser storage may be full or disabled).", err);
    }
  }

  let tasks = loadTasks();

  // ---------- DOM ----------
  const chatLog = document.getElementById("chatLog");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const planList = document.getElementById("planList");
  const planEmptyState = document.getElementById("planEmptyState");
  const resetBtn = document.getElementById("resetBtn");
  const taskForm = document.getElementById("taskForm");
  const formStatus = document.getElementById("formStatus");
  const statSessions = document.getElementById("statSessions");
  const statMinutes = document.getElementById("statMinutes");
  const statComplete = document.getElementById("statComplete");

  const EXAMPLES = {
    1: "I have 6 hours this week. Subjects: Math, Web Programming.",
    2: "I have 10 hours this week for Math, Web Programming, and Technical Writing. Math exam is on Friday, high priority.",
    3: "Light week, only 2 hours. One subject: System Design Paradigms."
  };

  // ---------- 1. UNDERSTAND: turn free text into structured data ----------
  function parseRequest(text) {
    const lower = text.toLowerCase();

    // total hours: look for "N hour(s)" or "N hrs"
    let totalHours = 4; // sensible default if nothing is found
    const hourMatch = lower.match(/(\d+(\.\d+)?)\s*(hours|hour|hrs|hr)/);
    if (hourMatch) totalHours = parseFloat(hourMatch[1]);

    // priority keywords
    const highPriorityHint = /(high priority|urgent|exam|test|deadline|important)/.test(lower);

    // subjects: text after "subjects:" / "subject:" up to a period, OR
    // fall back to splitting on commas/"and" if no explicit label is used.
    let subjectsText = "";
    const labelMatch = text.match(/subjects?\s*:\s*([^.]+)/i);
    if (labelMatch) {
      subjectsText = labelMatch[1];
    } else {
      // Remove the hours phrase and common filler, then keep only the first
      // clause (subject names are usually named before any sentence break
      // or before a deadline/priority word like "exam" or "priority") so
      // trailing fragments like "Math exam is on Friday" don't get parsed
      // as extra subjects.
      const cleaned = text
        .replace(/\b(i have|this week|light week|only)\b/gi, "")
        .replace(/\d+(\.\d+)?\s*(hours|hour|hrs|hr)/gi, "")
        .trim();
      subjectsText = cleaned
        .split(/[.]|\b(?:exam|test|deadline|priority|urgent)\b/i)[0]
        .replace(/^\s*for\s+/i, "");
    }

    let subjects = subjectsText
      .split(/,|\band\b/i)
      .map((s) => s.replace(/\(.*?\)/g, "").replace(/^\s*(for|on|is)\s+/i, "").trim())
      .filter((s) =>
        s.length > 1 &&
        s.length < 40 &&
        !/^(high|medium|low)?\s*priority$/i.test(s) &&
        !/^(exam|test|deadline|urgent)\b/i.test(s)
      );

    // de-duplicate (case-insensitive) while keeping the first-seen order
    const seen = new Set();
    subjects = subjects.filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (subjects.length === 0) subjects = ["General study"];
    if (subjects.length > 5) subjects = subjects.slice(0, 5); // keep the plan readable

    // Which subject, if any, is explicitly flagged urgent (e.g. "Math exam is on Friday")
    const urgentSubject = subjects.find((s) => lower.includes(s.toLowerCase()) &&
      new RegExp(s.toLowerCase() + "[^.]*(exam|test|deadline|urgent)").test(lower));

    return { totalHours, subjects, highPriorityHint, urgentSubject };
  }

  // ---------- 2. PLAN: turn structured data into a weekly schedule ----------
  function buildPlan({ totalHours, subjects, highPriorityHint, urgentSubject }) {
    const totalMinutes = Math.max(30, Math.round(totalHours * 60));
    const perSubject = Math.max(30, Math.round(totalMinutes / subjects.length / 15) * 15);

    const newTasks = [];
    let dayCursor = 0;

    subjects.forEach((subject, index) => {
      const isUrgent = urgentSubject && subject === urgentSubject;
      const priority = isUrgent ? "high" : (highPriorityHint && index === 0 ? "high" : "medium");

      // spread sessions across the week, skipping Sunday where possible
      const day = DAYS[dayCursor % 6];
      dayCursor += 1;

      newTasks.push({
        id: makeId(),
        subject,
        day,
        duration: perSubject,
        priority,
        complete: false
      });
    });

    return newTasks;
  }

  function makeId() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- 3. RESULT: show the plan and explain how we got there ----------
  function addChatMessage(role, text, steps) {
    const bubble = document.createElement("div");
    bubble.className = "msg " + (role === "user" ? "msg-user" : "msg-assistant");

    const p = document.createElement("p");
    p.style.margin = "0";
    p.textContent = text;
    bubble.appendChild(p);

    if (steps && steps.length) {
      const ol = document.createElement("ol");
      ol.className = "msg-steps";
      steps.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        ol.appendChild(li);
      });
      bubble.appendChild(ol);
    }

    chatLog.appendChild(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function handleStudyRequest(text) {
    if (!text.trim()) return;
    addChatMessage("user", text);

    const parsed = parseRequest(text);
    const generated = buildPlan(parsed);

    tasks = tasks.concat(generated);
    saveTasks(tasks);
    renderPlan();

    const steps = [
      `Understood: about ${parsed.totalHours} hour(s) across ${parsed.subjects.length} subject(s) — ${parsed.subjects.join(", ")}.`,
      `Planned: split that time into ${generated.length} study session(s), spread across the week.`,
      `Result: added ${generated.length} session(s) to your weekly plan below. You can edit, complete, or delete any of them.`
    ];
    addChatMessage(
      "assistant",
      `Here's a plan for ${parsed.subjects.join(", ")}.`,
      steps
    );
  }

  // ---------- Subject color coding ----------
  // Each subject gets a stable "highlighter" color, picked deterministically
  // from its name (a simple string hash) so the same subject always lands
  // on the same swatch without needing a color picker.
  const SWATCH_COUNT = 4;
  function swatchClassForSubject(subject) {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = (hash * 31 + subject.charCodeAt(i)) >>> 0;
    }
    return "swatch-" + (hash % SWATCH_COUNT);
  }

  // ---------- Rendering: a day-by-day weekly grid ----------
  function renderPlan() {
    planList.innerHTML = "";

    if (tasks.length === 0) {
      planEmptyState.style.display = "block";
      updateStats();
      return;
    }
    planEmptyState.style.display = "none";

    DAYS.forEach((day) => {
      const lane = document.createElement("div");
      lane.className = "day-lane";
      lane.dataset.day = day;

      const header = document.createElement("div");
      header.className = "day-lane-header";
      header.textContent = DAY_LABELS[day] || day;
      lane.appendChild(header);

      const dayTasks = tasks.filter((t) => t.day === day);

      if (dayTasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "day-lane-empty";
        empty.textContent = "—";
        lane.appendChild(empty);
      } else {
        dayTasks.forEach((task) => {
          lane.appendChild(buildPlanItem(task));
        });
      }

      planList.appendChild(lane);
    });

    updateStats();
  }

  function buildPlanItem(task) {
    const card = document.createElement("div");
    card.className = "plan-item " + swatchClassForSubject(task.subject) + (task.complete ? " is-complete" : "");
    card.dataset.id = task.id;

    card.innerHTML = `
      <span class="plan-item-subject"></span>
      <span class="plan-item-meta">
        <span>${task.duration} min</span>
        <span class="priority-dot priority-${task.priority}">${capitalize(task.priority)}</span>
      </span>
      <span class="plan-item-actions">
        <button type="button" class="icon-btn btn-complete" aria-pressed="${task.complete}" title="Mark complete" aria-label="Mark ${task.subject} complete">✓</button>
        <button type="button" class="icon-btn btn-edit" title="Edit" aria-label="Edit ${task.subject}">✎</button>
        <button type="button" class="icon-btn btn-delete" title="Delete" aria-label="Delete ${task.subject}">✕</button>
      </span>
    `;
    // set subject via textContent to avoid any HTML-injection from free text
    card.querySelector(".plan-item-subject").textContent = task.subject;

    card.querySelector(".btn-complete").addEventListener("click", () => toggleComplete(task.id));
    card.querySelector(".btn-delete").addEventListener("click", () => deleteTask(task.id));
    card.querySelector(".btn-edit").addEventListener("click", () => editTask(task.id));

    return card;
  }

  function updateStats() {
    const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completeCount = tasks.filter((t) => t.complete).length;
    statSessions.textContent = String(tasks.length);
    statMinutes.textContent = (totalMinutes / 60).toFixed(1).replace(/\.0$/, "") + "h";
    statComplete.textContent = `${completeCount}/${tasks.length}`;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function toggleComplete(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, complete: !t.complete } : t));
    saveTasks(tasks);
    renderPlan();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks(tasks);
    renderPlan();
  }

  function editTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newSubject = window.prompt("Subject:", task.subject);
    if (newSubject === null) return; // cancelled
    const newDuration = window.prompt("Duration in minutes:", task.duration);
    if (newDuration === null) return;

    const duration = parseInt(newDuration, 10);
    tasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            subject: newSubject.trim() || t.subject,
            duration: Number.isFinite(duration) && duration > 0 ? duration : t.duration
          }
        : t
    );
    saveTasks(tasks);
    renderPlan();
  }

  // ---------- Manual "add session" form ----------
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = document.getElementById("taskSubject").value.trim();
    const day = document.getElementById("taskDay").value;
    const duration = parseInt(document.getElementById("taskDuration").value, 10);
    const priority = document.getElementById("taskPriority").value;

    if (!subject) {
      showFormStatus("Please enter a subject.", true);
      return;
    }
    if (!Number.isFinite(duration) || duration < 15) {
      showFormStatus("Duration must be at least 15 minutes.", true);
      return;
    }

    tasks.push({ id: makeId(), subject, day, duration, priority, complete: false });
    saveTasks(tasks);
    renderPlan();
    taskForm.reset();
    document.getElementById("taskDuration").value = 60;
    showFormStatus(`Added "${subject}" to ${DAY_LABELS[day]}.`, false);
  });

  function showFormStatus(message, isError) {
    formStatus.textContent = message;
    formStatus.classList.toggle("is-error", !!isError);
    if (message) {
      setTimeout(() => {
        if (formStatus.textContent === message) formStatus.textContent = "";
      }, 4000);
    }
  }

  // ---------- Chat form + example chips ----------
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value;
    handleStudyRequest(text);
    chatInput.value = "";
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.example;
      const text = EXAMPLES[key];
      chatInput.value = text;
      handleStudyRequest(text);
      chatInput.value = "";
    });
  });

  // ---------- Reset ----------
  resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm("This clears your saved demo plan from this browser. Continue?");
    if (!confirmed) return;
    tasks = [];
    saveTasks(tasks);
    renderPlan();
    chatLog.innerHTML = "";
    showFormStatus("Demo data cleared.", false);
  });

  // ---------- Theme toggle (manual only — never follows OS dark mode) ----------
  const themeToggle = document.getElementById("themeToggle");
  const THEME_KEY = "bitStudyBuddy.theme";

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.textContent = "Dark lab";
      themeToggle.setAttribute("aria-pressed", "false");
    } else {
      // "dark" is the default theme, set directly in CSS :root — no
      // attribute needed, which also avoids a light-theme flash on load.
      document.documentElement.removeAttribute("data-theme");
      themeToggle.textContent = "Light";
      themeToggle.setAttribute("aria-pressed", "true");
    }
  }

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (err) {
    // ignore — browser storage may be unavailable; default to dark
  }
  // Dark "study-lab" is the default look; the toggle switches to light.
  applyTheme(savedTheme === "light" ? "light" : "dark");

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (err) {
      // ignore — per-viewer convenience only
    }
  });

  // ---------- First paint ----------
  renderPlan();
})();
