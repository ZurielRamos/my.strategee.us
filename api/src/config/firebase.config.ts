import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => {
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    // Remove gs:// prefix if present
    const bucketName = storageBucket?.replace(/^gs:\/\//, '') || '';
    
    return {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        storageBucket: bucketName,
    };
});
