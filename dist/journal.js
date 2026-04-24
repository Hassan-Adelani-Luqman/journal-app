import { loadEntries, saveEntries } from "./storage.js";
import { renderEntries, populateForm, clearForm, updateEntryCount, showToast, updateCharCount, renderMoodAnalytics, highlight, } from "./ui.js";
// ─── State ────────────────────────────────────────────────────────────────────
let journal = [];
let activeMoodFilter = "ALL";
let activeSearchQuery = "";
let activeSortOrder = "newest";
// ─── Generic Utility ──────────────────────────────────────────────────────────
function findByProperty(list, key, value) {
    return list.find((item) => item[key] === value);
}
function getFilteredEntries() {
    let result = journal;
    if (activeMoodFilter !== "ALL") {
        result = filterByMood(activeMoodFilter);
    }
    if (activeSearchQuery.trim() !== "") {
        result = searchEntries(activeSearchQuery, result);
    }
    return result.slice().sort((a, b) => activeSortOrder === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
}
function refreshView() {
    const filtered = getFilteredEntries();
    const isFiltered = activeMoodFilter !== "ALL" || activeSearchQuery.trim() !== "";
    renderEntries(filtered, activeSearchQuery, isFiltered);
    updateEntryCount(filtered.length);
    renderMoodAnalytics(journal);
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
        showToast("Entry updated ✓");
    }
    else {
        addEntry({ title, content, mood });
        showToast("Entry added ✓");
    }
    clearForm();
    clearFormError();
}
function handleEntriesClick(e) {
    const target = e.target;
    if (target.classList.contains("btn-delete")) {
        const id = target.dataset["id"];
        if (!id)
            return;
        const card = target.closest(".entry-card");
        if (!card)
            return;
        card.querySelector(".entry-actions")?.classList.add("hidden");
        card.querySelector(".delete-confirm")?.classList.remove("hidden");
        return;
    }
    if (target.classList.contains("btn-confirm-delete")) {
        const id = target.dataset["id"];
        if (id) {
            deleteEntry(id);
            showToast("Entry deleted", "info");
        }
        return;
    }
    if (target.classList.contains("btn-cancel-delete")) {
        const card = target.closest(".entry-card");
        if (!card)
            return;
        card.querySelector(".entry-actions")?.classList.remove("hidden");
        card.querySelector(".delete-confirm")?.classList.add("hidden");
        return;
    }
    if (target.classList.contains("btn-edit")) {
        const id = target.dataset["id"];
        if (!id)
            return;
        const entry = findByProperty(journal, "id", id);
        if (entry)
            populateForm(entry);
        return;
    }
    if (target.classList.contains("btn-read-more")) {
        const id = target.dataset["id"];
        if (!id)
            return;
        const entry = findByProperty(journal, "id", id);
        if (!entry)
            return;
        const card = target.closest(".entry-card");
        if (!card)
            return;
        const contentEl = card.querySelector(".entry-content");
        if (!contentEl)
            return;
        const isExpanded = card.dataset["expanded"] === "true";
        if (!isExpanded) {
            contentEl.innerHTML = highlight(entry.content, activeSearchQuery);
            target.textContent = "Read less";
            card.dataset["expanded"] = "true";
        }
        else {
            const truncated = entry.content.slice(0, 150) + "…";
            contentEl.innerHTML = highlight(truncated, activeSearchQuery);
            target.textContent = "Read more";
            card.dataset["expanded"] = "false";
        }
        return;
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
function handleSortChange(e) {
    const select = e.target;
    activeSortOrder = select.value;
    refreshView();
}
function handleExport() {
    if (journal.length === 0) {
        showToast("Nothing to export yet", "info");
        return;
    }
    const data = JSON.stringify(journal, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mood-journal-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Journal exported ✓");
}
function handleDarkMode() {
    const isDark = document.documentElement.dataset["theme"] === "dark";
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.dataset["theme"] = newTheme;
    localStorage.setItem("theme", newTheme);
    const btn = document.getElementById("dark-mode-toggle");
    if (btn)
        btn.textContent = newTheme === "dark" ? "☀️" : "🌙";
}
function handleCharCount(e) {
    const textarea = e.target;
    updateCharCount(textarea.value.length);
}
function handleContentKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.getElementById("entry-form");
        form?.requestSubmit();
    }
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
// ─── Bootstrap ────────────────────────────────────────────────────────────────
function init() {
    const savedTheme = localStorage.getItem("theme") ?? "light";
    document.documentElement.dataset["theme"] = savedTheme;
    const darkToggle = document.getElementById("dark-mode-toggle");
    if (darkToggle)
        darkToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
    journal = loadEntries();
    refreshView();
    const form = document.getElementById("entry-form");
    const entriesContainer = document.getElementById("entries-container");
    const moodFilter = document.getElementById("mood-filter");
    const searchInput = document.getElementById("search-input");
    const cancelBtn = document.getElementById("cancel-btn");
    const sortSelect = document.getElementById("sort-select");
    const exportBtn = document.getElementById("export-btn");
    const contentInput = document.getElementById("input-content");
    form?.addEventListener("submit", handleFormSubmit);
    entriesContainer?.addEventListener("click", handleEntriesClick);
    moodFilter?.addEventListener("change", handleMoodFilter);
    searchInput?.addEventListener("input", handleSearch);
    cancelBtn?.addEventListener("click", handleCancelEdit);
    sortSelect?.addEventListener("change", handleSortChange);
    exportBtn?.addEventListener("click", handleExport);
    darkToggle?.addEventListener("click", handleDarkMode);
    contentInput?.addEventListener("input", handleCharCount);
    contentInput?.addEventListener("keydown", handleContentKeydown);
}
document.addEventListener("DOMContentLoaded", init);
//# sourceMappingURL=journal.js.map