import { Mood } from "./types.js";
const CONTENT_TRUNCATE_LENGTH = 150;
// ─── Emoji Map ────────────────────────────────────────────────────────────────
export function getMoodEmoji(mood) {
    const map = {
        [Mood.HAPPY]: "😄",
        [Mood.SAD]: "😔",
        [Mood.MOTIVATED]: "🚀",
        [Mood.STRESSED]: "😤",
        [Mood.CALM]: "😌",
        [Mood.ANXIOUS]: "😰",
        [Mood.GRATEFUL]: "🙏",
        [Mood.TIRED]: "😴",
        [Mood.EXCITED]: "🤩",
    };
    return map[mood];
}
// ─── Timestamp Formatter ──────────────────────────────────────────────────────
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
// ─── HTML Escape ──────────────────────────────────────────────────────────────
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// ─── Search Highlight ─────────────────────────────────────────────────────────
export function highlight(rawText, query) {
    const escaped = escapeHtml(rawText);
    if (!query.trim())
        return escaped;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return escaped.replace(new RegExp(safeQuery, "gi"), "<mark>$&</mark>");
}
// ─── Entry Card Template ──────────────────────────────────────────────────────
function entryCard(entry, searchQuery = "") {
    const emoji = getMoodEmoji(entry.mood);
    const moodClass = `mood-${entry.mood.toLowerCase()}`;
    const date = formatDate(entry.timestamp);
    const isLong = entry.content.length > CONTENT_TRUNCATE_LENGTH;
    const displayContent = isLong
        ? entry.content.slice(0, CONTENT_TRUNCATE_LENGTH) + "…"
        : entry.content;
    return `
    <article class="entry-card" data-id="${entry.id}">
      <header class="entry-header">
        <h2 class="entry-title">${highlight(entry.title, searchQuery)}</h2>
        <span class="mood-badge ${moodClass}">${emoji} ${entry.mood}</span>
      </header>
      <p class="entry-content">${highlight(displayContent, searchQuery)}</p>
      ${isLong ? `<button class="btn-read-more" data-id="${entry.id}">Read more</button>` : ""}
      <footer class="entry-footer">
        <time class="entry-date">${date}</time>
        <div class="entry-actions">
          <button class="btn btn-edit" data-id="${entry.id}" aria-label="Edit entry">Edit</button>
          <button class="btn btn-delete" data-id="${entry.id}" aria-label="Delete entry">Delete</button>
        </div>
        <div class="delete-confirm hidden" data-id="${entry.id}">
          <span class="delete-confirm-text">Delete this entry?</span>
          <button class="btn btn-confirm-delete btn-danger-sm" data-id="${entry.id}">Yes, delete</button>
          <button class="btn btn-cancel-delete btn-neutral-sm" data-id="${entry.id}">Cancel</button>
        </div>
      </footer>
    </article>
  `;
}
// ─── Render Entries ───────────────────────────────────────────────────────────
export function renderEntries(entries, searchQuery = "", isFiltered = false) {
    const container = document.getElementById("entries-container");
    if (!container)
        return;
    if (entries.length === 0) {
        const [icon, title, text] = isFiltered
            ? ["🔍", "No entries found", "Try a different search term or mood filter."]
            : ["📝", "Your journal is empty", "Add your first entry to start tracking your mood and thoughts."];
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-text">${text}</p>
      </div>
    `;
        return;
    }
    container.innerHTML = entries.map((e) => entryCard(e, searchQuery)).join("");
}
// ─── Mood Analytics ───────────────────────────────────────────────────────────
export function renderMoodAnalytics(entries) {
    const container = document.getElementById("mood-analytics");
    if (!container)
        return;
    if (entries.length === 0) {
        container.innerHTML = "";
        return;
    }
    const counts = {};
    for (const entry of entries) {
        counts[entry.mood] = (counts[entry.mood] ?? 0) + 1;
    }
    const pills = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([mood, count]) => {
        const emoji = getMoodEmoji(mood);
        const moodClass = `mood-${mood.toLowerCase()}`;
        return `<span class="analytics-pill ${moodClass}">${emoji} ${mood} · <strong>${count}</strong></span>`;
    })
        .join("");
    container.innerHTML = pills;
}
// ─── Toast ────────────────────────────────────────────────────────────────────
export function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container)
        return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toast-visible"));
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 3000);
}
// ─── Character Counter ────────────────────────────────────────────────────────
export function updateCharCount(current, max = 2000) {
    const el = document.getElementById("char-count");
    if (!el)
        return;
    el.textContent = String(current);
    const counter = el.closest(".char-counter");
    if (!counter)
        return;
    counter.classList.remove("char-warning", "char-danger");
    if (current / max >= 0.95)
        counter.classList.add("char-danger");
    else if (current / max >= 0.8)
        counter.classList.add("char-warning");
}
// ─── Form Helpers ─────────────────────────────────────────────────────────────
export function populateForm(entry) {
    const titleInput = document.getElementById("input-title");
    const contentInput = document.getElementById("input-content");
    const moodInput = document.getElementById("input-mood");
    const editIdInput = document.getElementById("edit-id");
    const submitBtn = document.getElementById("submit-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    if (titleInput)
        titleInput.value = entry.title;
    if (contentInput) {
        contentInput.value = entry.content;
        updateCharCount(entry.content.length);
    }
    if (moodInput)
        moodInput.value = entry.mood;
    if (editIdInput)
        editIdInput.value = entry.id;
    if (submitBtn)
        submitBtn.textContent = "Update Entry";
    if (cancelBtn)
        cancelBtn.classList.remove("hidden");
    titleInput?.focus();
}
export function clearForm() {
    const titleInput = document.getElementById("input-title");
    const contentInput = document.getElementById("input-content");
    const moodInput = document.getElementById("input-mood");
    const editIdInput = document.getElementById("edit-id");
    const submitBtn = document.getElementById("submit-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    if (titleInput)
        titleInput.value = "";
    if (contentInput) {
        contentInput.value = "";
        updateCharCount(0);
    }
    if (moodInput)
        moodInput.value = "";
    if (editIdInput)
        editIdInput.value = "";
    if (submitBtn)
        submitBtn.textContent = "Add Entry";
    if (cancelBtn)
        cancelBtn.classList.add("hidden");
}
// ─── Entry Count ──────────────────────────────────────────────────────────────
export function updateEntryCount(count) {
    const counter = document.getElementById("entry-count");
    if (counter) {
        counter.textContent = `${count} ${count === 1 ? "entry" : "entries"}`;
    }
}
//# sourceMappingURL=ui.js.map