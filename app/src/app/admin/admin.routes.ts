import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage)
            },
            {
                path: 'organization',
                loadComponent: () => import('./organization/organization.page').then(m => m.OrganizationPage)
            },
            {
                path: 'organization/companies',
                loadComponent: () => import('./organization/companies/companies.page').then(m => m.CompaniesPage)
            },
            {
                path: 'organization/locations',
                loadComponent: () => import('./organization/locations/locations.page').then(m => m.LocationsPage)
            },
            {
                path: 'organization/schedules',
                loadComponent: () => import('./organization/schedules/schedules.page').then(m => m.SchedulesPage)
            },
            {
                path: 'organization/positions',
                loadComponent: () => import('./organization/positions/positions.page').then(m => m.PositionsPage)
            },
            {
                path: 'organization/areas',
                loadComponent: () => import('./organization/areas/areas.page').then(m => m.AreasPage)
            },
            {
                path: 'employees',
                loadComponent: () => import('./employees/employees.page').then(m => m.EmployeesPage)
            },
            {
                path: 'employees/:id',
                loadComponent: () => import('./employees/employee-detail/employee-detail.page').then(m => m.EmployeeDetailPage)
            },
            {
                path: 'media',
                loadComponent: () => import('./media/media.page').then(m => m.MediaPage)
            },
            {
                path: 'finance',
                loadComponent: () => import('./finance/finance.page').then(m => m.FinancePage)
            },
            {
                path: 'finance/global-parameters',
                loadComponent: () => import('./finance/global-parameters/global-parameters.page').then(m => m.GlobalParametersPage)
            },
            {
                path: 'requests',
                loadComponent: () => import('./requests/requests.page').then(m => m.AdminRequestsPage)
            },
            {
                path: 'settings',
                loadComponent: () => import('./settings/settings.page').then(m => m.AdminSettingsPage)
            },
            {
                path: 'trainings',
                loadComponent: () => import('./trainings/trainings.page').then(m => m.TrainingsPage)
            },
            {
                path: 'trainings/:id',
                loadComponent: () => import('./trainings/training-detail/training-detail.page').then(m => m.TrainingDetailPage)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
