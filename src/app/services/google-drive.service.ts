import { Injectable, signal, computed, inject } from '@angular/core';
import { auth, googleAuthProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { WorkspaceOAuthHelperService } from './workspace-oauth-helper.service';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {
  private oauthHelper = inject(WorkspaceOAuthHelperService);
  private accessTokenSignal = signal<string | null>(null);
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser() && !!this.accessTokenSignal());
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  public static readonly DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive'
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

  async authenticateWithDrive(): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    // If running in iframe, trigger guidance prompt
    if (this.oauthHelper.isRunningInIframe()) {
      this.oauthHelper.showOAuthGuidance('Google Drive');
    }

    try {
      GoogleDriveService.DRIVE_SCOPES.forEach(scope => {
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
        throw new Error('کۆدی دەستگەیشتن (Access Token) بۆ گووگڵ درایڤ بەردەست نەبوو.');
      }
    } catch (err: any) {
      console.error('Google Drive Auth Error:', err);
      const isPopupBlocked = err.code === 'auth/popup-blocked' || err.message?.includes('popup');
      if (isPopupBlocked || this.oauthHelper.isRunningInIframe()) {
        this.oauthHelper.showOAuthGuidance('Google Drive', 'پەنجەرەی ڕێگەپێدانی گووگڵ بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا (New Tab) بکەرەوە.');
      }
      const errorMsg = isPopupBlocked 
        ? 'پەنجەرەی ڕێگەپێدانی گووگڵ درایڤ بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.'
        : (err.message || 'پێوەندیی لەگەڵ گووگڵ درایڤ سەرکەوتوو نەبوو.');
      this.error.set(errorMsg);
      this.isLoading.set(false);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessTokenSignal()) {
      return this.accessTokenSignal();
    }
    return this.authenticateWithDrive();
  }

  async signOutDrive(): Promise<void> {
    await signOut(auth);
    this.accessTokenSignal.set(null);
    this.currentUser.set(null);
  }

  async listFiles(pageSize: number = 20, searchQuery?: string): Promise<DriveFile[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ گووگڵ درایڤ.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      let q = "trashed = false";
      if (searchQuery) {
        q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }

      const params = new URLSearchParams({
        q,
        pageSize: pageSize.toString(),
        fields: 'files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, thumbnailLink)',
        orderBy: 'modifiedTime desc'
      });

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.accessTokenSignal.set(null);
          throw new Error('ماوەی چالاکبوونی گووگڵ بەسەرچووە، تکایە دووبارە بچۆ ژوورەوە.');
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `هەڵەی گووگڵ درایڤ: ${res.statusText}`);
      }

      const data = await res.json();
      this.isLoading.set(false);
      return data.files || [];
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async importFileContent(fileId: string, mimeType: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ گووگڵ درایڤ.');

    this.isLoading.set(true);
    try {
      let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      if (mimeType === 'application/vnd.google-apps.document') {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`شکست لە خوێندنەوەی فایلی گووگڵ درایڤ: ${res.statusText}`);
      }

      const text = await res.text();
      this.isLoading.set(false);
      return text;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async exportDocumentToDrive(filename: string, content: string, mimeType: string = 'text/plain'): Promise<DriveFile> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ گووگڵ درایڤ.');

    this.isLoading.set(true);
    try {
      const metadata = {
        name: filename,
        mimeType: mimeType === 'text/markdown' ? 'text/plain' : mimeType
      };

      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
        content +
        closeDelimiter;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `هەڵە لە پاشەکەوتکردن بۆ گووگڵ درایڤ: ${res.statusText}`);
      }

      const createdFile: DriveFile = await res.json();
      this.isLoading.set(false);
      return createdFile;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async createGoogleDoc(title: string): Promise<{ documentId: string; title: string; url: string }> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ گووگڵ درایڤ و دۆکس.');

    this.isLoading.set(true);
    try {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `هەڵە لە دروستکردنی Google Doc: ${res.statusText}`);
      }

      const doc = await res.json();
      this.isLoading.set(false);
      return {
        documentId: doc.documentId,
        title: doc.title,
        url: `https://docs.google.com/document/d/${doc.documentId}/edit`
      };
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async exportThesisAsGoogleDoc(title: string, content: string): Promise<{ documentId: string; title: string; url: string }> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ گووگڵ درایڤ و دۆکس.');

    this.isLoading.set(true);
    try {
      const doc = await this.createGoogleDoc(title);

      if (content && content.trim().length > 0) {
        const insertRes = await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: content
                }
              }
            ]
          })
        });

        if (!insertRes.ok) {
          console.warn('Could not populate Google Doc text directly, file was created as blank doc.');
        }
      }

      this.isLoading.set(false);
      return doc;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async readGoogleDocText(documentId: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ گووگڵ دۆکس.');

    this.isLoading.set(true);
    try {
      const res = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`شکست لە خوێندنەوەی بەڵگەنامەی Google Docs: ${res.statusText}`);
      }

      const doc = await res.json();
      let fullText = '';
      if (doc.body && doc.body.content) {
        for (const element of doc.body.content) {
          if (element.paragraph && element.paragraph.elements) {
            for (const pe of element.paragraph.elements) {
              if (pe.textRun && pe.textRun.content) {
                fullText += pe.textRun.content;
              }
            }
          }
        }
      }

      this.isLoading.set(false);
      return fullText;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }
}
