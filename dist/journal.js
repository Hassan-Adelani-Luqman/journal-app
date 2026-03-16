import { loadEntries, saveEntries } from "./storage.js";
import { renderEntries, populateForm, clearForm, updateEntryCount, } from "./ui.js";
// ─── State ────────────────────────────────────────────────────────────────────
let journal = [];
let activeMoodFilter = "ALL";
let activeSearchQuery = "";
// ─── Generic Utility ──────────────────────────────────────────────────────────
/**
 * Reusable generic function to find an item within any array of objects
 * by matching a given property key to a given value.
 */
function findByProperty(list, key, value) {
    return list.find((item) => item[key] === value);
}
// ─── Derived View ─────────────────────────────────────────────────────────────
function getFilteredEntries() {
    let result = journal;
    if (activeMoodFilter !== "ALL") {
        result = filterByMood(activeMoodFilter);
    }
    if (activeSearchQuery.trim() !== "") {
        result = searchEntries(activeSearchQuery, result);
    }
    return result;
}
function refreshView() {
    const filtered = getFilteredEntries();
    renderEntries(filtered);
    updateEntryCount(filtered.length);
}
// ─── CRUD Operations ──────────────────────────────────────────────────────────
function addEntry(input) {
    const newEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        title: input.title,
        content: input.content,
        mood: input.mood,
    };
    journal = [...journal, newEntry];
    saveEntries(journal);
    refreshView();
}
function deleteEntry(id) {
    journal = journal.filter((entry) => entry.id !== id);
    saveEntries(journal);
    refreshView();
}
function editEntry(id, updates) {
    const existing = findByProperty(journal, "id", id);
    if (!existing)
        return;
    const updated = { ...existing, ...updates };
    journal = journal.map((entry) => (entry.id === id ? updated : entry));
    saveEntries(journal);
    refreshView();
}
// ─── Filter & Search ──────────────────────────────────────────────────────────
function filterByMood(mood, source = journal) {
    return source.filter((entry) => entry.mood === mood);
}
function searchEntries(query, source = journal) {
    const lower = query.toLowerCase();
    return source.filter((entry) => entry.title.toLowerCase().includes(lower) ||
        entry.content.toLowerCase().includes(lower));
}
// ─── Event Handlers ───────────────────────────────────────────────────────────
function handleFormSubmit(e) {
    e.preventDefault();
    const titleInput = document.getElementById("input-title");
    const contentInput = document.getElementById("input-content");
    const moodInput = document.getElementById("input-mood");
    const editIdInput = document.getElementById("edit-id");
    const title = titleInput?.value.trim() ?? "";
    const content = contentInput?.value.trim() ?? "";
    const moodValue = moodInput?.value ?? "";
    const editId = editIdInput?.value.trim() ?? "";
    if (!title || !content || !moodValue) {
        showFormError("Please fill in all fields.");
        return;
    }
    const mood = moodValue;
    if (editId) {
        editEntry(editId, { title, content, mood });
    }
    else {
        addEntry({ title, content, mood });
    }
    clearForm();
    clearFormError();
}
function handleEntriesClick(e) {
    const target = e.target;
    if (target.classList.contains("btn-delete")) {
        const id = target.dataset["id"];
        if (id)
            deleteEntry(id);
    }
    if (target.classList.contains("btn-edit")) {
        const id = target.dataset["id"];
        if (!id)
            return;
        const entry = findByProperty(journal, "id", id);
        if (entry)
            populateForm(entry);
    }
}
function handleMoodFilter(e) {
    const select = e.target;
    activeMoodFilter = select.value;
    refreshView();
}
function handleSearch(e) {
    const input = e.target;
    activeSearchQuery = input.value;
    refreshView();
}
function handleCancelEdit() {
    clearForm();
    clearFormError();
}
// ─── Form Error Display ───────────────────────────────────────────────────────
function showFormError(message) {
    const errorEl = document.getElementById("form-error");
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
    }
}
function clearFormError() {
    const errorEl = document.getElementById("form-error");
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
    }
}
// ─── Bootstrap ───────────────────────────────────────────────────────────────
function init() {
    journal = loadEntries();
    refreshView();
    const form = document.getElementById("entry-form");
    const entriesContainer = document.getElementById("entries-container");
    const moodFilter = document.getElementById("mood-filter");
    const searchInput = document.getElementById("search-input");
    const cancelBtn = document.getElementById("cancel-btn");
    form?.addEventListener("submit", handleFormSubmit);
    entriesContainer?.addEventListener("click", handleEntriesClick);
    moodFilter?.addEventListener("change", handleMoodFilter);
    searchInput?.addEventListener("input", handleSearch);
    cancelBtn?.addEventListener("click", handleCancelEdit);
}
document.addEventListener("DOMContentLoaded", init);
//# sourceMappingURL=journal.js.map