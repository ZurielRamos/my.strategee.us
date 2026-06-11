import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./inventory.page').then(m => m.InventoryPage)
    },
    {
        path: 'types',
        loadComponent: () => import('./pages/type-inventories/type-inventories.page').then(m => m.TypeInventoriesPage)
    },
    {
        path: 'suppliers',
        loadComponent: () => import('./pages/suppliers/suppliers.page').then(m => m.SuppliersPage)
    },
    {
        path: 'hardwares',
        loadComponent: () => import('./pages/hardwares/hardwares.page').then(m => m.HardwaresPage)
    },
    {
        path: 'softwares',
        loadComponent: () => import('./pages/softwares/softwares.page').then(m => m.SoftwaresPage)
    },
    {
        path: 'additional-elements',
        loadComponent: () => import('./pages/additional-elements/additional-elements.page').then(m => m.AdditionalElementsPage)
    },
    {
        path: 'assets',
        loadComponent: () => import('./pages/inventories/inventories.page').then(m => m.InventoriesPage)
    },
    {
        path: 'assets/:id',
        loadComponent: () => import('./pages/inventory-detail/inventory-detail.page').then(m => m.InventoryDetailPage)
    },
    {
        path: 'allocations',
        loadComponent: () => import('./pages/allocations/allocations.page').then(m => m.AllocationsPage)
    },
    {
        path: 'allocations/:id',
        loadComponent: () => import('./pages/allocation-detail/allocation-detail.page').then(m => m.AllocationDetailPage)
    }
];
