import { Injectable, signal, computed } from '@angular/core';
import { PracticeSession, SessionResult } from '../models/question.model';
import { QuestionService } from './question.service';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  private _session = signal<PracticeSession | null>(null);

  readonly session = this._session.asReadonly();
  readonly isActive = computed(() => this._session() !== null);
  readonly isDone = computed(() => {
    const s = this._session();
    return s ? s.currentIndex >= s.questions.length : false;
  });

  readonly currentQuestion = computed(() => {
    const s = this._session();
    if (!s || s.currentIndex >= s.questions.length) return null;
    return s.questions[s.currentIndex];
  });

  readonly progress = computed(() => {
    const s = this._session();
    if (!s) return { current: 0, total: 0, pct: 0 };
    return {
      current: s.currentIndex,
      total: s.questions.length,
      pct: Math.round((s.currentIndex / s.questions.length) * 100),
    };
  });

  constructor(private qs: QuestionService) {}

  startSession(selectedCategories: string[], packageSize: number): boolean {
    const questions = this.qs.selectForSession(selectedCategories, packageSize);
    if (!questions.length) return false;

    this._session.set({
      packageSize,
      questions,
      currentIndex: 0,
      results: [],
      startedAt: new Date().toISOString(),
    });
    return true;
  }

  submitRating(rating: number): SessionResult | null {
    const s = this._session();
    const q = this.currentQuestion();
    if (!s || !q) return null;

    const { before, after } = this.qs.applyRating(q.id, rating);

    const result: SessionResult = {
      questionId: q.id,
      question: q.question,
      rating,
      dominanceBefore: before,
      dominanceAfter: after,
    };

    this._session.update(sess => sess ? {
      ...sess,
      currentIndex: sess.currentIndex + 1,
      results: [...sess.results, result],
    } : null);

    return result;
  }

  endSession(): void {
    this._session.set(null);
  }

  getSessionSummary(): { results: SessionResult[]; avgRating: number; improved: number; declined: number } | null {
    const s = this._session();
    if (!s) return null;
    const results = s.results;
    const avgRating = results.length ? +(results.reduce((a, r) => a + r.rating, 0) / results.length).toFixed(1) : 0;
    const improved = results.filter(r => r.dominanceAfter > r.dominanceBefore).length;
    const declined = results.filter(r => r.dominanceAfter < r.dominanceBefore).length;
    return { results, avgRating, improved, declined };
  }
}
