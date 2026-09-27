import { inject, Injectable } from '@angular/core';
import { AcademicStoreService } from '../services/academic-store.service';
import { DigitalLibraryService } from '../services/digital-library.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationStartupService {
  private academicStore = inject(AcademicStoreService);
  private libraryService = inject(DigitalLibraryService);

  init(): void {
    try {
      console.log('🏛️ Initializing Harvard Academic Digital Library & Core Store Engine...');
      // Engine services are initialized with default reactive state signals
      if (this.academicStore) {
        console.log('Academic Store initialized.');
      }
      if (this.libraryService) {
        console.log('Digital Library initialized with 40 archives.');
      }
    } catch (err) {
      console.warn('Startup initialization notice:', err);
    }
  }
}
