import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/auth/interceptors/auth.interceptor';

const isNative = Capacitor.isNativePlatform();

// En la app nativa los archivos ya vienen dentro del APK. Un service worker
// solo serviría builds viejos desde caché, así que lo eliminamos si existe.
if (isNative && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((reg) => reg.unregister()))
    .catch(() => { });
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !isNative,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
