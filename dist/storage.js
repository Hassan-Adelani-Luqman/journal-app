const STORAGE_KEY = "mood_journal";
/**
 * Loads all journal entries from localStorage.
 * Returns an empty array if nothing is stored yet.
 * Type assertion (as JournalEntry[]) bridges the JSON.parse return type
 * to our strict JournalEntry contract.
 */
export function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return [];
    return JSON.parse(raw);
}
/**
 * Persists the entire journal array to localStorage as a JSON string.
 */
export function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
//# sourceMappingURL=storage.js.map