import { Capacitor } from '@capacitor/core';

export const environment = {
  production: true,
  // En web la API se sirve desde el mismo dominio; en la app nativa hay que usar la URL absoluta.
  apiUrl: Capacitor.isNativePlatform() ? 'https://i.strategee.us/api/v1' : '/api/v1',
  // Cliente OAuth "Web" del proyecto de Firebase (Google Workspace en web)
  googleWebClientId: '488463410625-9f1ak5be7jl8ubgpk7n92pab2gjp1e2l.apps.googleusercontent.com',
  firebase: {
    apiKey: 'AIzaSyDh68L51KpRpb3q2_OGrMd0QfV2vfqgYUU',
    authDomain: 'mystrategee-c7c1d.firebaseapp.com',
    projectId: 'mystrategee-c7c1d',
    storageBucket: 'mystrategee-c7c1d.firebasestorage.app',
    messagingSenderId: '488463410625',
    appId: '1:488463410625:web:1e9b6c0253836c7cb43b40',
    vapidKey: 'BK7uLgbnKIYK1BuEamikTNX2F86HD6m67gAcHeBuF5f65Mc5FJ3EzGJi5l84fI1J-w2lpq-U7gtQPYTI_scAUZo'
  }
};
