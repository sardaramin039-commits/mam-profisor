import { Injectable, signal, computed, inject } from '@angular/core';
import { auth, googleAuthProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { WorkspaceOAuthHelperService } from './workspace-oauth-helper.service';

export interface Spreadsheet {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  spreadsheetUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  private oauthHelper = inject(WorkspaceOAuthHelperService);
  private accessTokenSignal = signal<string | null>(null);
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser() && !!this.accessTokenSignal());
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  public static readonly SHEETS_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.file'
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

  async authenticateWithSheets(): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    // If running in iframe, trigger guidance prompt
    if (this.oauthHelper.isRunningInIframe()) {
      this.oauthHelper.showOAuthGuidance('Google Sheets');
    }

    try {
      GoogleSheetsService.SHEETS_SCOPES.forEach(scope => {
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
        throw new Error('کۆدی دەستگەیشتن (Access Token) بۆ Google Sheets بەردەست نەبوو.');
      }
    } catch (err: any) {
      console.error('Sheets Auth Error:', err);
      const isPopupBlocked = err.code === 'auth/popup-blocked' || err.message?.includes('popup');
      if (isPopupBlocked || this.oauthHelper.isRunningInIframe()) {
        this.oauthHelper.showOAuthGuidance('Google Sheets', 'پەنجەرەی ڕێگەپێدانی گووگڵ بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا (New Tab) بکەرەوە.');
      }
      const errorMsg = isPopupBlocked
        ? 'پەنجەرەی ڕێگەپێدانی Google Sheets بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.'
        : (err.message || 'پێوەندیی لەگەڵ Google Sheets سەرکەوتوو نەبوو.');
      this.error.set(errorMsg);
      this.isLoading.set(false);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessTokenSignal()) {
      return this.accessTokenSignal();
    }
    return this.authenticateWithSheets();
  }

  async createSpreadsheet(title: string): Promise<Spreadsheet> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Sheets.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title
          }
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `هەڵە لە دروستکردنی پەڕەی Google Sheets: ${res.statusText}`);
      }

      const sheet = await res.json();
      this.isLoading.set(false);
      return {
        spreadsheetId: sheet.spreadsheetId,
        properties: sheet.properties,
        spreadsheetUrl: sheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`
      };
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async appendValues(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Sheets.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `هەڵە لە ڕیزکردنی داتاکان: ${res.statusText}`);
      }

      const data = await res.json();
      this.isLoading.set(false);
      return data;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async createResearchDataSheet(title: string, headers: string[], rows: any[][]): Promise<Spreadsheet> {
    const sheet = await this.createSpreadsheet(title);
    const allData = [headers, ...rows];
    await this.appendValues(sheet.spreadsheetId, 'Sheet1!A1', allData);
    return sheet;
  }
}
