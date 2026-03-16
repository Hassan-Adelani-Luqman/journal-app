import { Journal, JournalEntry } from "./types.js";

const STORAGE_KEY = "mood_journal";

/**
 * Loads all journal entries from localStorage.
 * Returns an empty array if nothing is stored yet.
 * Type assertion (as JournalEntry[]) bridges the JSON.parse return type
 * to our strict JournalEntry contract.
 */
export function loadEntries(): Journal {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as JournalEntry[];
}

/**
 * Persists the entire journal array to localStorage as a JSON string.
 */
export function saveEntries(entries: Journal): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
