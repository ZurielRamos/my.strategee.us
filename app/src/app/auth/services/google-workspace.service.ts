import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { environment } from 'src/environments/environment';

export interface GoogleWorkspaceStatus {
    eligible: boolean;
    connected: boolean;
    scopes: string[];
    missingScopes: string[];
    domain: string;
}

export type GoogleWorkspaceResult = 'not-eligible' | 'already-connected' | 'connected' | 'cancelled';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/**
 * Pide los permisos de Google Workspace (Calendar, Tasks, Docs, Drive) a los
 * usuarios del dominio y entrega el código de autorización al backend, que guarda
 * el refresh token. Los usuarios de otros dominios no ven la pantalla de permisos.
 */
@Injectable({
    providedIn: 'root'
})
export class GoogleWorkspaceService {
    private readonly apiUrl = `${environment.apiUrl}/google-workspace`;
    private gisLoader?: Promise<void>;

    constructor(private http: HttpClient) { }

    getStatus(): Promise<GoogleWorkspaceStatus> {
        return firstValueFrom(this.http.get<GoogleWorkspaceStatus>(`${this.apiUrl}/status`));
    }

    /** Indica si hay que pedir permisos: usuario del dominio sin todos los permisos concedidos. */
    needsAuthorization(status: GoogleWorkspaceStatus): boolean {
        return status.eligible && !status.connected;
    }

    /** En web carga Google Identity Services antes de que el usuario pulse el botón. */
    prepare(): Promise<void> {
        return Capacitor.isNativePlatform() ? Promise.resolve() : this.loadGis();
    }

    /**
     * Pide los permisos y envía el código de autorización al backend.
     * En web debe llamarse desde un clic del usuario para que el navegador no bloquee el popup.
     */
    async authorize(status: GoogleWorkspaceStatus, email: string): Promise<GoogleWorkspaceResult> {
        if (!status.eligible) {
            return 'not-eligible';
        }
        if (status.connected) {
            return 'already-connected';
        }

        const authorization = Capacitor.isNativePlatform()
            ? await this.requestNativeCode(status.scopes)
            : await this.requestWebCode(status.scopes, email, status.domain);

        if (!authorization) {
            return 'cancelled';
        }

        await firstValueFrom(this.http.post<GoogleWorkspaceStatus>(`${this.apiUrl}/connect`, authorization));
        return 'connected';
    }

    /** Android/iOS: selector nativo + pantalla de permisos. Devuelve el serverAuthCode. */
    private async requestNativeCode(scopes: string[]): Promise<{ code: string; redirectUri: '' } | null> {
        let code: string | undefined;
        try {
            const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true, scopes });
            code = result.credential?.serverAuthCode;
        } catch {
            return null; // El usuario cerró el selector o rechazó los permisos.
        }
        if (!code) {
            // El plugin no devuelve el código cuando Google ya tenía los permisos concedidos
            // (por ejemplo, si se borró la autorización en el servidor).
            throw new Error('Google no devolvió el código de autorización. Quita el acceso de My Strategee en tu cuenta de Google y vuelve a iniciar sesión.');
        }
        return { code, redirectUri: '' };
    }

    /** Web: popup de Google Identity Services (code flow). */
    private async requestWebCode(
        scopes: string[],
        email: string,
        domain: string,
    ): Promise<{ code: string; redirectUri: 'postmessage' } | null> {
        await this.loadGis();
        const oauth2 = (window as any).google?.accounts?.oauth2;
        if (!oauth2) {
            return null;
        }
        return new Promise((resolve) => {
            const client = oauth2.initCodeClient({
                client_id: environment.googleWebClientId,
                scope: scopes.join(' '),
                ux_mode: 'popup',
                login_hint: email,
                hd: domain,
                include_granted_scopes: true,
                callback: (response: { code?: string; error?: string }) =>
                    resolve(response.code ? { code: response.code, redirectUri: 'postmessage' } : null),
                error_callback: () => resolve(null),
            });
            client.requestCode();
        });
    }

    private loadGis(): Promise<void> {
        if ((window as any).google?.accounts?.oauth2) {
            return Promise.resolve();
        }
        this.gisLoader ??= new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GIS_SCRIPT_URL;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                this.gisLoader = undefined;
                reject(new Error('No se pudo cargar Google Identity Services'));
            };
            document.head.appendChild(script);
        });
        return this.gisLoader;
    }
}
