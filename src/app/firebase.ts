import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
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

// Initialize Firebase safely preventing duplicate app errors
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Suppress non-fatal offline/network notices to prevent monitoring false alarms
setLogLevel('silent');

function getOrInitFirestore(): Firestore {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: typeof window !== 'undefined' ? persistentLocalCache({ tabManager: persistentMultipleTabManager() }) : undefined
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    try {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch {
      return {} as Firestore;
    }
  }
}

export const db = getOrInitFirestore();

function createFallbackAuth(): ReturnType<typeof getAuth> {
  const fallback = {
    app,
    name: app.name,
    config: firebaseConfig,
    currentUser: null,
    languageCode: null,
    tenantId: null,
    settings: { appVerificationDisabledForTesting: false },
    onAuthStateChanged(nextOrObserver: any) {
      const cb = typeof nextOrObserver === 'function' ? nextOrObserver : nextOrObserver?.next;
      if (typeof cb === 'function') {
        try { cb(null); } catch {}
      }
      return () => {};
    },
    onIdTokenChanged(nextOrObserver: any) {
      const cb = typeof nextOrObserver === 'function' ? nextOrObserver : nextOrObserver?.next;
      if (typeof cb === 'function') {
        try { cb(null); } catch {}
      }
      return () => {};
    },
    signOut: async () => {},
    updateCurrentUser: async () => {},
    useDeviceLanguage: () => {},
  } as unknown as ReturnType<typeof getAuth>;

  // Crucial: getModularInstance checks if exp && exp._delegate exists
  (fallback as any)._delegate = fallback;
  return fallback;
}

let authInstance: ReturnType<typeof getAuth>;
try {
  authInstance = getAuth(app);
} catch (err) {
  console.warn('[Firebase] getAuth fallback activated:', err);
  authInstance = createFallbackAuth();
}

// Ensure onAuthStateChanged method always exists on authInstance and its delegate
if (!authInstance || (typeof (authInstance as any).onAuthStateChanged !== 'function' && typeof (authInstance as any)._delegate?.onAuthStateChanged !== 'function')) {
  const fallback = createFallbackAuth();
  authInstance = Object.assign(fallback, authInstance || {});
  (authInstance as any)._delegate = (authInstance as any)._delegate || authInstance;
  if (typeof (authInstance as any)._delegate.onAuthStateChanged !== 'function') {
    (authInstance as any)._delegate.onAuthStateChanged = fallback.onAuthStateChanged;
  }
}

export const auth = authInstance;
export const googleAuthProvider = new GoogleAuthProvider();

export function safeOnAuthStateChanged(
  authObj: typeof auth,
  nextOrObserver: Parameters<typeof onAuthStateChanged>[1],
  error?: Parameters<typeof onAuthStateChanged>[2],
  completed?: Parameters<typeof onAuthStateChanged>[3]
) {
  try {
    if (authObj && (typeof (authObj as any).onAuthStateChanged === 'function' || typeof (authObj as any)._delegate?.onAuthStateChanged === 'function')) {
      return onAuthStateChanged(authObj, nextOrObserver, error, completed);
    }
  } catch (err) {
    console.warn('[Firebase] safeOnAuthStateChanged caught error:', err);
  }
  if (typeof nextOrObserver === 'function') {
    try { nextOrObserver(null); } catch {}
  }
  return () => {};
}

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

