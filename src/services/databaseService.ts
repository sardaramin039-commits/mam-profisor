import { db, auth } from '../app/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Saves academic data securely into Firestore under the given collection.
 * Includes local storage fallbacks for offline resilience.
 */
export async function saveAcademicData(
  collectionPath: string,
  data: Record<string, unknown>
): Promise<void> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    await saveLocalFallback(collectionPath, data);
    return;
  }

  try {
    const docRefId = doc(collection(db, collectionPath)).id;
    const docRef = doc(db, collectionPath, docRefId);

    const payload = {
      ...data,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    };

    await setDoc(docRef, payload);
  } catch (error) {
    console.error('هەڵە لە پاشەکەوتکردنی داتا لە داتابەیس:', error);
    await saveLocalFallback(collectionPath, data);
  }
}

async function saveLocalFallback(
  collectionPath: string,
  data: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const fallbackKey = `local_fallback_${collectionPath}`;
    const existingData = JSON.parse(localStorage.getItem(fallbackKey) || '[]');

    const nextData = Array.isArray(existingData) ? existingData : [];
    nextData.unshift({
      ...data,
      processedAt: new Date().toISOString()
    });

    localStorage.setItem(fallbackKey, JSON.stringify(nextData.slice(0, 100)));
  } catch {
    try {
      if (!('indexedDB' in window)) return;

      const request = window.indexedDB.open('AcademicKurdishThesisDB', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('large_cache')) {
          database.createObjectStore('large_cache', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('large_cache')) {
          database.close();
          return;
        }

        const transaction = database.transaction(['large_cache'], 'readwrite');
        transaction.objectStore('large_cache').put({
          key: `fallback_${collectionPath}_${Date.now()}`,
          data,
          updatedAt: new Date().toISOString()
        });
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => database.close();
      };
    } catch {
      // Local persistence is best-effort and must not break the application.
    }
  }
}
