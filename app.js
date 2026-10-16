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
      // Remove the hours phrase and common filler, then take what's left as subjects
      subjectsText = text
        .replace(/\b(i have|this week|light week|only)\b/gi, "")
        .replace(/\d+(\.\d+)?\s*(hours|hour|hrs|hr)/gi, "");
    }

    let subjects = subjectsText
      .split(/,|\band\b/i)
      .map((s) => s.replace(/\(.*?\)/g, "").trim())
      .filter((s) => s.length > 1 && s.length < 40);

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

  // ---------- Rendering the plan list ----------
  function renderPlan() {
    planList.innerHTML = "";

    if (tasks.length === 0) {
      planEmptyState.style.display = "block";
      return;
    }
    planEmptyState.style.display = "none";

    const sorted = tasks.slice().sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

    sorted.forEach((task) => {
      const li = document.createElement("li");
      li.className = "plan-item" + (task.complete ? " is-complete" : "");
      li.dataset.id = task.id;

      li.innerHTML = `
        <span class="plan-item-day">${DAY_LABELS[task.day] || task.day}</span>
        <span class="plan-item-body">
          <span class="plan-item-subject"></span>
          <span class="plan-item-meta">
            <span>${task.duration} min</span>
            <span class="priority-dot priority-${task.priority}">${capitalize(task.priority)}</span>
          </span>
        </span>
        <span class="plan-item-actions">
          <button type="button" class="icon-btn btn-complete" aria-pressed="${task.complete}" title="Mark complete" aria-label="Mark ${task.subject} complete">✓</button>
          <button type="button" class="icon-btn btn-edit" title="Edit" aria-label="Edit ${task.subject}">✎</button>
          <button type="button" class="icon-btn btn-delete" title="Delete" aria-label="Delete ${task.subject}">✕</button>
        </span>
      `;
      // set subject via textContent to avoid any HTML-injection from free text
      li.querySelector(".plan-item-subject").textContent = task.subject;

      li.querySelector(".btn-complete").addEventListener("click", () => toggleComplete(task.id));
      li.querySelector(".btn-delete").addEventListener("click", () => deleteTask(task.id));
      li.querySelector(".btn-edit").addEventListener("click", () => editTask(task.id));

      planList.appendChild(li);
    });
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

  // ---------- First paint ----------
  renderPlan();
})();
