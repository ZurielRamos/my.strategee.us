import { Routes } from '@angular/router';

export const passwordVaultRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tree-view/tree-view.page').then(m => m.TreeViewPage)
  },
  // Legacy routes for backward compatibility
  {
    path: 'vaults',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'credentials',
    redirectTo: '',
    pathMatch: 'full'
  }
];
