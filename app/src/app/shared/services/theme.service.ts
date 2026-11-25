import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

const THEME_KEY = 'app_theme';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentThemeSubject = new BehaviorSubject<Theme>('light');
    public currentTheme$ = this.currentThemeSubject.asObservable();

    // Tema elegido por el usuario (solo aplica fuera del panel admin)
    private userTheme: Theme = 'light';
    private forceLight = false;

    constructor(private router: Router) {
        this.forceLight = this.isAdminUrl(this.router.url || window.location.pathname);
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe(e => {
                this.forceLight = this.isAdminUrl(e.urlAfterRedirects);
                this.applyTheme(this.forceLight ? 'light' : this.userTheme);
            });
        this.initializeTheme();
    }

    private isAdminUrl(url: string): boolean {
        return url.startsWith('/admin');
    }

    private applyTheme(theme: Theme) {
        document.body.classList.remove('light', 'dark', 'ion-palette-dark');
        document.body.classList.add(theme);
        if (theme === 'dark') {
            document.body.classList.add('ion-palette-dark');
        }
        this.currentThemeSubject.next(theme);
    }

    private async initializeTheme() {
        try {
            const { value } = await Preferences.get({ key: THEME_KEY });
            const savedTheme = (value as Theme) || 'light';
            this.setTheme(savedTheme, false);
        } catch (error) {
            console.error('Error loading theme:', error);
            this.setTheme('light', false);
        }
    }

    async setTheme(theme: Theme, save: boolean = true) {
        this.userTheme = theme;
        // El panel admin siempre usa tema claro
        this.applyTheme(this.forceLight ? 'light' : theme);

        // Guardar en storage si se solicita
        if (save) {
            try {
                await Preferences.set({ key: THEME_KEY, value: theme });
            } catch (error) {
                console.error('Error saving theme:', error);
            }
        }
    }

    async toggleTheme() {
        const currentTheme = this.currentThemeSubject.getValue();
        const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
        await this.setTheme(newTheme);
    }

    getCurrentTheme(): Theme {
        return this.currentThemeSubject.getValue();
    }

    isDarkMode(): boolean {
        return this.currentThemeSubject.getValue() === 'dark';
    }
}
