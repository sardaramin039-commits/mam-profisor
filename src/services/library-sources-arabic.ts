import { LibrarySource } from '../app/models/digital-library.model';
import { ARABIC_LIBRARY_SOURCES_1 } from './data/library-sources-arabic-1';
import { ARABIC_LIBRARY_SOURCES_2 } from './data/library-sources-arabic-2';

export const ARABIC_LIBRARY_SOURCES: LibrarySource[] = [
  ...ARABIC_LIBRARY_SOURCES_1,
  ...ARABIC_LIBRARY_SOURCES_2
];
