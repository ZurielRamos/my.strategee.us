import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/employee-layout.component').then(m => m.EmployeeLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage)
            },
            {
                path: 'requests',
                loadComponent: () => import('./requests/requests.page').then(m => m.RequestsPage)
            },
            {
                path: 'requests/new',
                loadComponent: () => import('./requests/new-request/new-request.page').then(m => m.NewRequestPage)
            },
            {
                path: 'profile',
                loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
            },
            {
                path: 'settings',
                loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
            },
            {
                path: 'sessions',
                loadComponent: () => import('./sessions/sessions.page').then(m => m.SessionsPage)
            },
            {
                path: 'password-vault',
                loadChildren: () => import('./password-vault/password-vault.routes').then(m => m.passwordVaultRoutes)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
