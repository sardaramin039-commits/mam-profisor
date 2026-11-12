import { LibrarySource } from '../app/models/digital-library.model';
import { PERSIAN_LIBRARY_SOURCES_1 } from './data/library-sources-persian-1';
import { PERSIAN_LIBRARY_SOURCES_2 } from './data/library-sources-persian-2';

export const PERSIAN_LIBRARY_SOURCES: LibrarySource[] = [
  ...PERSIAN_LIBRARY_SOURCES_1,
  ...PERSIAN_LIBRARY_SOURCES_2
];
