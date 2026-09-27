import { Injectable, signal, computed, inject } from '@angular/core';
import { auth, googleAuthProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { WorkspaceOAuthHelperService } from './workspace-oauth-helper.service';

export interface KeepNote {
  name?: string;
  title?: string;
  textContent?: string;
  body?: {
    text?: {
      text?: string;
    };
  };
  createTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleKeepService {
  private oauthHelper = inject(WorkspaceOAuthHelperService);
  private accessTokenSignal = signal<string | null>(null);
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser() && !!this.accessTokenSignal());
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  public static readonly KEEP_SCOPES = [
    'https://www.googleapis.com/auth/keep',
    'https://www.googleapis.com/auth/keep.readonly'
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, (user) => {
        this.currentUser.set(user);
        if (!user) {
          this.accessTokenSignal.set(null);
        }
      });
    }
  }

  async authenticateWithKeep(): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    // If running in iframe, trigger guidance prompt
    if (this.oauthHelper.isRunningInIframe()) {
      this.oauthHelper.showOAuthGuidance('Google Keep');
    }

    try {
      GoogleKeepService.KEEP_SCOPES.forEach(scope => {
        googleAuthProvider.addScope(scope);
      });

      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = (result as any)._tokenResponse?.oauthAccessToken || (result as any).credential?.accessToken;
      
      let token = credential;
      if (!token && (result as any).user) {
        const user = result.user;
        token = await user.getIdToken();
      }

      if (token) {
        this.accessTokenSignal.set(token);
        this.currentUser.set(result.user);
        this.isLoading.set(false);
        this.oauthHelper.closeNotice();
        return token;
      } else {
        throw new Error('کۆدی دەستگەیشتن (Access Token) بۆ Google Keep بەردەست نەبوو.');
      }
    } catch (err: any) {
      console.error('Keep Auth Error:', err);
      const isPopupBlocked = err.code === 'auth/popup-blocked' || err.message?.includes('popup');
      if (isPopupBlocked || this.oauthHelper.isRunningInIframe()) {
        this.oauthHelper.showOAuthGuidance('Google Keep', 'پەنجەرەی ڕێگەپێدانی گووگڵ بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا (New Tab) بکەرەوە.');
      }
      const errorMsg = isPopupBlocked
        ? 'پەنجەرەی ڕێگەپێدانی Google Keep بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.'
        : (err.message || 'پێوەندیی لەگەڵ Google Keep سەرکەوتوو نەبوو.');
      this.error.set(errorMsg);
      this.isLoading.set(false);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessTokenSignal()) {
      return this.accessTokenSignal();
    }
    return this.authenticateWithKeep();
  }

  async listNotes(): Promise<KeepNote[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Keep.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `پێویستی بە هێنانی تێبینی لە Google Keep: ${res.statusText}`);
      }

      const data = await res.json();
      this.isLoading.set(false);
      return data.notes || [];
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async createNote(title: string, textContent: string): Promise<KeepNote> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Keep.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body: {
            text: {
              text: textContent
            }
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `هەڵە لە دروستکردنی تێبینی لە Google Keep: ${res.statusText}`);
      }

      const note = await res.json();
      this.isLoading.set(false);
      return note;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }
}
