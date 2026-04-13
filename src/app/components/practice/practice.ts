import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PracticeService } from '../../services/practice.service';
import { QuestionService } from '../../services/question.service';
import { SpeechService } from '../../services/speech.service';
import { RATING_LABELS, DOMINANCE_LABELS, DOMINANCE_COLORS, SessionResult } from '../../models/question.model';

type Phase = 'question' | 'answer' | 'done';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice.html',
  styleUrl: './practice.scss',
})
export class PracticeComponent implements OnInit, OnDestroy {
  private ps = inject(PracticeService);
  private qs = inject(QuestionService);
  private speech = inject(SpeechService);
  private router = inject(Router);

  readonly ratingLabels = RATING_LABELS;
  readonly dominanceLabels = DOMINANCE_LABELS;
  readonly dominanceColors = DOMINANCE_COLORS;

  phase = signal<Phase>('question');
  lastResult = signal<SessionResult | null>(null);
  showLastResult = signal(false);

  readonly session = this.ps.session;
  readonly currentQuestion = this.ps.currentQuestion;
  readonly progress = this.ps.progress;
  readonly isSpeaking = this.speech.isSpeaking;
  readonly isDone = this.ps.isDone;
  readonly summary = computed(() => this.ps.getSessionSummary());

  ngOnInit(): void {
    if (!this.ps.isActive()) {
      this.router.navigate(['/']);
      return;
    }
    // Auto-play if enabled
    const settings = this.qs.settings();
    if (settings.autoPlayQuestion && this.currentQuestion()) {
      setTimeout(() => this.playQuestion(), 300);
    }
  }

  ngOnDestroy(): void {
    this.speech.stop();
  }

  playQuestion(): void {
    const q = this.currentQuestion();
    if (q) this.speech.speak(q.question, this.qs.settings());
  }

  playAnswer(text: string): void {
    this.speech.speak(text, this.qs.settings());
  }

  stopSpeaking(): void {
    this.speech.stop();
  }

  showAnswer(): void {
    this.phase.set('answer');
    const settings = this.qs.settings();
    if (settings.autoPlayAnswer && this.currentQuestion()?.answers?.[0]) {
      setTimeout(() => this.playAnswer(this.currentQuestion()!.answers[0]), 200);
    }
  }

  submitRating(rating: number): void {
    const result = this.ps.submitRating(rating);
    this.lastResult.set(result);
    this.showLastResult.set(true);

    // Brief flash then advance
    setTimeout(() => {
      this.showLastResult.set(false);
      if (this.ps.isDone()) {
        this.phase.set('done');
      } else {
        this.phase.set('question');
        const settings = this.qs.settings();
        if (settings.autoPlayQuestion && this.ps.currentQuestion()) {
          setTimeout(() => this.playQuestion(), 300);
        }
      }
    }, 600);
  }

  domLabel(d: number): string {
    return DOMINANCE_LABELS[d] ?? '';
  }

  domColor(d: number): string {
    return DOMINANCE_COLORS[d] ?? DOMINANCE_COLORS[0];
  }

  finishSession(): void {
    this.speech.stop();
    this.ps.endSession();
    this.router.navigate(['/']);
  }

  avgRatingLabel(avg: number): string {
    if (avg >= 3.5) return 'Excellent session!';
    if (avg >= 2.5) return 'Good progress!';
    if (avg >= 1.5) return 'Keep practicing!';
    return 'Don\'t give up!';
  }

  ratingEmoji(r: number): string {
    return RATING_LABELS[r]?.emoji ?? '?';
  }
}
