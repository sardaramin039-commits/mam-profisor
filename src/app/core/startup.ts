import { inject, Injectable } from '@angular/core';
import { AcademicStoreService } from '../services/academic-store.service';
import { DigitalLibraryService } from '../services/digital-library.service';
import { AppInitializerService } from './app.initializer';

@Injectable({
  providedIn: 'root'
})
export class ApplicationStartupService {
  private academicStore = inject(AcademicStoreService);
  private libraryService = inject(DigitalLibraryService);
  private appInitializer = inject(AppInitializerService);

  init(): void {
    try {
      console.log('Initializing the academic digital library and core store...');
      if (this.academicStore) {
        console.log('Academic Store initialized.');
      }
      if (this.libraryService) {
        console.log('Digital Library service initialized.');
      }
      this.appInitializer.initializeSystem();
    } catch (err) {
      console.warn('Startup initialization notice:', err);
    }
  }
}
