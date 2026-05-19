import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

const THEME_KEY = 'app_theme';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentThemeSubject = new BehaviorSubject<Theme>('light');
    public currentTheme$ = this.currentThemeSubject.asObservable();

    constructor() {
        this.initializeTheme();
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
        // Actualizar el tema en el DOM
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        
        // Actualizar el subject
        this.currentThemeSubject.next(theme);

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
