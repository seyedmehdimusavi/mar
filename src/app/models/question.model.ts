export interface Question {
  id: string;
  question: string;
  answers: string[];
  category: string;
  practiceCount: number;
  lastTried: string | null;   // ISO date string
  dominance: number;           // 0–6 mastery level
}

export interface Category {
  name: string;
  selected: boolean;
}

export interface AppSettings {
  voiceURI: string | null;
  rate: number;   // 0.5–2
  pitch: number;  // 0–2
  volume: number; // 0–1
  autoPlayQuestion: boolean;
  autoPlayAnswer: boolean;
}

export interface SessionResult {
  questionId: string;
  question: string;
  rating: number;        // 0–4 (Blank/Hard/OK/Good/Easy)
  dominanceBefore: number;
  dominanceAfter: number;
}

export interface PracticeSession {
  packageSize: number;
  questions: Question[];
  currentIndex: number;
  results: SessionResult[];
  startedAt: string;
}

export const PACKAGE_SIZES = [5, 10, 15, 20, 25, 30] as const;

export const RATING_LABELS: { value: number; label: string; emoji: string; color: string }[] = [
  { value: 0, label: 'Blank',   emoji: '🫥', color: '#ef4444' },
  { value: 1, label: 'Hard',    emoji: '😓', color: '#f97316' },
  { value: 2, label: 'OK',      emoji: '😐', color: '#eab308' },
  { value: 3, label: 'Good',    emoji: '🙂', color: '#22c55e' },
  { value: 4, label: 'Easy',    emoji: '😎', color: '#3b82f6' },
];

export const DOMINANCE_LABELS = ['New', 'Seen', 'Weak', 'Learning', 'Getting There', 'Almost', 'Mastered'];
export const DOMINANCE_COLORS = ['#94a3b8', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#3b82f6'];
