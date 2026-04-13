import { Injectable, signal } from '@angular/core';
import { AppSettings } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private synth = window.speechSynthesis;
  readonly isSpeaking = signal(false);
  readonly isSupported = !!window.speechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (this.isSupported) {
      // Voices load asynchronously on some browsers
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
      this.voices = this.synth.getVoices();
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length) this.voices = this.synth.getVoices();
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  speak(text: string, settings: AppSettings): void {
    if (!this.isSupported) return;
    this.stop();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = settings.rate;
    utt.pitch = settings.pitch;
    utt.volume = settings.volume;

    if (settings.voiceURI) {
      const voice = this.synth.getVoices().find(v => v.voiceURI === settings.voiceURI);
      if (voice) utt.voice = voice;
    }

    utt.onstart = () => this.isSpeaking.set(true);
    utt.onend = () => this.isSpeaking.set(false);
    utt.onerror = () => this.isSpeaking.set(false);

    // iOS Safari workaround — must be called in user-gesture context
    this.synth.speak(utt);
  }

  stop(): void {
    if (!this.isSupported) return;
    this.synth.cancel();
    this.isSpeaking.set(false);
  }
}
