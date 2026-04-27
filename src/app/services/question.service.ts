import { Injectable, signal, computed } from '@angular/core';
import { Question, Category, AppSettings, DOMINANCE_LABELS } from '../models/question.model';
import bankData from '../components/question-bank/bank.json';

const STORAGE_KEYS = {
  PROGRESS: 'ep_progress',
  SETTINGS: 'ep_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  _placeholder: false,
};

type ProgressEntry = { dominance: number; practiceCount: number; lastTried: string | null };
type ProgressMap = Record<string, ProgressEntry>;

function categoryForId(id: number): string {
  if (id <= 1080) return 'Social & Daily Life';
  if (id <= 1280) return 'Workplace English';
  return 'Professional Growth';
}

function buildBankQuestions(): Question[] {
  const answerMap = new Map<number, string>(
    (bankData as { id: number; type: string; text: string }[])
      .filter(r => r.type === 'answer')
      .map(r => [r.id, r.text])
  );
  return (bankData as { id: number; type: string; text: string }[])
    .filter(r => r.type === 'question')
    .map(r => ({
      id: String(r.id),
      question: r.text,
      answers: [answerMap.get(r.id + 1000) ?? ''],
      category: categoryForId(r.id),
      dominance: 0,
      practiceCount: 0,
      lastTried: null,
    }));
}

const BANK_QUESTIONS = buildBankQuestions();

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private _questions = signal<Question[]>(this.loadQuestions());
  private _settings = signal<AppSettings>(this.loadSettings());

  readonly questions = this._questions.asReadonly();
  readonly settings = this._settings.asReadonly();

  readonly categories = computed<Category[]>(() => {
    const cats = [...new Set(this._questions().map(q => q.category))].sort();
    return cats.map(name => ({ name, selected: true }));
  });

  readonly categoryNames = computed(() =>
    [...new Set(this._questions().map(q => q.category))].sort()
  );

  readonly stats = computed(() => {
    const qs = this._questions();
    if (!qs.length) return { total: 0, avgDominance: 0, practiced: 0, mastered: 0 };
    const total = qs.length;
    const avgDominance = +(qs.reduce((s, q) => s + q.dominance, 0) / total).toFixed(1);
    const practiced = qs.filter(q => q.practiceCount > 0).length;
    const mastered = qs.filter(q => q.dominance === 6).length;
    return { total, avgDominance, practiced, mastered };
  });

  addQuestion(data: Omit<Question, 'id' | 'practiceCount' | 'lastTried' | 'dominance'>): Question {
    const id = crypto.randomUUID ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const q: Question = { ...data, id, practiceCount: 0, lastTried: null, dominance: 0 };
    this._questions.update(list => [...list, q]);
    this.saveProgress();
    return q;
  }

  updateQuestion(id: string, data: Partial<Omit<Question, 'id'>>): void {
    this._questions.update(list => list.map(q => q.id === id ? { ...q, ...data } : q));
    this.saveProgress();
  }

  deleteQuestion(id: string): void {
    this._questions.update(list => list.filter(q => q.id !== id));
    this.saveProgress();
  }

  getById(id: string): Question | undefined {
    return this._questions().find(q => q.id === id);
  }

  selectForSession(selectedCategories: string[], count: number): Question[] {
    const now = Date.now();
    const DAY_MS = 86_400_000;
    const pool = this._questions().filter(q => selectedCategories.includes(q.category));
    if (!pool.length) return [];
    const scored = pool.map(q => {
      const daysSince = q.lastTried
        ? (now - new Date(q.lastTried).getTime()) / DAY_MS
        : 999;
      const recency = Math.min(daysSince / 7, 1);
      const weakness = (6 - q.dominance) / 6;
      const noise = Math.random() * 0.12;
      return { q, score: weakness * 0.65 + recency * 0.35 + noise };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(s => s.q);
  }

  applyRating(questionId: string, rating: number): { before: number; after: number } {
    const q = this.getById(questionId);
    if (!q) return { before: 0, after: 0 };
    const before = q.dominance;
    let delta = 0;
    if (rating === 0) delta = -2;
    else if (rating === 1) delta = -1;
    else if (rating === 2) delta = 0;
    else if (rating === 3) delta = 1;
    else if (rating === 4) delta = 2;
    const after = Math.max(0, Math.min(6, before + delta));
    this.updateQuestion(questionId, {
      dominance: after,
      practiceCount: q.practiceCount + 1,
      lastTried: new Date().toISOString(),
    });
    return { before, after };
  }

  dominanceLabel(d: number): string {
    return DOMINANCE_LABELS[d] ?? 'Unknown';
  }

  saveSettings(settings: AppSettings): void {
    this._settings.set(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  updateSettings(partial: Partial<AppSettings>): void {
    const next = { ...this._settings(), ...partial };
    this.saveSettings(next);
  }

  importQuestions(questions: Question[]): void {
    this._questions.set(questions);
    this.saveProgress();
  }

  exportQuestions(): string {
    return JSON.stringify(this._questions(), null, 2);
  }

  resetAllProgress(): void {
    this._questions.update(list => list.map(q => ({
      ...q, dominance: 0, practiceCount: 0, lastTried: null
    })));
    this.saveProgress();
  }

  private loadQuestions(): Question[] {
    const progress = this.loadProgress();
    return BANK_QUESTIONS.map(q => {
      const p = progress[q.id];
      return p ? { ...q, ...p } : q;
    });
  }

  private loadProgress(): ProgressMap {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (raw) return JSON.parse(raw) as ProgressMap;
    } catch { /* ignore */ }
    return {};
  }

  private saveProgress(): void {
    const progress: ProgressMap = {};
    for (const q of this._questions()) {
      if (q.dominance > 0 || q.practiceCount > 0 || q.lastTried) {
        progress[q.id] = {
          dominance: q.dominance,
          practiceCount: q.practiceCount,
          lastTried: q.lastTried,
        };
      }
    }
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  }

  private loadSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
  }
}
