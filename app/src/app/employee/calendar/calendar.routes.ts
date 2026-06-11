import { Routes } from '@angular/router';
import { MandatoryTrainingGuard } from '../trainings/guards/mandatory-training.guard';

export const calendarRoutes: Routes = [
    {
        path: '',
        canActivate: [MandatoryTrainingGuard],
        loadComponent: () => import('./calendar.page').then(m => m.CalendarPage)
    },
    {
        path: 'event/:id',
        loadComponent: () => import('./event-detail/event-detail.page').then(m => m.EventDetailPage)
    },
    {
        path: 'create-minute',
        loadComponent: () => import('./create-minute/create-minute.page').then(m => m.CreateMinutePage)
    }
];
