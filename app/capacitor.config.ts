import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mystrategee.app',
  appName: 'My Strategee',
  webDir: '../api/app/www',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com']
    }
  }
};

export default config;
