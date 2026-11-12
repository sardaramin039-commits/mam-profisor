import { LibrarySource } from '../app/models/digital-library.model';
import { GLOBAL_LIBRARY_SOURCES_1 } from './data/library-sources-global-1';
import { GLOBAL_LIBRARY_SOURCES_2 } from './data/library-sources-global-2';

export const GLOBAL_LIBRARY_SOURCES: LibrarySource[] = [
  ...GLOBAL_LIBRARY_SOURCES_1,
  ...GLOBAL_LIBRARY_SOURCES_2
];
