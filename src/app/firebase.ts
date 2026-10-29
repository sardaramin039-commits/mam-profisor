import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "annular-xenolalia-x71nt",
  appId: "1:314215250661:web:7d19eaa38f22bd3d70f20c",
  apiKey: "AIzaSyCrnT3-6AS8Rpsd6sqa-mV2A-MpT5gONes",
  authDomain: "annular-xenolalia-x71nt.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-3984862a-e9c8-44c7-b050-ed211c9fa922",
  storageBucket: "annular-xenolalia-x71nt.firebasestorage.app",
  messagingSenderId: "314215250661",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Suppress non-fatal offline/network notices to prevent monitoring false alarms
setLogLevel('silent');

function getOrInitFirestore(): Firestore {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: typeof window !== 'undefined' ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : undefined
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = getOrInitFirestore();
export const auth = getAuth();
export const googleAuthProvider = new GoogleAuthProvider();

// Error Handling Invariants
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

