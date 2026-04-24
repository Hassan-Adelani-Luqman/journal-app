export enum Mood {
  HAPPY = "Happy",
  SAD = "Sad",
  MOTIVATED = "Motivated",
  STRESSED = "Stressed",
  CALM = "Calm",
  ANXIOUS = "Anxious",
  GRATEFUL = "Grateful",
  TIRED = "Tired",
  EXCITED = "Excited",
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  timestamp: number;
}

export type Journal = JournalEntry[];

export type NewEntryInput = Omit<JournalEntry, "id" | "timestamp">;

export type MoodFilter = Mood | "ALL";

export type SortOrder = "newest" | "oldest";
