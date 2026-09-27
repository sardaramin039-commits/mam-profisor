import { Injectable, inject } from '@angular/core';
import { AcademicStoreService } from '../services/academic-store.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  private store = inject(AcademicStoreService);

  initializeSystem() {
    console.log('[AppInitializer] Academic Thesis Platform initialized successfully.');
    this.store.addLog('سیستەمی ئەکادیمی سەرکەوتووانە دەستی پێکرد.');
  }
}
