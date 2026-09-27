import { db, auth } from '../app/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Saves academic data securely into Firestore under the given collection.
 * Includes local storage fallbacks for offline resilience.
 */
export async function saveAcademicData(collectionPath: string, data: Record<string, unknown>): Promise<void> {
  try {
    // Determine active authenticated user or default to anonymous
    let uid = 'anonymous';
    if (auth.currentUser) {
      uid = auth.currentUser.uid;
    }

    const docRefId = doc(collection(db, collectionPath)).id;
    const docRef = doc(db, collectionPath, docRefId);

    const payload = {
      ...data,
      userId: (data['userId'] as string | undefined) || uid,
      createdAt: serverTimestamp()
    };

    await setDoc(docRef, payload);
    console.log(`سەرکەوتوو: داتا پاشەکەوتکرا لە کۆکراوەی '${collectionPath}' بە ناسنامەی ${docRefId}`);
  } catch (error) {
    console.error('هەڵە لە پاشەکەوتکردنی داتا لە داتابەیس:', error);
    
    // Offline resilience fallback using browser local storage & IndexedDB
    if (typeof window !== 'undefined') {
      try {
        const fallbackKey = `local_fallback_${collectionPath}`;
        const existingData = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
        existingData.unshift({
          ...data,
          processedAt: new Date().toISOString()
        });
        localStorage.setItem(fallbackKey, JSON.stringify(existingData.slice(0, 100)));
        console.log('داتاکان بە شێوازێکی خۆجێیی پاشەکەوتکران لەسەر وێبگەڕ وەک یەدەگ.');
      } catch (localErr) {
        console.warn('LocalStorage پڕ بووەتەوە، دروستکردنی پاشەکەوتی شوێنپێگر لە IndexedDB:', localErr);
        try {
          if ('indexedDB' in window) {
            const req = window.indexedDB.open('AcademicKurdishThesisDB', 1);
            req.onsuccess = (e: any) => {
              const idb = e.target.result;
              if (idb.objectStoreNames.contains('large_cache')) {
                const tx = idb.transaction(['large_cache'], 'readwrite');
                tx.objectStore('large_cache').put({
                  key: `fallback_${collectionPath}_${Date.now()}`,
                  data,
                  updatedAt: new Date().toISOString()
                });
                console.log('داتاکان لە IndexedDB بە سەرکەوتوویی پاشەکەوت کران.');
              }
            };
          }
        } catch (idbErr) {
          console.error('نەتوانرا داتا لۆکاڵی پاشەکەوت بکرێت لە IndexedDB:', idbErr);
        }
      }
    }
  }
}
