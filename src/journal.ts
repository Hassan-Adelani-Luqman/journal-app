import { Journal, JournalEntry, Mood, MoodFilter, NewEntryInput, SortOrder } from "./types.js";
import { loadEntries, saveEntries } from "./storage.js";
import {
  renderEntries,
  populateForm,
  clearForm,
  updateEntryCount,
  showToast,
  updateCharCount,
  renderMoodAnalytics,
  highlight,
} from "./ui.js";

// ─── State ────────────────────────────────────────────────────────────────────

let journal: Journal = [];
let activeMoodFilter: MoodFilter = "ALL";
let activeSearchQuery: string = "";
let activeSortOrder: SortOrder = "newest";

// ─── Generic Utility ──────────────────────────────────────────────────────────

function findByProperty<T>(
  list: T[],
  key: keyof T,
  value: T[keyof T]
): T | undefined {
  return list.find((item) => item[key] === value);
}

function getFilteredEntries(): JournalEntry[] {
  let result: Journal = journal;

  if (activeMoodFilter !== "ALL") {
    result = filterByMood(activeMoodFilter);
  }

  if (activeSearchQuery.trim() !== "") {
    result = searchEntries(activeSearchQuery, result);
  }

  return result.slice().sort((a, b) =>
    activeSortOrder === "newest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  );
}

function refreshView(): void {
  const filtered = getFilteredEntries();
  const isFiltered = activeMoodFilter !== "ALL" || activeSearchQuery.trim() !== "";
  renderEntries(filtered, activeSearchQuery, isFiltered);
  updateEntryCount(filtered.length);
  renderMoodAnalytics(journal);
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

function addEntry(input: NewEntryInput): void {
  const newEntry: JournalEntry = {
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

function deleteEntry(id: string): void {
  journal = journal.filter((entry) => entry.id !== id);
  saveEntries(journal);
  refreshView();
}

function editEntry(id: string, updates: Partial<NewEntryInput>): void {
  const existing = findByProperty(journal, "id", id);
  if (!existing) return;

  const updated: JournalEntry = { ...existing, ...updates };
  journal = journal.map((entry) => (entry.id === id ? updated : entry));
  saveEntries(journal);
  refreshView();
}

// ─── Filter & Search ──────────────────────────────────────────────────────────

function filterByMood(mood: Mood, source: Journal = journal): Journal {
  return source.filter((entry) => entry.mood === mood);
}

function searchEntries(query: string, source: Journal = journal): Journal {
  const lower = query.toLowerCase();
  return source.filter(
    (entry) =>
      entry.title.toLowerCase().includes(lower) ||
      entry.content.toLowerCase().includes(lower)
  );
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

function handleFormSubmit(e: Event): void {
  e.preventDefault();

  const titleInput = document.getElementById("input-title") as HTMLInputElement | null;
  const contentInput = document.getElementById("input-content") as HTMLTextAreaElement | null;
  const moodInput = document.getElementById("input-mood") as HTMLSelectElement | null;
  const editIdInput = document.getElementById("edit-id") as HTMLInputElement | null;

  const title = titleInput?.value.trim() ?? "";
  const content = contentInput?.value.trim() ?? "";
  const moodValue = moodInput?.value ?? "";
  const editId = editIdInput?.value.trim() ?? "";

  if (!title || !content || !moodValue) {
    showFormError("Please fill in all fields.");
    return;
  }

  const mood = moodValue as Mood;

  if (editId) {
    editEntry(editId, { title, content, mood });
    showToast("Entry updated ✓");
  } else {
    addEntry({ title, content, mood });
    showToast("Entry added ✓");
  }

  clearForm();
  clearFormError();
}

function handleEntriesClick(e: Event): void {
  const target = e.target as HTMLElement;

  if (target.classList.contains("btn-delete")) {
    const id = target.dataset["id"];
    if (!id) return;
    const card = target.closest(".entry-card") as HTMLElement | null;
    if (!card) return;
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
    const card = target.closest(".entry-card") as HTMLElement | null;
    if (!card) return;
    card.querySelector(".entry-actions")?.classList.remove("hidden");
    card.querySelector(".delete-confirm")?.classList.add("hidden");
    return;
  }

  if (target.classList.contains("btn-edit")) {
    const id = target.dataset["id"];
    if (!id) return;
    const entry = findByProperty(journal, "id", id);
    if (entry) populateForm(entry);
    return;
  }

  if (target.classList.contains("btn-read-more")) {
    const id = target.dataset["id"];
    if (!id) return;
    const entry = findByProperty(journal, "id", id);
    if (!entry) return;
    const card = target.closest(".entry-card") as HTMLElement | null;
    if (!card) return;
    const contentEl = card.querySelector(".entry-content") as HTMLElement | null;
    if (!contentEl) return;
    const isExpanded = card.dataset["expanded"] === "true";
    if (!isExpanded) {
      contentEl.innerHTML = highlight(entry.content, activeSearchQuery);
      target.textContent = "Read less";
      card.dataset["expanded"] = "true";
    } else {
      const truncated = entry.content.slice(0, 150) + "…";
      contentEl.innerHTML = highlight(truncated, activeSearchQuery);
      target.textContent = "Read more";
      card.dataset["expanded"] = "false";
    }
    return;
  }
}

function handleMoodFilter(e: Event): void {
  const select = e.target as HTMLSelectElement;
  activeMoodFilter = select.value as MoodFilter;
  refreshView();
}

function handleSearch(e: Event): void {
  const input = e.target as HTMLInputElement;
  activeSearchQuery = input.value;
  refreshView();
}

function handleCancelEdit(): void {
  clearForm();
  clearFormError();
}

function handleSortChange(e: Event): void {
  const select = e.target as HTMLSelectElement;
  activeSortOrder = select.value as SortOrder;
  refreshView();
}

function handleExport(): void {
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

function handleDarkMode(): void {
  const isDark = document.documentElement.dataset["theme"] === "dark";
  const newTheme = isDark ? "light" : "dark";
  document.documentElement.dataset["theme"] = newTheme;
  localStorage.setItem("theme", newTheme);
  const btn = document.getElementById("dark-mode-toggle");
  if (btn) btn.textContent = newTheme === "dark" ? "☀️" : "🌙";
}

function handleCharCount(e: Event): void {
  const textarea = e.target as HTMLTextAreaElement;
  updateCharCount(textarea.value.length);
}

function handleContentKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const form = document.getElementById("entry-form") as HTMLFormElement | null;
    form?.requestSubmit();
  }
}

// ─── Form Error Display ───────────────────────────────────────────────────────

function showFormError(message: string): void {
  const errorEl = document.getElementById("form-error");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
}

function clearFormError(): void {
  const errorEl = document.getElementById("form-error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function init(): void {
  const savedTheme = localStorage.getItem("theme") ?? "light";
  document.documentElement.dataset["theme"] = savedTheme;
  const darkToggle = document.getElementById("dark-mode-toggle");
  if (darkToggle) darkToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  journal = loadEntries();
  refreshView();

  const form = document.getElementById("entry-form");
  const entriesContainer = document.getElementById("entries-container");
  const moodFilter = document.getElementById("mood-filter");
  const searchInput = document.getElementById("search-input");
  const cancelBtn = document.getElementById("cancel-btn");
  const sortSelect = document.getElementById("sort-select");
  const exportBtn = document.getElementById("export-btn");
  const contentInput = document.getElementById("input-content") as HTMLTextAreaElement | null;

  form?.addEventListener("submit", handleFormSubmit);
  entriesContainer?.addEventListener("click", handleEntriesClick);
  moodFilter?.addEventListener("change", handleMoodFilter);
  searchInput?.addEventListener("input", handleSearch);
  cancelBtn?.addEventListener("click", handleCancelEdit);
  sortSelect?.addEventListener("change", handleSortChange);
  exportBtn?.addEventListener("click", handleExport);
  darkToggle?.addEventListener("click", handleDarkMode);
  contentInput?.addEventListener("input", handleCharCount);
  contentInput?.addEventListener("keydown", handleContentKeydown as EventListener);
}

document.addEventListener("DOMContentLoaded", init);
