import { LibrarySource } from '../../../models/digital-library.model';

export const DIGITAL_LIBRARY_SOURCES: LibrarySource[] = [
  {
    id: 'pdf4kurd',
    name: 'PDF4Kurd Books Archive',
    nameKurdish: 'ئەرشیڤی پەڕتووکی کوردی PDF4Kurd',
    url: 'https://pdf4kurd.com',
    category: 'kurdish',
    totalItems: 850,
    lastSync: 'ئێستا',
    status: 'active',
    description: 'گەورەترین کتێبخانەی پەڕتووکی کوردی، دەستنووس و بڵاوکراوە ئەکادیمییەکان.'
  },
  {
    id: 'kurdish-institute',
    name: 'Institut Kurde de Paris',
    nameKurdish: 'ئینستیتیوتی کوردی لە پاریس',
    url: 'https://institutkurde.org',
    category: 'academic',
    totalItems: 420,
    lastSync: 'دوێنێ',
    status: 'active',
    description: 'بەڵگەنامە، گۆڤار و لێکۆڵینەوە ئەوروپییەکان لەسەر کوردستان.'
  },
  {
    id: 'open-alex',
    name: 'OpenAlex Academic Index',
    nameKurdish: 'پێڕستی زانستیی ئۆپن ئەلێکس',
    url: 'https://openalex.org',
    category: 'global',
    totalItems: 12400,
    lastSync: 'ئێستا',
    status: 'active',
    description: 'ملیۆنان تێز و وتاری زانستی هاوتاسازی جیهانی لەگەڵ DOI.'
  }
];
