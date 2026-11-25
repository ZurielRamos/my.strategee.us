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
                path: 'calendar',
                loadChildren: () => import('./calendar/calendar.routes').then(m => m.calendarRoutes)
            },
            {
                path: 'minutes',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./minutes/minutes.page').then(m => m.MinutesPage)
            },
            {
                path: 'minutes/:id',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./minutes/minute-detail/minute-detail.page').then(m => m.MinuteDetailPage)
            },
            {
                path: 'minutes/:id/edit',
                canActivate: [MandatoryTrainingGuard],
                loadComponent: () => import('./minutes/edit-minute/edit-minute.page').then(m => m.EditMinutePage)
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
