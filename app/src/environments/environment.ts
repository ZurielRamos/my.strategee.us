// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3030/api/v1',
  firebase: {
    apiKey: "AIzaSyDh68L51KpRpb3q2_OGrMd0QfV2vfqgYUU",
    authDomain: "mystrategee-c7c1d.firebaseapp.com",
    projectId: "mystrategee-c7c1d",
    storageBucket: "mystrategee-c7c1d.firebasestorage.app",
    messagingSenderId: "488463410625",
    appId: "1:488463410625:web:1e9b6c0253836c7cb43b40",
    vapidKey: 'BK7uLgbnKIYK1BuEamikTNX2F86HD6m67gAcHeBuF5f65Mc5FJ3EzGJi5l84fI1J-w2lpq-U7gtQPYTI_scAUZo' // TODO: Generar VAPID Key en Firebase Console > Project Settings > Cloud Messaging
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
