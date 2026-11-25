import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, catchError, throwError, BehaviorSubject, switchMap, map } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';
import { AuthResponse, AuthUser, RefreshResponse, SignInRequest } from '../models/auth.model';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = environment.apiUrl;

    /** Estado reactivo del usuario autenticado. null = no autenticado. */
    private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

    /** Observable público para suscribirse al usuario actual en toda la app. */
    currentUser$ = this.currentUserSubject.asObservable();

    /**
     * Promise que resuelve cuando el storage ya fue leído.
     * Los guards DEBEN awaitar esto antes de leer isAuthenticated().
     */
    readonly storageReady: Promise<void>;

    constructor(private http: HttpClient) {
        // Inicializar Firebase si no está inicializado
        const firebaseApp = getApps().length ? getApp() : initializeApp(environment.firebase);
        this._firebaseAuth = getAuth(firebaseApp);

        // Al iniciar la app, restauramos el usuario desde el storage persistente.
        // Guardamos la Promise para que los guards puedan esperarla.
        this.storageReady = this.loadUserFromStorage();
    }

    /** Instancia de Firebase Auth */
    private _firebaseAuth: ReturnType<typeof getAuth>;

    // ─────────────────────────────────────────────────────────────────────────
    // Auth endpoints
    // ─────────────────────────────────────────────────────────────────────────

    checkEmail(email: string): Observable<{ exists: boolean }> {
        return this.http.post<{ exists: boolean }>(`${this.apiUrl}/auth/check-email`, { email }).pipe(
            catchError((error) => {
                const message = error?.error?.message || 'Correo no registrado';
                return throwError(() => new Error(message));
            })
        );
    }

    signIn(email: string, password: string): Observable<AuthResponse> {
        const payload: SignInRequest = { email, password };
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/sign-in`, payload).pipe(
            switchMap((response) =>
                from(this.storeTokens(response.accessToken, response.refreshToken)).pipe(
                    switchMap(() => {
                        if (response.user.employeeId) {
                            return this.http.get<any>(`${this.apiUrl}/employees/profile`).pipe(
                                map(profile => {
                                    console.log('User profile loaded:', profile);
                                    response.user.profile = profile;
                                    return response;
                                }),
                                catchError((profileError) => {
                                    console.error('Error fetching user profile during sign-in', profileError);
                                    return from([response]);
                                })
                            );
                        }
                        return from([response]);
                    }),
                    switchMap(updatedResponse =>
                        from(this.storeUser(updatedResponse.user)).pipe(map(() => updatedResponse))
                    )
                )
            ),
            catchError((error) => {
                const message = error?.error?.message || 'Error al iniciar sesión';
                return throwError(() => new Error(message));
            })
        );
    }

    /**
     * En Android/iOS usa el selector nativo de cuentas de Google y luego
     * autentica el SDK web de Firebase con ese credential. En web usa popup.
     */
    private async getGoogleFirebaseUser() {
        if (!Capacitor.isNativePlatform()) {
            const result = await signInWithPopup(this._firebaseAuth, new GoogleAuthProvider());
            return result.user;
        }
        const native = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
        const idToken = native.credential?.idToken;
        if (!idToken) {
            throw new Error('No se pudo obtener el token de Google');
        }
        const result = await signInWithCredential(this._firebaseAuth, GoogleAuthProvider.credential(idToken));
        return result.user;
    }

    /**
     * Inicia sesión con Google usando Firebase Authentication.
     * Solo permite el acceso si el correo está registrado como usuario activo.
     */
    signInWithGoogle(): Observable<AuthResponse> {
        return from(this.getGoogleFirebaseUser()).pipe(
            switchMap((user) => from(user.getIdToken()).pipe(
                switchMap((idToken) =>
                    this.http.post<AuthResponse>(`${this.apiUrl}/auth/google`, { idToken }).pipe(
                        switchMap((response) =>
                            from(this.storeTokens(response.accessToken, response.refreshToken)).pipe(
                                switchMap(() => {
                                    if (response.user.employeeId) {
                                        return this.http.get<any>(`${this.apiUrl}/employees/profile`).pipe(
                                            map(profile => {
                                                response.user.profile = profile;
                                                return response;
                                            }),
                                            catchError(() => from([response]))
                                        );
                                    }
                                    return from([response]);
                                }),
                                switchMap(updatedResponse =>
                                    from(this.storeUser(updatedResponse.user)).pipe(map(() => updatedResponse))
                                )
                            )
                        )
                    )
                )
            )),
            catchError((error) => {
                // Cerrar sesión de Firebase para no dejar estado inconsistente
                firebaseSignOut(this._firebaseAuth).catch(() => { });
                const message = error?.error?.message || error?.message || 'Error al iniciar sesión con Google';
                return throwError(() => new Error(message));
            })
        );
    }

    forgotPassword(email: string): Observable<any> {        return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
            catchError((error) => {
                const message = error?.error?.message || 'Error al enviar el correo';
                return throwError(() => new Error(message));
            })
        );
    }

    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword }).pipe(
            catchError((error) => {
                let message = 'Error al restablecer la contraseña';
                if (error?.error?.message) {
                    message = Array.isArray(error.error.message)
                        ? error.error.message[0]
                        : error.error.message;
                }
                return throwError(() => new Error(message));
            })
        );
    }

    refreshTokens(): Observable<RefreshResponse> {
        return from(Preferences.get({ key: REFRESH_TOKEN_KEY })).pipe(
            switchMap(({ value: refreshToken }) =>
                this.http.post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
                    switchMap((response) =>
                        from(this.storeTokens(response.accessToken, response.refreshToken)).pipe(map(() => response))
                    ),
                    catchError((error) => {
                        return from(this.clearSession()).pipe(
                            switchMap(() => throwError(() => error))
                        );
                    })
                )
            )
        );
    }

    logout(): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
            switchMap(() => from(this.clearSession())),
            catchError((error) =>
                from(this.clearSession()).pipe(
                    switchMap(() => throwError(() => error))
                )
            )
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Estado del usuario (síncrono + reactivo)
    // ─────────────────────────────────────────────────────────────────────────

    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    /**
     * Devuelve el token de acceso de forma síncrona.
     * Usa el valor cacheado en memoria para compatibilidad con guards e interceptors síncronos.
     */
    getAccessToken(): string | null {
        return this._accessTokenCache;
    }

    /**
     * Retorna el usuario actual de forma síncrona desde el BehaviorSubject.
     */
    getCurrentUser(): AuthUser | null {
        return this.currentUserSubject.getValue();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Persistencia multiplataforma (web + Android + iOS)
    // ─────────────────────────────────────────────────────────────────────────

    /** Cache en memoria del token de acceso para acceso síncrono en guards/interceptors */
    private _accessTokenCache: string | null = null;

    /** Carga el usuario y tokens desde Capacitor Preferences al arrancar la app */
    private async loadUserFromStorage(): Promise<void> {
        try {
            const [tokenResult, userResult] = await Promise.all([
                Preferences.get({ key: ACCESS_TOKEN_KEY }),
                Preferences.get({ key: USER_KEY }),
            ]);

            this._accessTokenCache = tokenResult.value;

            if (userResult.value) {
                const user: AuthUser = JSON.parse(userResult.value);
                this.currentUserSubject.next(user);
            }
        } catch (err) {
            console.error('[AuthService] Error cargando sesión desde storage:', err);
        }
    }

    // Optional helper if we still want storeSession, else we just remove it:
    private async storeSession(response: AuthResponse): Promise<void> {
        await this.storeTokens(response.accessToken, response.refreshToken);
        await this.storeUser(response.user);
    }

    private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
        this._accessTokenCache = accessToken;
        await Promise.all([
            Preferences.set({ key: ACCESS_TOKEN_KEY, value: accessToken }),
            Preferences.set({ key: REFRESH_TOKEN_KEY, value: refreshToken }),
        ]);
    }

    private async storeUser(user: AuthUser): Promise<void> {
        this.currentUserSubject.next(user);
        await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
    }

    private async clearSession(): Promise<void> {
        this._accessTokenCache = null;
        this.currentUserSubject.next(null);
        await Promise.all([
            Preferences.remove({ key: ACCESS_TOKEN_KEY }),
            Preferences.remove({ key: REFRESH_TOKEN_KEY }),
            Preferences.remove({ key: USER_KEY }),
        ]);
    }

    /**
     * Refresca el perfil del usuario actual desde el servidor
     */
    refreshUserProfile(): Observable<AuthUser> {
        const currentUser = this.getCurrentUser();
        if (!currentUser?.employeeId) {
            return throwError(() => new Error('No hay usuario autenticado con employeeId'));
        }

        return this.http.get<any>(`${this.apiUrl}/employees/profile`).pipe(
            switchMap(profile => {
                const updatedUser = { ...currentUser, profile };
                return from(this.storeUser(updatedUser)).pipe(map(() => updatedUser));
            }),
            catchError((error) => {
                console.error('Error refreshing user profile:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Cambia la contraseña del usuario actual
     */
    changePassword(currentPassword: string, newPassword: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/change-password`, {
            currentPassword,
            newPassword
        }).pipe(
            catchError((error) => {
                const message = error?.error?.message || 'Error al cambiar la contraseña';
                return throwError(() => new Error(message));
            })
        );
    }
}
