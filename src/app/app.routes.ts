import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'practice',
    loadComponent: () => import('./components/practice/practice').then(m => m.PracticeComponent),
  },
  {
    path: 'questions',
    loadComponent: () => import('./components/question-bank/question-bank').then(m => m.QuestionBankComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: '' },
];
