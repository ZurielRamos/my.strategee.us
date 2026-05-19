import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationsMenuService {
    private toggleMenuSubject = new Subject<void>();
    
    toggleMenu$ = this.toggleMenuSubject.asObservable();

    toggleMenu() {
        this.toggleMenuSubject.next();
    }
}
