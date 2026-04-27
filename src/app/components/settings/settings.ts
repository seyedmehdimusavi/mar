import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { AppSettings } from '../../models/question.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private qs = inject(QuestionService);

  settings = signal<AppSettings>({ ...this.qs.settings() });
  resetConfirm = signal(false);

  toggleAutoPlay(field: 'autoPlayQuestion' | 'autoPlayAnswer'): void {
    this.settings.update(s => ({ ...s, [field]: !s[field] }));
    this.save();
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
}
