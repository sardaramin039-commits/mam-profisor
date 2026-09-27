import { Injectable, signal } from '@angular/core';
import { auth, db, googleAuthProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface ChapterSnapshot {
  timestamp: string;
  content: string;
  wordCount: number;
  trigger?: string;
  customSourcesOn?: boolean;
  fieldWorkOn?: boolean;
  customTOCOn?: boolean;
}

export interface ChapterItem {
  id: number;
  title: string;
  wordCount: number;
  status: 'pending' | 'writing' | 'completed' | 'humanizing';
  content: string;
  academicNotes?: string;
  isViewOpen?: boolean;
  customTargetWords?: number;
  isLocked?: boolean;
  integrityHash?: string;
  snapshots?: ChapterSnapshot[];
  isEncryptedInVault?: boolean;
  customSourcesOn?: boolean;
  fieldWorkOn?: boolean;
  customTOCOn?: boolean;
}

export interface SavedManuscript {
  id: string;
  userId: string;
  title: string;
  discipline: string;
  academicLevel: string;
  pages: number;
  chapters: {
    title: string;
    content: string;
    wordCount: number;
    academicNotes: string;
    isLocked?: boolean;
    integrityHash?: string;
    snapshots?: ChapterSnapshot[];
    isEncryptedInVault?: boolean;
  }[];
  createdAt?: {
    seconds: number;
    nanoseconds: number;
    secondsPassed?: number;
  };
}

export interface AcademicSource {
  id: string;
  userId: string;
  author: string;
  title: string;
  year: number;
  publisher: string;
  sourceType: 'book' | 'journal' | 'thesis' | 'manuscript';
  doi?: string;
  isbn?: string;
  isVerified: boolean;
  createdAt?: { seconds: number; nanoseconds?: number } | null;
}

@Injectable({
  providedIn: 'root'
})
export class Data {
  currentUser = signal<User | null>(null);
  historyList = signal<SavedManuscript[]>([]);
  isHistoryLoading = signal<boolean>(false);
  isFirebaseSaving = signal<boolean>(false);
  
  sourcesList = signal<AcademicSource[]>([]);
  isSourcesLoading = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, (user) => {
        this.currentUser.set(user);
        if (user) {
          this.fetchHistory();
          this.fetchSources();
        } else {
          this.historyList.set([]);
          this.sourcesList.set([]);
          this.loadLocalFallback();
          this.loadLocalSourcesFallback();
        }
      });
    }
  }

  // Load fallback cache for offline or guest mode
  loadLocalFallback() {
    try {
      const localList = JSON.parse(localStorage.getItem('local_manuscripts_backup') || '[]');
      this.historyList.set(localList);
    } catch (err) {
      console.warn('Failed to load local backup from storage:', err);
    }
  }

  // Load fallback for local sources in offline/guest mode
  loadLocalSourcesFallback() {
    try {
      const localSources = JSON.parse(localStorage.getItem('local_sources_backup') || '[]');
      this.sourcesList.set(localSources);
    } catch (err) {
      console.warn('Failed to load local sources from storage:', err);
    }
  }

  // Google Sign-In helper using Firebase auth popup
  async loginWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      return result.user;
    } catch (err: unknown) {
      console.error('Login error:', err);
      throw new Error('سەرکەوتوو نەبوو لە چوونەژوورەوە بە ئەکاونتی گووگڵ؛ تکایە دووبارە تاقی بکەرەوە.');
    }
  }

  // Sign-Out
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err: unknown) {
      console.error('Logout error:', err);
      throw err;
    }
  }

  // Read saved manuscripts from Firestore / Local Fallback
  async fetchHistory() {
    const user = this.currentUser();
    this.isHistoryLoading.set(true);
    const path = 'refinements';
    
    try {
      if (user) {
        const q = query(
          collection(db, path),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const list: SavedManuscript[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as SavedManuscript);
        });
        list.sort((a, b) => {
          const timeA = b.createdAt?.seconds || 0;
          const timeB = a.createdAt?.seconds || 0;
          return timeA - timeB;
        });
        this.historyList.set(list);
        
        // Cache in local storage as a fallback
        try {
          localStorage.setItem('local_manuscripts_backup', JSON.stringify(list.slice(0, 20)));
        } catch (storageErr) {
          console.warn('Failed to update local cache:', storageErr);
        }
      } else {
        this.loadLocalFallback();
      }
    } catch (error) {
      console.warn('Firestore fetchHistory failed, fallback to local storage cache:', error);
      this.loadLocalFallback();
    } finally {
      this.isHistoryLoading.set(false);
    }
  }

  // Backup entire book metadata structure into Firestore and Local Cache
  async saveManuscriptToCloud(title: string, discipline: string, academicLevel: string, size: number, chapters: ChapterItem[]) {
    const user = this.currentUser();
    this.isFirebaseSaving.set(true);
    const path = 'refinements';
    const uniqueId = `local_${Date.now()}`;
    
    const payloadForStorage = {
      id: uniqueId,
      userId: user ? user.uid : 'anonymous',
      title,
      discipline,
      academicLevel,
      pages: size,
      chapters: chapters.map(c => ({
        title: c.title,
        content: c.content,
        wordCount: c.wordCount,
        academicNotes: c.academicNotes || '',
        isLocked: c.isLocked || false,
        integrityHash: c.integrityHash || '',
        snapshots: c.snapshots || [],
        isEncryptedInVault: c.isEncryptedInVault || false
      })),
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };

    // Always back up locally first so data is never lost, even if offline or authenticated
    try {
      const localList = JSON.parse(localStorage.getItem('local_manuscripts_backup') || '[]');
      localList.unshift(payloadForStorage);
      localStorage.setItem('local_manuscripts_backup', JSON.stringify(localList.slice(0, 20)));
    } catch (storageErr) {
      console.warn('Failed to backup manuscript to local storage:', storageErr);
    }

    if (user) {
      try {
        const docId = doc(collection(db, path)).id;
        const docRef = doc(db, path, docId);

        const payload = {
          userId: user.uid,
          title,
          discipline,
          academicLevel,
          pages: size,
          chapters: chapters.map(c => ({
            title: c.title,
            content: c.content,
            wordCount: c.wordCount,
            academicNotes: c.academicNotes || '',
            isLocked: c.isLocked || false,
            integrityHash: c.integrityHash || '',
            snapshots: c.snapshots || [],
            isEncryptedInVault: c.isEncryptedInVault || false
          })),
          createdAt: serverTimestamp()
        };

        await setDoc(docRef, payload);
        await this.fetchHistory();
      } catch (error) {
        console.warn('Firestore database write failed gracefully/silently (quota or offline limits):', error);
      } finally {
        this.isFirebaseSaving.set(false);
      }
    } else {
      // Refresh local list to show the new item
      this.isFirebaseSaving.set(false);
      await this.fetchHistory();
    }
  }

  // Delete history entry cleanly
  async deleteHistoryItem(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    // Always filter out from local storage list
    try {
      const localList = JSON.parse(localStorage.getItem('local_manuscripts_backup') || '[]');
      const updatedLocal = localList.filter((item: SavedManuscript) => item.id !== id);
      localStorage.setItem('local_manuscripts_backup', JSON.stringify(updatedLocal));
    } catch (storageErr) {
      console.warn('Failed to delete history item from localStorage:', storageErr);
    }

    // Update list in active UI state immediately for responsive feedback
    this.historyList.update(list => list.filter(item => item.id !== id));

    // If it is a local-only document, we are done
    if (id.startsWith('local_')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'refinements', id));
    } catch (error) {
      console.warn('Firestore database delete failed gracefully/silently:', error);
    }
  }

  // Fetch verified academic sources
  async fetchSources() {
    const user = this.currentUser();
    if (!user) {
      this.loadLocalSourcesFallback();
      return;
    }

    this.isSourcesLoading.set(true);
    try {
      const q = query(
        collection(db, 'sources'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: AcademicSource[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data['userId'] || '',
          author: data['author'] || '',
          title: data['title'] || '',
          year: Number(data['year']) || 2026,
          publisher: data['publisher'] || '',
          sourceType: data['sourceType'] || 'book',
          doi: data['doi'] || '',
          isbn: data['isbn'] || '',
          isVerified: data['isVerified'] !== false,
          createdAt: data['createdAt'] || null
        });
      });
      
      // Save local backup in case user goes offline later
      try {
        localStorage.setItem('local_sources_backup', JSON.stringify(list));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      
      this.sourcesList.set(list);
    } catch (error) {
      console.warn('Failed to fetch academic sources from cloud, loading local backup:', error);
      this.loadLocalSourcesFallback();
    } finally {
      this.isSourcesLoading.set(false);
    }
  }

  // Save new academic source (cloud + offline backup fallback)
  async saveSourceToCloud(source: Omit<AcademicSource, 'id' | 'userId'>) {
    const user = this.currentUser();
    const id = 'source_' + Date.now();
    const userId = user ? user.uid : 'guest';

    const newSource: AcademicSource = {
      ...source,
      id,
      userId,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    };

    // 1. Instantly update local list for optimal UI response
    this.sourcesList.update(list => [newSource, ...list]);

    // 2. Persist to local storage backup
    try {
      const localSources = JSON.parse(localStorage.getItem('local_sources_backup') || '[]');
      localStorage.setItem('local_sources_backup', JSON.stringify([newSource, ...localSources]));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // 3. If online/logged in, sync to Firestore
    if (user) {
      this.isFirebaseSaving.set(true);
      try {
        const docRef = doc(collection(db, 'sources'));
        const payload = {
          userId,
          author: source.author,
          title: source.title,
          year: Number(source.year),
          publisher: source.publisher,
          sourceType: source.sourceType,
          doi: source.doi || '',
          isbn: source.isbn || '',
          // Client cannot self-promote a source to verified status.
          isVerified: false,
          createdAt: serverTimestamp()
        };
        await setDoc(docRef, payload);
        await this.fetchSources(); // Refresh to get the actual server doc IDs
      } catch (error) {
        console.warn('Firestore source save failed gracefully/silently (quota or offline limits):', error);
      } finally {
        this.isFirebaseSaving.set(false);
      }
    }
  }

  // Delete verified source cleanly
  async deleteSource(id: string) {
    // 1. Update UI state instantly
    this.sourcesList.update(list => list.filter(item => item.id !== id));

    // 2. Remove from local storage backup
    try {
      const localSources = JSON.parse(localStorage.getItem('local_sources_backup') || '[]');
      const updatedLocal = localSources.filter((item: AcademicSource) => item.id !== id);
      localStorage.setItem('local_sources_backup', JSON.stringify(updatedLocal));
    } catch (storageErr) {
      console.warn('Failed to delete source from localStorage:', storageErr);
    }

    // 3. If it is a guest/local source, we're done
    if (id.startsWith('source_')) {
      return;
    }

    // 4. Sync delete to cloud
    try {
      await deleteDoc(doc(db, 'sources', id));
    } catch (error) {
      console.warn('Firestore source delete failed gracefully/silently:', error);
    }
  }
}
