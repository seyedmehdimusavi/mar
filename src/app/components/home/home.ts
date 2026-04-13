import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuestionService } from '../../services/question.service';
import { PracticeService } from '../../services/practice.service';
import { PACKAGE_SIZES, DOMINANCE_COLORS } from '../../models/question.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private qs = inject(QuestionService);
  private ps = inject(PracticeService);
  private router = inject(Router);

  readonly packageSizes = PACKAGE_SIZES;
  readonly dominanceColors = DOMINANCE_COLORS;

  selectedPackage = signal(10);
  selectedCategories = signal<Set<string>>(new Set());

  readonly stats = this.qs.stats;
  readonly categoryNames = this.qs.categoryNames;

  readonly categoryStats = computed(() => {
    const qs = this.qs.questions();
    return this.categoryNames().map(cat => {
      const items = qs.filter(q => q.category === cat);
      const avgDom = items.length
        ? +(items.reduce((s, q) => s + q.dominance, 0) / items.length).toFixed(1)
        : 0;
      return { name: cat, count: items.length, avgDominance: avgDom };
    });
  });

  readonly canStart = computed(() =>
    this.selectedCategories().size > 0 &&
    this.qs.questions().filter(q => this.selectedCategories().has(q.category)).length > 0
  );

  readonly availableCount = computed(() =>
    this.qs.questions().filter(q => this.selectedCategories().has(q.category)).length
  );

  ngOnInit(): void {
    // Pre-select all categories
    this.selectedCategories.set(new Set(this.categoryNames()));
  }

  toggleCategory(cat: string): void {
    const s = new Set(this.selectedCategories());
    if (s.has(cat)) s.delete(cat);
    else s.add(cat);
    this.selectedCategories.set(s);
  }

  selectAll(): void {
    this.selectedCategories.set(new Set(this.categoryNames()));
  }

  selectNone(): void {
    this.selectedCategories.set(new Set());
  }

  startPractice(): void {
    const ok = this.ps.startSession([...this.selectedCategories()], this.selectedPackage());
    if (ok) this.router.navigate(['/practice']);
  }

  domColor(d: number): string {
    return DOMINANCE_COLORS[Math.round(d)] ?? DOMINANCE_COLORS[0];
  }

  get dominanceBarWidth(): string {
    return `${(this.stats().avgDominance / 6) * 100}%`;
  }
}
