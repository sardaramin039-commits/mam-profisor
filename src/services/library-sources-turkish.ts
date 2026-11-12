import { LibrarySource } from '../app/models/digital-library.model';
import { TURKISH_LIBRARY_SOURCES_PART1 } from './data/library-sources-turkish-1';
import { TURKISH_LIBRARY_SOURCES_PART2 } from './data/library-sources-turkish-2';

export const TURKISH_LIBRARY_SOURCES: LibrarySource[] = [
  ...TURKISH_LIBRARY_SOURCES_PART1,
  ...TURKISH_LIBRARY_SOURCES_PART2
];
