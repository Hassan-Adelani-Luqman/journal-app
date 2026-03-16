import { Mood } from "./types.js";
// ─── Emoji Map ────────────────────────────────────────────────────────────────
export function getMoodEmoji(mood) {
    const map = {
        [Mood.HAPPY]: "😄",
        [Mood.SAD]: "😔",
        [Mood.MOTIVATED]: "🚀",
        [Mood.STRESSED]: "😤",
        [Mood.CALM]: "😌",
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
// ─── Entry Card Template ──────────────────────────────────────────────────────
function entryCard(entry) {
    const emoji = getMoodEmoji(entry.mood);
    const moodClass = `mood-${entry.mood.toLowerCase()}`;
    const date = formatDate(entry.timestamp);
    return `
    <article class="entry-card" data-id="${entry.id}">
      <header class="entry-header">
        <h2 class="entry-title">${escapeHtml(entry.title)}</h2>
        <span class="mood-badge ${moodClass}">${emoji} ${entry.mood}</span>
      </header>
      <p class="entry-content">${escapeHtml(entry.content)}</p>
      <footer class="entry-footer">
        <time class="entry-date">${date}</time>
        <div class="entry-actions">
          <button class="btn btn-edit" data-id="${entry.id}" aria-label="Edit entry">Edit</button>
          <button class="btn btn-delete" data-id="${entry.id}" aria-label="Delete entry">Delete</button>
        </div>
      </footer>
    </article>
  `;
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
// ─── Render Entries ───────────────────────────────────────────────────────────
export function renderEntries(entries) {
    const container = document.getElementById("entries-container");
    if (!container)
        return;
    if (entries.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <p>No entries yet. Write your first journal entry!</p>
      </div>
    `;
        return;
    }
    container.innerHTML = entries
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(entryCard)
        .join("");
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
    if (contentInput)
        contentInput.value = entry.content;
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
    if (contentInput)
        contentInput.value = "";
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