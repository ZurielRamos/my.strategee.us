import { Routes } from '@angular/router';
import { MandatoryTrainingGuard } from './trainings/guards/mandatory-training.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/employee-layout.component').then(m => m.EmployeeLayoutComponent),
        children: [
            {
                path: 'dashboard',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage)
            },
            {
                path: 'requests',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./requests/requests.page').then(m => m.RequestsPage)
            },
            {
                path: 'requests/new',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./requests/new-request/new-request.page').then(m => m.NewRequestPage)
            },
            {
                path: 'profile',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
            },
            {
                path: 'settings',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
            },
            {
                path: 'sessions',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./sessions/sessions.page').then(m => m.SessionsPage)
            },
            {
                path: 'password-vault',
                canActivate: [MandatoryTrainingGuard],
                loadChildren: () => import('./password-vault/password-vault.routes').then(m => m.passwordVaultRoutes)
            },
            {
                path: 'trainings',
                loadComponent: () => import('./trainings/trainings.page').then(m => m.EmployeeTrainingsPage)
            },
            {
                path: 'trainings/:id',
                loadComponent: () => import('./trainings/training-player/training-player.page').then(m => m.TrainingPlayerPage)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
