
import { DiaryEntry } from "../types";

const STORAGE_KEY = 'kisanBotDiary';

export const getDiaryEntries = (): DiaryEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addDiaryEntry = (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => {
  const entries = getDiaryEntries();
  const newEntry: DiaryEntry = {
    ...entry,
    id: Date.now().toString(),
    timestamp: Date.now()
  };
  // Prepend new entry
  const updated = [newEntry, ...entries];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newEntry;
};

export const deleteDiaryEntry = (id: string) => {
  const entries = getDiaryEntries();
  const updated = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
