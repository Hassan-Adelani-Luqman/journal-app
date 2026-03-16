// ─── Mood Enum ───────────────────────────────────────────────────────────────

export enum Mood {
  HAPPY = "Happy",
  SAD = "Sad",
  MOTIVATED = "Motivated",
  STRESSED = "Stressed",
  CALM = "Calm",
}

// ─── Core Interface ───────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  timestamp: number;
}

// ─── Type Aliases ─────────────────────────────────────────────────────────────

/** The full journal collection */
export type Journal = JournalEntry[];

/** Input from the form — id and timestamp are generated automatically */
export type NewEntryInput = Omit<JournalEntry, "id" | "timestamp">;

/** Union type used by the mood filter — "ALL" means no filter applied */
export type MoodFilter = Mood | "ALL";
