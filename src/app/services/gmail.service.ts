import { Injectable, signal, computed, inject } from '@angular/core';
import { auth, googleAuthProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { WorkspaceOAuthHelperService } from './workspace-oauth-helper.service';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GmailService {
  private oauthHelper = inject(WorkspaceOAuthHelperService);
  private accessTokenSignal = signal<string | null>(null);
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser() && !!this.accessTokenSignal());
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  public static readonly GMAIL_SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
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

  async authenticateWithGmail(): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    // If running in iframe, trigger guidance prompt
    if (this.oauthHelper.isRunningInIframe()) {
      this.oauthHelper.showOAuthGuidance('Gmail');
    }

    try {
      GmailService.GMAIL_SCOPES.forEach(scope => {
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
        throw new Error('کۆدی دەستگەیشتن (Access Token) بۆ Gmail بەردەست نەبوو.');
      }
    } catch (err: any) {
      console.error('Gmail Auth Error:', err);
      const isPopupBlocked = err.code === 'auth/popup-blocked' || err.message?.includes('popup');
      if (isPopupBlocked || this.oauthHelper.isRunningInIframe()) {
        this.oauthHelper.showOAuthGuidance('Gmail', 'پەنجەرەی ڕێگەپێدانی گووگڵ بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا (New Tab) بکەرەوە.');
      }
      const errorMsg = isPopupBlocked
        ? 'پەنجەرەی ڕێگەپێدانی Gmail بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.'
        : (err.message || 'پێوەندیی لەگەڵ Gmail سەرکەوتوو نەبوو.');
      this.error.set(errorMsg);
      this.isLoading.set(false);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessTokenSignal()) {
      return this.accessTokenSignal();
    }
    return this.authenticateWithGmail();
  }

  async listMessages(maxResults: number = 10, query?: string): Promise<GmailMessage[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Gmail.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`شکست لە ئینلاین کردنی ئیمەیڵەکانی Gmail: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.messages || data.messages.length === 0) {
        this.isLoading.set(false);
        return [];
      }

      // Fetch details for each message
      const messages: GmailMessage[] = [];
      for (const item of data.messages.slice(0, maxResults)) {
        try {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject');
            const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from');
            const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date');

            messages.push({
              id: detail.id,
              threadId: detail.threadId,
              snippet: detail.snippet,
              subject: subjectHeader ? subjectHeader.value : '(بێ ناونیشان)',
              from: fromHeader ? fromHeader.value : 'نادیار',
              date: dateHeader ? dateHeader.value : ''
            });
          }
        } catch {
          // Continue if individual message detail fails
        }
      }

      this.isLoading.set(false);
      return messages;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async sendEmail(to: string, subject: string, bodyText: string): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Gmail.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const emailContent = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        bodyText
      ].join('\r\n');

      const encodedMessage = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedMessage
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `هەڵە لە ناردنی ئیمەیڵ: ${res.statusText}`);
      }

      const result = await res.json();
      this.isLoading.set(false);
      return result;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async createDraft(to: string, subject: string, bodyText: string): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Gmail.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const emailContent = [
        `To: ${to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        bodyText
      ].join('\r\n');

      const encodedMessage = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            raw: encodedMessage
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `هەڵە لە دروستکردنی پیشنووس (Draft): ${res.statusText}`);
      }

      const result = await res.json();
      this.isLoading.set(false);
      return result;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }
}
