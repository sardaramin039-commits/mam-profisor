import { Injectable, signal } from '@angular/core';

export interface AcademicSessionUser {
  id: string;
  name: string;
  email: string;
  role: 'researcher' | 'student' | 'professor' | 'reviewer';
  institution?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppSessionService {
  readonly currentUser = signal<AcademicSessionUser>({
    id: 'user_01',
    name: 'توێژەری ئەکادیمی',
    email: 'researcher@university.edu.krd',
    role: 'researcher',
    institution: 'University of Kurdistan'
  });

  readonly isAuthenticated = signal<boolean>(true);

  setSession(user: AcademicSessionUser) {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  logout() {
    this.isAuthenticated.set(false);
  }
}
