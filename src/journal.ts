import { Journal, JournalEntry, Mood, MoodFilter, NewEntryInput } from "./types.js";
import { loadEntries, saveEntries } from "./storage.js";
import {
  renderEntries,
  populateForm,
  clearForm,
  updateEntryCount,
} from "./ui.js";

// ─── State ────────────────────────────────────────────────────────────────────

let journal: Journal = [];
let activeMoodFilter: MoodFilter = "ALL";
let activeSearchQuery: string = "";

// ─── Generic Utility ──────────────────────────────────────────────────────────

/**
 * Reusable generic function to find an item within any array of objects
 * by matching a given property key to a given value.
 */
function findByProperty<T>(
  list: T[],
  key: keyof T,
  value: T[keyof T]
): T | undefined {
  return list.find((item) => item[key] === value);
}

// ─── Derived View ─────────────────────────────────────────────────────────────

function getFilteredEntries(): JournalEntry[] {
  let result: Journal = journal;

  if (activeMoodFilter !== "ALL") {
    result = filterByMood(activeMoodFilter);
  }

  if (activeSearchQuery.trim() !== "") {
    result = searchEntries(activeSearchQuery, result);
  }

  return result;
}

function refreshView(): void {
  const filtered = getFilteredEntries();
  renderEntries(filtered);
  updateEntryCount(filtered.length);
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
  } else {
    addEntry({ title, content, mood });
  }

  clearForm();
  clearFormError();
}

function handleEntriesClick(e: Event): void {
  const target = e.target as HTMLElement;

  if (target.classList.contains("btn-delete")) {
    const id = target.dataset["id"];
    if (id) deleteEntry(id);
  }

  if (target.classList.contains("btn-edit")) {
    const id = target.dataset["id"];
    if (!id) return;
    const entry = findByProperty(journal, "id", id);
    if (entry) populateForm(entry);
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

// ─── Bootstrap ───────────────────────────────────────────────────────────────

function init(): void {
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
