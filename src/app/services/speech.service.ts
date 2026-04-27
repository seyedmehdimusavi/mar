import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private synth = window.speechSynthesis;
  readonly isSpeaking = signal(false);
  readonly isSupported = !!window.speechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (this.isSupported) {
      this.synth.onvoiceschanged = () => { this.voices = this.synth.getVoices(); };
      this.voices = this.synth.getVoices();
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length) this.voices = this.synth.getVoices();
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  speak(text: string): void {
    if (!this.isSupported) return;
    this.stop();
    const utt = new SpeechSynthesisUtterance(text);
    utt.onstart = () => this.isSpeaking.set(true);
    utt.onend = () => this.isSpeaking.set(false);
    utt.onerror = () => this.isSpeaking.set(false);
    this.synth.speak(utt);
  }

  stop(): void {
    if (!this.isSupported) return;
    this.synth.cancel();
    this.isSpeaking.set(false);
  }
}
