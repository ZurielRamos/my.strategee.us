import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TrainingsEmployeeService } from '../services/trainings-employee.service';

@Injectable({ providedIn: 'root' })
export class MandatoryTrainingGuard implements CanActivate {
    constructor(
        private trainingsService: TrainingsEmployeeService,
        private router: Router
    ) {}

    canActivate(): Observable<boolean | UrlTree> {
        return this.trainingsService.getMyTrainings().pipe(
            map((trainings) => {
                const hasBlockingTraining = trainings.some(
                    (t) =>
                        t.training.isMandatory &&
                        t.training.status === 'active' &&
                        t.assignment.status !== 'completed'
                );

                if (hasBlockingTraining) {
                    return this.router.createUrlTree(['/employee/trainings']);
                }

                return true;
            }),
            catchError(() => {
                // Si falla la consulta, permitir el acceso para no bloquear al usuario
                return of(true);
            })
        );
    }
}
