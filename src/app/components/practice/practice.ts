import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PracticeService } from '../../services/practice.service';
import { AudioService } from '../../services/audio.service';
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
  private audio = inject(AudioService);
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
  readonly isSpeaking = this.audio.isSpeaking;
  readonly isDone = this.ps.isDone;
  readonly summary = computed(() => this.ps.getSessionSummary());

  ngOnInit(): void {
    if (!this.ps.isActive()) {
      this.router.navigate(['/']);
      return;
    }
    if (this.currentQuestion()) {
      setTimeout(() => this.playQuestion(), 300);
    }
  }

  ngOnDestroy(): void {
    this.audio.stop();
  }

  playQuestion(): void {
    const q = this.currentQuestion();
    if (q) this.audio.play(parseInt(q.id));
  }

  playAnswer(): void {
    const q = this.currentQuestion();
    if (q) this.audio.play(parseInt(q.id) + 1000);
  }

  stopSpeaking(): void {
    this.audio.stop();
  }

  showAnswer(): void {
    this.phase.set('answer');
  }

  submitRating(rating: number): void {
    const result = this.ps.submitRating(rating);
    this.lastResult.set(result);
    this.showLastResult.set(true);

    setTimeout(() => {
      this.showLastResult.set(false);
      if (this.ps.isDone()) {
        this.phase.set('done');
      } else {
        this.phase.set('question');
        if (this.ps.currentQuestion()) {
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
    this.audio.stop();
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
