import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseProjectId = (typeof process !== 'undefined' ? process.env?.FIREBASE_PROJECT_ID : undefined) || 'local-academic-project';
const firebaseDatabaseId = (typeof process !== 'undefined' ? process.env?.FIREBASE_DATABASE_ID : undefined) || undefined;

if (!getApps().length) {
  initializeApp({
    projectId: firebaseProjectId,
  });
}

export const adminAuth = getAuth();
export const adminDb = firebaseDatabaseId ? getFirestore(firebaseDatabaseId) : getFirestore();
