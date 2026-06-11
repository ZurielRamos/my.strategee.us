import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import { InitialGuard } from './auth/guards/initial.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.routes),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'employee',
    loadChildren: () => import('./employee/employee.routes').then(m => m.routes),
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'EMPLOYEE'] }
  },
  {
    path: 'help',
    loadComponent: () => import('./shared/pages/help/help.page').then(m => m.HelpPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./shared/pages/notifications/notifications.page').then(m => m.NotificationsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'reception-format/:token',
    loadComponent: () => import('./shared/pages/reception-format/reception-format.page').then(m => m.ReceptionFormatPage)
  },
  {
    path: '',
    canActivate: [InitialGuard],
    pathMatch: 'full',
    children: []
  },
  {
    path: '**',
    canActivate: [InitialGuard],
    children: []
  }
];
