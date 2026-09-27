import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedApiService {
  private readonly http = inject(HttpClient);

  get<T>(url: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(url));
  }

  post<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(url, body));
  }
}
