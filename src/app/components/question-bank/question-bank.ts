import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { Question, DOMINANCE_LABELS, DOMINANCE_COLORS } from '../../models/question.model';
import { QuestionFormComponent } from '../question-form/question-form';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, QuestionFormComponent],
  templateUrl: './question-bank.html',
  styleUrl: './question-bank.scss',
})
export class QuestionBankComponent {
  private qs = inject(QuestionService);

  filterCategory = signal<string>('All');
  filterDominance = signal<number>(-1); // -1 = all
  searchText = signal('');
  editingQuestion = signal<Question | null>(null);
  showForm = signal(false);
  sortBy = signal<'dominance' | 'lastTried' | 'practiceCount'>('dominance');

  readonly categories = computed(() => ['All', ...this.qs.categoryNames()]);
  readonly dominanceLabels = DOMINANCE_LABELS;
  readonly dominanceColors = DOMINANCE_COLORS;

  readonly filteredQuestions = computed(() => {
    const cat = this.filterCategory();
    const dom = this.filterDominance();
    const text = this.searchText().toLowerCase();
    const sort = this.sortBy();

    let list = this.qs.questions().filter(q => {
      if (cat !== 'All' && q.category !== cat) return false;
      if (dom >= 0 && q.dominance !== dom) return false;
      if (text && !q.question.toLowerCase().includes(text) &&
          !q.answers.some(a => a.toLowerCase().includes(text))) return false;
      return true;
    });

    if (sort === 'dominance') list = [...list].sort((a, b) => a.dominance - b.dominance);
    else if (sort === 'lastTried') list = [...list].sort((a, b) => {
      if (!a.lastTried) return -1;
      if (!b.lastTried) return 1;
      return new Date(a.lastTried).getTime() - new Date(b.lastTried).getTime();
    });
    else if (sort === 'practiceCount') list = [...list].sort((a, b) => a.practiceCount - b.practiceCount);

    return list;
  });

  openAdd(): void {
    this.editingQuestion.set(null);
    this.showForm.set(true);
  }

  openEdit(q: Question): void {
    this.editingQuestion.set(q);
    this.showForm.set(true);
  }

  delete(q: Question): void {
    if (confirm(`Delete "${q.question}"?`)) {
      this.qs.deleteQuestion(q.id);
    }
  }

  onFormSave(data: { question: string; answers: string[]; category: string }): void {
    const editing = this.editingQuestion();
    if (editing) {
      this.qs.updateQuestion(editing.id, data);
    } else {
      this.qs.addQuestion(data);
    }
    this.showForm.set(false);
  }

  onFormCancel(): void {
    this.showForm.set(false);
  }

  domLabel(d: number): string { return DOMINANCE_LABELS[d] ?? ''; }
  domColor(d: number): string { return DOMINANCE_COLORS[d] ?? DOMINANCE_COLORS[0]; }

  formatDate(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }
}
