import { Injectable, signal, computed, inject } from '@angular/core';
import { auth, googleAuthProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { WorkspaceOAuthHelperService } from './workspace-oauth-helper.service';

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleTasksService {
  private oauthHelper = inject(WorkspaceOAuthHelperService);
  private accessTokenSignal = signal<string | null>(null);
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser() && !!this.accessTokenSignal());
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  public static readonly TASKS_SCOPES = [
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/tasks.readonly'
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

  async authenticateWithTasks(): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    // If running in iframe, trigger guidance prompt
    if (this.oauthHelper.isRunningInIframe()) {
      this.oauthHelper.showOAuthGuidance('Google Tasks');
    }

    try {
      GoogleTasksService.TASKS_SCOPES.forEach(scope => {
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
        throw new Error('کۆدی دەستگەیشتن (Access Token) بۆ Google Tasks بەردەست نەبوو.');
      }
    } catch (err: any) {
      console.error('Tasks Auth Error:', err);
      const isPopupBlocked = err.code === 'auth/popup-blocked' || err.message?.includes('popup');
      if (isPopupBlocked || this.oauthHelper.isRunningInIframe()) {
        this.oauthHelper.showOAuthGuidance('Google Tasks', 'پەنجەرەی ڕێگەپێدانی گووگڵ بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا (New Tab) بکەرەوە.');
      }
      const errorMsg = isPopupBlocked
        ? 'پەنجەرەی ڕێگەپێدانی Google Tasks بلۆک کرا. تکایە ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.'
        : (err.message || 'پێوەندیی لەگەڵ Google Tasks سەرکەوتوو نەبوو.');
      this.error.set(errorMsg);
      this.isLoading.set(false);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessTokenSignal()) {
      return this.accessTokenSignal();
    }
    return this.authenticateWithTasks();
  }

  async listTaskLists(): Promise<GoogleTaskList[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Tasks.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`شکست لە هێنانی لیستی ئەرکەکان: ${res.statusText}`);
      }

      const data = await res.json();
      this.isLoading.set(false);
      return data.items || [];
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async listTasks(tasklistId: string = '@default'): Promise<GoogleTask[]> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Tasks.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`شکست لە خوێندنەوەی ئەرکەکان: ${res.statusText}`);
      }

      const data = await res.json();
      this.isLoading.set(false);
      return data.items || [];
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async createTask(title: string, notes?: string, dueDate?: string, tasklistId: string = '@default'): Promise<GoogleTask> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Tasks.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const bodyPayload: any = {
        title,
        notes
      };
      if (dueDate) {
        bodyPayload.due = new Date(dueDate).toISOString();
      }

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `هەڵە لە دروستکردنی ئەرک لە Google Tasks: ${res.statusText}`);
      }

      const task = await res.json();
      this.isLoading.set(false);
      return task;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }

  async completeTask(taskId: string, tasklistId: string = '@default'): Promise<GoogleTask> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('تکایە سەرەتا بچۆ ژوورەوە بۆ Google Tasks.');

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (!res.ok) {
        throw new Error(`شکست لە گۆڕینی دۆخی ئەرک: ${res.statusText}`);
      }

      const task = await res.json();
      this.isLoading.set(false);
      return task;
    } catch (err: any) {
      this.isLoading.set(false);
      this.error.set(err.message);
      throw err;
    }
  }
}
