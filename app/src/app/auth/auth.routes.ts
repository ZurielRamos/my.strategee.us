import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'onboarding',
        loadComponent: () => import('./onboarding/onboarding.page').then(m => m.OnboardingPage)
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  {
    path: 'set-password',
    loadComponent: () => import('./reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  }
];
