import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question } from '../../models/question.model';
import { QuestionService } from '../../services/question.service';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-form.html',
  styleUrl: './question-form.scss',
})
export class QuestionFormComponent implements OnInit {
  @Input() question: Question | null = null;
  @Input() categories: string[] = [];
  @Output() save = new EventEmitter<{ question: string; answers: string[]; category: string }>();
  @Output() cancel = new EventEmitter<void>();

  private qs = inject(QuestionService);

  questionText = signal('');
  answers = signal<string[]>(['', '', '']);
  category = signal('');
  newCategory = signal('');
  useNewCategory = signal(false);

  readonly existingCategories = this.qs.categoryNames;

  ngOnInit(): void {
    if (this.question) {
      this.questionText.set(this.question.question);
      const ans = [...this.question.answers];
      // Pad to at least 3 slots
      while (ans.length < 3) ans.push('');
      this.answers.set(ans);
      this.category.set(this.question.category);
    } else {
      const cats = this.existingCategories();
      if (cats.length) this.category.set(cats[0]);
    }
  }

  updateAnswer(index: number, value: string): void {
    const arr = [...this.answers()];
    arr[index] = value;
    this.answers.set(arr);
  }

  addAnswer(): void {
    this.answers.update(a => [...a, '']);
  }

  removeAnswer(index: number): void {
    if (this.answers().length <= 1) return;
    this.answers.update(a => a.filter((_, i) => i !== index));
  }

  submit(): void {
    const q = this.questionText().trim();
    const rawAnswers = this.answers().map(a => a.trim()).filter(a => a.length > 0);
    const cat = this.useNewCategory() ? this.newCategory().trim() : this.category();
    if (!q || rawAnswers.length === 0 || !cat) return;
    this.save.emit({ question: q, answers: rawAnswers, category: cat });
  }

  get isValid(): boolean {
    const q = this.questionText().trim();
    const hasAnswer = this.answers().some(a => a.trim().length > 0);
    const cat = this.useNewCategory() ? this.newCategory().trim() : this.category();
    return q.length > 0 && hasAnswer && cat.length > 0;
  }
}
