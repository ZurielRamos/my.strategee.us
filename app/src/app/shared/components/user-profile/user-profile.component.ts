import { Component, OnInit, OnDestroy, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon, IonPopover, PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    chevronDownOutline, chevronUpOutline, personOutline, settingsOutline,
    logOutOutline, helpCircleOutline, notificationsOutline, shieldCheckmarkOutline, briefcaseOutline
} from 'ionicons/icons';
import { AuthService } from '../../../auth/services/auth.service';
import { AuthUser } from '../../../auth/models/auth.model';
import { Subscription } from 'rxjs';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss'],
    standalone: true,
    providers: [PopoverController],
    imports: [CommonModule, IonIcon, IonPopover]
})
export class UserProfileComponent implements OnInit, OnDestroy {

    private authService = inject(AuthService);
    private router = inject(Router);
    private popoverController = inject(PopoverController);
    private pushNotificationService = inject(PushNotificationService);

    @Input() hideTextOnMobile = false;

    currentUser: AuthUser | null = null;
    isLoggingOut = false;
    private cachedPosition: string | null = null;

    private userSub: Subscription | null = null;
    readonly uniqueId = 'user-profile-trigger-' + Math.random().toString(36).substring(2, 9);

    constructor() {
        addIcons({
            chevronDownOutline, chevronUpOutline, personOutline, settingsOutline,
            logOutOutline, helpCircleOutline, notificationsOutline, shieldCheckmarkOutline, briefcaseOutline
        });
    }

    ngOnInit(): void {
        this.userSub = this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.updateCachedPosition();
        });
    }

    ngOnDestroy(): void {
        this.userSub?.unsubscribe();
    }

    private updateCachedPosition(): void {
        const profile = this.currentUser?.profile;
        
        // Nueva estructura
        if (profile?.currentContract?.currentMemorandum?.position?.name) {
            this.cachedPosition = profile.currentContract.currentMemorandum.position.name;
            return;
        }
        
        // Estructura antigua (compatibilidad)
        // Intentar desde contract.memorandums
        if (profile?.contract?.memorandums && profile.contract.memorandums.length > 0) {
            const latestMemorandum = profile.contract.memorandums[0];
            if (latestMemorandum?.position?.name) {
                this.cachedPosition = latestMemorandum.position.name;
                return;
            }
        }
        
        // Intentar desde contracts array
        if (profile?.contracts && profile.contracts.length > 0) {
            const activeContract = profile.contracts[0];
            if (activeContract?.memorandums && activeContract.memorandums.length > 0) {
                const latestMemorandum = activeContract.memorandums[0];
                if (latestMemorandum?.position?.name) {
                    this.cachedPosition = latestMemorandum.position.name;
                    return;
                }
            }
        }
        
        this.cachedPosition = null;
    }

    get userInitials(): string {
        const profile = this.currentUser?.profile;
        
        // Nueva estructura
        if (profile?.employee?.firstName && profile?.employee?.lastName) {
            return (profile.employee.firstName.charAt(0) + profile.employee.lastName.charAt(0)).toUpperCase();
        }
        
        // Estructura antigua (compatibilidad)
        if (profile?.firstName && profile?.lastName) {
            return (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase();
        }
        
        if (!this.currentUser?.email) return '?';
        return this.currentUser.email.charAt(0).toUpperCase();
    }

    get profilePhotoUrl(): string {
        const profile = this.currentUser?.profile;
        
        // Nueva estructura
        if (profile?.employee?.profilePhoto?.url) {
            return profile.employee.profilePhoto.url;
        }
        
        // Estructura antigua (compatibilidad)
        if (profile?.profilePhoto?.url) {
            return profile.profilePhoto.url;
        }
        
        return '';
    }

    get hasProfilePhoto(): boolean {
        return !!this.profilePhotoUrl;
    }

    get userDisplayName(): string {
        const profile = this.currentUser?.profile;
        
        // Nueva estructura
        if (profile?.employee?.firstName && profile?.employee?.lastName) {
            const firstName = profile.employee.firstName.split(' ')[0];
            const lastName = profile.employee.lastName.split(' ')[0];
            return `${firstName} ${lastName}`;
        }
        
        // Estructura antigua (compatibilidad)
        if (profile?.firstName && profile?.lastName) {
            const firstName = profile.firstName.split(' ')[0];
            const lastName = profile.lastName.split(' ')[0];
            return `${firstName} ${lastName}`;
        }
        
        if (!this.currentUser?.email) return 'Usuario';
        const name = this.currentUser.email.split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    get userEmail(): string {
        return this.currentUser?.email ?? '';
    }

    get userRole(): string {
        // Usar el cargo cacheado si existe
        if (this.cachedPosition) {
            return this.cachedPosition;
        }
        
        // Fallback a roles si no hay cargo
        const roles = this.currentUser?.roles ?? [];
        const lowerRoles = roles.map(r => r.toLowerCase());
        if (lowerRoles.includes('admin')) return 'Administrador';
        if (lowerRoles.includes('employee')) return 'Empleado';
        return 'Usuario';
    }

    get isAdmin(): boolean {
        return this.currentUser?.roles?.some(r => r.toLowerCase() === 'admin') ?? false;
    }

    get currentArea(): 'admin' | 'employee' {
        return this.router.url.startsWith('/admin') ? 'admin' : 'employee';
    }

    async navigateTo(route: string): Promise<void> {
        console.log('[UserProfile] Attempting navigation to:', route);
        await this.popoverController.dismiss().catch(() => { });
        
        const result = await this.router.navigateByUrl(route);
        console.log('[UserProfile] Navigation result:', result);
        console.log('[UserProfile] Current URL after navigation:', this.router.url);
    }

    async logout(): Promise<void> {
        if (this.isLoggingOut) return;
        this.isLoggingOut = true;

        // Dismiss any lingering popovers before leaving the route
        await this.popoverController.dismiss().catch(() => { });

        // Deactivate push notification tokens before logout
        try {
            await this.pushNotificationService.onLogout();
        } catch (error) {
            console.error('Error deactivating push tokens:', error);
            // Continue with logout even if push notification cleanup fails
        }

        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/auth/login'], { replaceUrl: true });
            },
            error: () => {
                // Incluso si falla el endpoint, limpiar sesión local y redirigir
                this.router.navigate(['/auth/login'], { replaceUrl: true });
            }
        });
    }
}
