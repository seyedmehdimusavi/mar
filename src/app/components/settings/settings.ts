import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { SpeechService } from '../../services/speech.service';
import { AppSettings } from '../../models/question.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private qs = inject(QuestionService);
  private speech = inject(SpeechService);

  settings = signal<AppSettings>({ ...this.qs.settings() });
  voices = signal<SpeechSynthesisVoice[]>([]);
  testPlaying = signal(false);
  resetConfirm = signal(false);

  readonly isSpeechSupported = this.speech.isSupported;

  ngOnInit(): void {
    // Load voices (may need a small delay for some browsers)
    setTimeout(() => {
      this.voices.set(this.speech.getVoices());
    }, 200);
  }

  updateRate(val: string): void {
    this.settings.update(s => ({ ...s, rate: +val }));
    this.save();
  }

  updatePitch(val: string): void {
    this.settings.update(s => ({ ...s, pitch: +val }));
    this.save();
  }

  updateVolume(val: string): void {
    this.settings.update(s => ({ ...s, volume: +val }));
    this.save();
  }

  updateVoice(uri: string): void {
    this.settings.update(s => ({ ...s, voiceURI: uri || null }));
    this.save();
  }

  toggleAutoPlay(field: 'autoPlayQuestion' | 'autoPlayAnswer'): void {
    this.settings.update(s => ({ ...s, [field]: !s[field] }));
    this.save();
  }

  testSpeech(): void {
    this.speech.speak("Hello! How are you doing today? I'm practicing my English conversation skills.", this.settings());
  }

  stopTest(): void {
    this.speech.stop();
  }

  save(): void {
    this.qs.saveSettings(this.settings());
  }

  resetProgress(): void {
    if (!this.resetConfirm()) {
      this.resetConfirm.set(true);
      setTimeout(() => this.resetConfirm.set(false), 3000);
      return;
    }
    this.qs.resetAllProgress();
    this.resetConfirm.set(false);
  }

  exportData(): void {
    const data = this.qs.exportQuestions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-practice-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const questions = JSON.parse(e.target?.result as string);
        if (Array.isArray(questions)) {
          this.qs.importQuestions(questions);
          alert(`Imported ${questions.length} questions.`);
        }
      } catch {
        alert('Invalid file format.');
      }
    };
    reader.readAsText(file);
  }

  readonly isSpeaking = this.speech.isSpeaking;
}
