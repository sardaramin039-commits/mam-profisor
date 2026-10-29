import { Injectable, signal } from '@angular/core';
import { auth, googleAuthProvider } from '../../firebase';
import { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut, User } from 'firebase/auth';
import { isInternalApiUrl } from '../utils/internal-api-url';

@Injectable({
  providedIn: 'root'
})
export class CoreFirebase {
  readonly currentUser = signal<User | null>(null);
  readonly userRole = signal<string>('student');
  readonly userClaims = signal<Record<string, unknown>>({});
  readonly isAuthLoading = signal<boolean>(true);

  constructor() {
    if (typeof window !== 'undefined') {
      this.installFetchAuthInterceptor();
      onAuthStateChanged(auth, async (user) => {
        this.currentUser.set(user);
        if (user) {
          try {
            const tokenResult = await user.getIdTokenResult();
            const role = (tokenResult.claims['role'] as string) ||
              ((tokenResult.claims['roles'] as string[])?.[0]) ||
              'student';
            this.userRole.set(role);
            this.userClaims.set(tokenResult.claims);
          } catch (err) {
            console.warn('Failed to fetch user token claims:', err);
            this.userRole.set('student');
          }
        } else {
          this.userRole.set('student');
          this.userClaims.set({});
          if (typeof window !== 'undefined' && navigator.onLine) {
            try {
              await signInAnonymously(auth);
            } catch {
              // Gracefully operate as offline guest
            }
          }
        }
        this.isAuthLoading.set(false);
      });
    } else {
      this.isAuthLoading.set(false);
    }
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }

  private installFetchAuthInterceptor(): void {
    const globalObj = window as unknown as { __api_fetch_intercepted__?: boolean; fetch: typeof window.fetch };
    if (!globalObj.__api_fetch_intercepted__) {
      globalObj.__api_fetch_intercepted__ = true;
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const urlString = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
        if (isInternalApiUrl(urlString)) {
          const user = auth.currentUser;
          if (user) {
            try {
              const token = await user.getIdToken();
              if (token) {
                init = init ? { ...init } : {};
                const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
                if (!headers.has('Authorization')) {
                  headers.set('Authorization', `Bearer ${token}`);
                }
                init.headers = headers;
              }
            } catch (err) {
              console.warn('Error attaching bearer token to fetch:', err);
            }
          }
        }
        return originalFetch(input, init);
      };
    }
  }

  async loginWithGoogle(): Promise<User | null> {
    try {
      this.isAuthLoading.set(true);
      const res = await signInWithPopup(auth, googleAuthProvider);
      this.currentUser.set(res.user);
      const tokenResult = await res.user.getIdTokenResult();
      const role = (tokenResult.claims['role'] as string) ||
        ((tokenResult.claims['roles'] as string[])?.[0]) ||
        'student';
      this.userRole.set(role);
      this.userClaims.set(tokenResult.claims);
      return res.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      this.isAuthLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      this.isAuthLoading.set(true);
      await signOut(auth);
      this.currentUser.set(null);
      this.userRole.set('student');
      this.userClaims.set({});
    } catch (error) {
      console.error('Logout Error:', error);
    } finally {
      this.isAuthLoading.set(false);
    }
  }
}
