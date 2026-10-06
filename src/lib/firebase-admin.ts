import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json'; // Direct static import

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
const dbId = (firebaseConfig as Record<string, unknown>)['firestoreDatabaseId'] as string | undefined;
export const adminDb = dbId ? getFirestore(dbId) : getFirestore();
