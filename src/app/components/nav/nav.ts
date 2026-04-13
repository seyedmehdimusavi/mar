import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PracticeService } from '../../services/practice.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class NavComponent {
  private router = inject(Router);
  private ps = inject(PracticeService);

  readonly activeRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isPracticeActive = this.ps.isActive;

  tabs = [
    { path: '/',          label: 'Home',     icon: '🏠' },
    { path: '/practice',  label: 'Practice', icon: '🗣️' },
    { path: '/questions', label: 'Questions', icon: '📚' },
    { path: '/settings',  label: 'Settings', icon: '⚙️' },
  ];

  isActive(path: string): boolean {
    const current = this.activeRoute() ?? '';
    if (path === '/') return current === '/';
    return current.startsWith(path);
  }

  navigate(path: string): void {
    if (path === '/practice' && !this.isPracticeActive()) {
      this.router.navigate(['/']);
      return;
    }
    this.router.navigate([path]);
  }
}
