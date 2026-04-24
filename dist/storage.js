const STORAGE_KEY = "mood_journal";
export function loadEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return [];
    return JSON.parse(raw);
}
export function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
//# sourceMappingURL=storage.js.map