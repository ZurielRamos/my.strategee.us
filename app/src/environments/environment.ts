// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  firebase: {
    apiKey: 'AIzaSyDPvplJ0Z1KaYMa9krgAUTCkSUFAHOd3ls', // TODO: Reemplazar con la API Key real de Firebase Console
    authDomain: 'mystrategee.firebaseapp.com',
    projectId: 'mystrategee',
    storageBucket: 'mystrategee.firebasestorage.app',
    messagingSenderId: '239139202787', // TODO: Reemplazar con el Sender ID real de Firebase Console
    appId: '1:239139202787:web:e804ebca2ccde9dc6107d6', // TODO: Reemplazar con el App ID real de Firebase Console
    vapidKey: 'BAXjZgnBbtRg4-LTsP-VAlCcdZFVGTGo3xwGYGKj5u47p_govJl4V5cNCF0XbFUtPYcT1h-kGJDbtg9MkPhVCss' // TODO: Generar VAPID Key en Firebase Console > Project Settings > Cloud Messaging
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
