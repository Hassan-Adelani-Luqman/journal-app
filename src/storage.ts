import { Journal, JournalEntry } from "./types.js";

const STORAGE_KEY = "mood_journal";

export function loadEntries(): Journal {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as JournalEntry[];
}

export function saveEntries(entries: Journal): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
