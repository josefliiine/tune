import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from './serviceAccountKey.json'; // Justera sökvägen om nödvändigt
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
} else {
  console.log('Firebase admin already initialized');
}

export default admin;