import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionService } from '../../services/question.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  private qs = inject(QuestionService);

  resetConfirm = signal(false);

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
