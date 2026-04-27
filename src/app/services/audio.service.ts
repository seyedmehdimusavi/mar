import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private doc = inject(DOCUMENT);
  private current: HTMLAudioElement | null = null;
  readonly isSpeaking = signal(false);

  private baseHref(): string {
    return this.doc.querySelector('base')?.href ?? '/';
  }

  play(id: number | string): void {
    this.stop();
    const audio = new Audio(`${this.baseHref()}mp3/${id}.mp3`);
    this.current = audio;
    audio.onplay = () => this.isSpeaking.set(true);
    audio.onended = () => this.isSpeaking.set(false);
    audio.onerror = () => this.isSpeaking.set(false);
    audio.play().catch(() => this.isSpeaking.set(false));
  }

  stop(): void {
    if (this.current) {
      this.current.pause();
      this.current.src = '';
      this.current = null;
    }
    this.isSpeaking.set(false);
  }
}
