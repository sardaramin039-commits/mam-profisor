import { LibrarySource } from '../app/models/digital-library.model';
import { ARABIC_LIBRARY_SOURCES } from './library-sources-arabic';
import { PERSIAN_LIBRARY_SOURCES } from './library-sources-persian';
import { TURKISH_LIBRARY_SOURCES } from './library-sources-turkish';
import { GLOBAL_LIBRARY_SOURCES } from './library-sources-global';

const BASE_DIGITAL_LIBRARY_SOURCES: LibrarySource[] = [
  {
    id: 'kurdipedia',
    name: 'Kurdipedia Digital Archive',
    nameKurdish: 'دیجیتاڵ ئەرشیڤی کوردیپێدیا',
    url: 'https://www.kurdipedia.org',
    category: 'kurdish',
    totalItems: 42500,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرچاوە، بەڵگەنامە و کتێبخانەی جەماوەریی کوردیپێدیا'
  },
  {
    id: 'institut_kurde_paris',
    name: 'Bibliothèque numérique kurde (BNK) - Institut Kurde de Paris',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی کوردی - ئەنستیتۆی پاریس',
    url: 'https://bnk.institutkurde.org',
    category: 'kurdish',
    totalItems: 18400,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس، مۆنۆگراف، ڕوژنامەگەری و سەرچاوە مێژووییەکانی ئەنستیتۆی کوردیی پاریس'
  },
  {
    id: 'kurdlib',
    name: 'Kurdlib Archive & Digital Library',
    nameKurdish: 'کتێبخانە و ئەرشیڤی کوردلیب',
    url: 'https://kurdlib.org',
    category: 'kurdish',
    totalItems: 12100,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی گشتیی کتێبە دەگمەن و زانستییەکانی کوردستان'
  },
  {
    id: 'kar_cihan',
    name: 'Academic Repository - Cihan University Erbil',
    nameKurdish: 'ڕیپۆزیتۆری ئەکادیمیی زانکۆی جیهان - هەولێر',
    url: 'https://kar.cihanuniversity.edu.iq',
    category: 'academic',
    totalItems: 8500,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە زانستییەکان و گوڤارە ئەکادیمییەکانی زانکۆی جیهان'
  },
  {
    id: 'exeter_dame',
    name: 'Exeter Digital Archive for Middle East (DAME) - Kurdish Studies',
    nameKurdish: 'ئەرشیڤی دیجیتاڵیی ئێکستەر بۆ ڕۆژهەڵاتی ناوەڕاست و کوردناسی',
    url: 'https://dame.exeter.ac.uk',
    category: 'academic',
    totalItems: 6200,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە کۆن و هاوچەرخەکانی ناوەندی کوردناسی لە زانکۆی ئێکستەری بەریتانی'
  },
  {
    id: 'ifporient',
    name: 'Institut Français du Proche-Orient (IFPO)',
    nameKurdish: 'ئەنستیتۆی فەرەنسی بۆ ڕۆژهەڵاتی نزیک',
    url: 'https://www.ifporient.org',
    category: 'academic',
    totalItems: 4300,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بڵاوکراوە شوێنەواری و مێژووییەکان سەبارەت بە کوردستان و ناوچەکە'
  },
  {
    id: 'institutkurde',
    name: 'Institut Kurde de Paris Main Portal',
    nameKurdish: 'پۆڕتاڵی سەرەکیی ئەنستیتۆی کوردیی پاریس',
    url: 'https://www.institutkurde.org',
    category: 'kurdish',
    totalItems: 9800,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤاری Études Kurdes و بڵاوکراوە ئەکادیمییە فەرەنسی-کوردییەکان'
  },
  {
    id: 'kurdishstudies',
    name: 'Journal of Kurdish Studies & Archive',
    nameKurdish: 'گۆڤار و ناوەندی توێژینەوەی کوردناسی',
    url: 'https://kurdishstudies.org',
    category: 'academic',
    totalItems: 3100,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە بەداوچووە نێودەوڵەتییەکان بۆ زمان، مێژوو و کۆمەڵگەی کوردی'
  },
  {
    id: 'auis_library',
    name: 'AUIS Digital Library & Repository (American University of Iraq Sulaimani)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی ئەمریکی لە سلێمانی',
    url: 'https://auis.edu.krd/library',
    category: 'academic',
    totalItems: 11500,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی بڵاوکراوە و تێزە ئەکادیمییەکانی زانکۆی ئەمریکی سلێمانی'
  },
  {
    id: 'ukh_library',
    name: 'UKH Academic Library & Archives (University of Kurdistan Hewlêr)',
    nameKurdish: 'کتێبخانەی ئەکادیمیی زانکۆی کوردستان - هەولێر',
    url: 'https://www.ukh.edu.krd/library',
    category: 'academic',
    totalItems: 9200,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێزەکانی ماستەر و دکتۆرا و گۆڤاری توێژینەوەی UKH'
  },
  {
    id: 'univsul',
    name: 'University of Sulaimani Academic Repository',
    nameKurdish: 'کتێبخانە و ڕیپۆزیتۆری زانکۆی سلێمانی',
    url: 'https://univsul.edu.iq',
    category: 'academic',
    totalItems: 15400,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرجەم تێزەکان و گوڤارە ڕێپێدراوەکانی زانکۆی سلێمانی'
  },
  {
    id: 'su_edu',
    name: 'Salahaddin University Erbil Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی سەلاحەدین - هەولێر',
    url: 'https://su.edu.krd',
    category: 'academic',
    totalItems: 16800,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەرچاوە زانستی، مێژوویی و ئەدەبییەکانی زانکۆی سەلاحەدین'
  },
  {
    id: 'uod_ac',
    name: 'University of Duhok Academic Library & Repository',
    nameKurdish: 'کتێبخانەی ئەکادیمیی زانکۆی دهۆک',
    url: 'https://uod.ac',
    category: 'academic',
    totalItems: 12900,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوەکانی زانکۆی دهۆک بە زمانەکانی کوردی (کورمانجی و سۆرانی)، عەرەبی و ئینگلیزی'
  },
  {
    id: 'soran_edu',
    name: 'Soran University Academic Repository',
    nameKurdish: 'ڕیپۆزیتۆری ئەکادیمیی زانکۆی سۆران',
    url: 'https://soran.edu.iq',
    category: 'academic',
    totalItems: 7800,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤاری زانکۆی سۆران و توێژینەوەی زمانەوانی و بەشە زانستییەکان'
  },
  {
    id: 'uoh_edu',
    name: 'University of Halabja Central Library',
    nameKurdish: 'کتێبخانەی ناوەندیی زانکۆی هەڵەبجە',
    url: 'https://uoh.edu.iq',
    category: 'academic',
    totalItems: 5400,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بڵاوکراوە و توێژینەوە مێژوویی، ئەدەبی و زانستییەکانی زانکۆی هەڵەبجە'
  },
  {
    id: 'uor_edu',
    name: 'University of Raparin Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی ڕاپەڕین',
    url: 'https://uor.edu.krd',
    category: 'academic',
    totalItems: 6100,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێزی توێژەران و گۆڤاری زانستیی زانکۆی ڕاپەڕین - ڕانیە'
  },
  {
    id: 'garmian_edu',
    name: 'University of Garmian Digital Archives',
    nameKurdish: 'ئەرشیڤی دیجیتاڵیی زانکۆی گەرمیان',
    url: 'https://garmian.edu.krd',
    category: 'academic',
    totalItems: 5900,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێزە زانستییەکان و بڵاوکراوەکانی ناوچەی گەرمیان'
  },
  {
    id: 'koya_university',
    name: 'Koya University Academic Repository (ARO)',
    nameKurdish: 'کتێبخانە و سیستمەی AROی زانکۆی کۆیە',
    url: 'https://koyauniversity.org',
    category: 'academic',
    totalItems: 8100,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤاری زانکۆی کۆیە بۆ زانستە مرۆڤایەتی و پەیڕەوییەکان'
  },
  {
    id: 'cihan_main',
    name: 'Cihan University Network Library',
    nameKurdish: 'کتێبخانەی ناوەندیی زانکۆکانی جیهان',
    url: 'https://cihanuniversity.edu.iq',
    category: 'academic',
    totalItems: 9400,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤاری توێژینەوەی ئەندازیاری، یاسایی و پزیشکیی جیهان'
  },
  {
    id: 'charmo_edu',
    name: 'Charmo University Academic Archive',
    nameKurdish: 'ئەرشیڤی ئەکادیمیی زانکۆی چەرموو - چەمچەماڵ',
    url: 'https://charmo.edu.krd',
    category: 'academic',
    totalItems: 4200,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە و بڵاوکراوەکان لە چەمچەماڵ و زانکۆی چەرموو'
  },
  {
    id: 'komar_edu',
    name: 'Komar University of Science and Technology Library',
    nameKurdish: 'کتێبخانەی زانکۆی کۆمار بۆ زانست و تەکنەلۆجیا',
    url: 'https://komar.edu.iq',
    category: 'academic',
    totalItems: 6700,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەرچاوە پزیشکی، تەکنەلۆجی و بازرگانییەکانی زانکۆی کۆمار'
  },
  {
    id: 'lfu_edu',
    name: 'Lebanese French University Erbil Repository',
    nameKurdish: 'کتێبخانەی زانکۆی نێودەوڵەتیی لۆبنانی فەرەنسی',
    url: 'https://lfu.edu.krd',
    category: 'academic',
    totalItems: 5100,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە یاسایی و ئیدارییەکانی زانکۆی LFU'
  },
  {
    id: 'auk_library',
    name: 'American University of Kurdistan (AUK) Library - Duhok',
    nameKurdish: 'کتێبخانەی زانکۆی ئەمریکیی کوردستان - دهۆک',
    url: 'https://auk.edu.krd/library',
    category: 'academic',
    totalItems: 7300,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرچاوە مۆدێرنەکان و لێکۆڵینەوە نێودەوڵەتییەکانی AUK'
  },
  {
    id: 'cue_edu',
    name: 'Catholic University in Erbil (CUE) Archives',
    nameKurdish: 'کتێبخانە و ئەرشیڤی زانکۆی کاتۆلیکی لە هەولێر',
    url: 'https://cue.edu.krd',
    category: 'academic',
    totalItems: 3800,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس، مێژوو و توێژینەوەی ئایینی و کلتوورییەکان'
  },
  {
    id: 'nawroz_edu',
    name: 'Nawroz University Library - Duhok',
    nameKurdish: 'کتێبخانەی زانکۆی نەورۆز - دهۆک',
    url: 'https://www.nawroz.edu.krd',
    category: 'academic',
    totalItems: 6400,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە یاسایی، ئابووری و کۆمپیوتەرییەکانی زانکۆی نەورۆز'
  },
  {
    id: 'epu_edu',
    name: 'Erbil Polytechnic University Central Archive',
    nameKurdish: 'ئەرشیڤی ناوەندیی زانکۆی پۆلیتەکنیکی هەولێر',
    url: 'https://epu.edu.iq',
    category: 'academic',
    totalItems: 7100,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە تەکنیکی، ئەندازیاری و بڵاوکراوە ڕاهێنانییەکان'
  },
  {
    id: 'dpu_edu',
    name: 'Duhok Polytechnic University Repository',
    nameKurdish: 'ڕیپۆزیتۆری زانکۆی پۆلیتەکنیکی دهۆک',
    url: 'https://dpu.edu.krd',
    category: 'academic',
    totalItems: 5800,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە تەکنەلۆجی و پراکتیکییەکان لە دهۆک'
  },
  {
    id: 'spu_edu',
    name: 'Sulaimani Polytechnic University Library',
    nameKurdish: 'کتێبخانەی زانکۆی پۆلیتەکنیکی سلێمانی',
    url: 'https://spu.edu.iq',
    category: 'academic',
    totalItems: 8200,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە و داهێنانە تەکنیکی و ئەندازیارییەکان'
  },
  {
    id: 'parliament_krd',
    name: 'Kurdistan Parliament Legal & Archives Library',
    nameKurdish: 'کتێبخانە و ئەرشیڤی یاسایی پەرلەمانی کوردستان',
    url: 'https://www.parliament.krd',
    category: 'kurdish',
    totalItems: 14200,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'یاسا پەسەندکراوەکان، ڕۆژنامەی وەقایعی کوردستان و بەڵگەنامە فەرمییەکان'
  },
  {
    id: 'archive_org',
    name: 'Internet Archive - Kurdish Collections',
    nameKurdish: 'ئەرشیڤی ئینتەرنێت - کۆکراوە دەگمەنەکانی کوردستان',
    url: 'https://archive.org',
    category: 'global',
    totalItems: 85000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەدان هەزار کتێب، دەستنووس و نەخشەی سکانکراوی مێژوویی کوردستان'
  },
  {
    id: 'google_books',
    name: 'Google Books - Kurdish Studies & History',
    nameKurdish: 'گووگڵ بووکس - سەرچاوەکانی کوردناسی و مێژوو',
    url: 'https://books.google.com',
    category: 'global',
    totalItems: 120000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'فەرسەتی گەڕان و خوێندنەوە لە سەدان هەزار کتێبی بڵاوکراوەی جیهانی'
  },
  {
    id: 'hathitrust',
    name: 'HathiTrust Digital Library - Middle East & Kurdish Manuscripts',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی هاتی تراست',
    url: 'https://www.hathitrust.org',
    category: 'global',
    totalItems: 65000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێب و بەڵگەنامەی سکانکراوی زانکۆ پێشەنگەکانی جیهان'
  },
  {
    id: 'worldcat',
    name: 'WorldCat Global Catalog - Kurdish Literature',
    nameKurdish: 'سیستمی کۆی فێرسەکانی جیهانی ورڵدکات',
    url: 'https://www.worldcat.org',
    category: 'global',
    totalItems: 140000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'فێرس و نیشانەی کتێبخانە جیهانییەکان بۆ سەرچاوە کوردییەکان'
  },
  {
    id: 'openlibrary',
    name: 'Open Library - Public Kurdish Digital Books',
    nameKurdish: 'کتێبخانەی کراوەی جیهانی - ئۆپن لایبرێری',
    url: 'https://openlibrary.org',
    category: 'global',
    totalItems: 48000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆڵێک کتێبی گشتی بە فۆرماتی کراوە بۆ دابەزاندن و خوێندنەوە'
  },
  {
    id: 'jstor',
    name: 'JSTOR Academic Archives - Middle Eastern & Kurdish Studies',
    nameKurdish: 'ئەرشیڤی زانستیی جەی ستۆر',
    url: 'https://www.jstor.org',
    category: 'global',
    totalItems: 32000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوەی ئەکادیمیی دادوەرییکراوی گۆڤارە جیهانییەکان'
  },
  {
    id: 'gutenberg',
    name: 'Project Gutenberg - Historic Oriental Studies & Translations',
    nameKurdish: 'پڕۆژەی گووچنبێرگ بۆ کتێبە بەناوبانگەکانی جیهان',
    url: 'https://www.gutenberg.org',
    category: 'global',
    totalItems: 19000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبە کلاسیکەکانی جیهان بە فۆرماتی دیجیتاڵی و کراوە'
  },
  {
    id: 'doabooks',
    name: 'Directory of Open Access Books (DOAB)',
    nameKurdish: 'دایرێکتۆری کتێبە زانستییە کراوەکان (DOAB)',
    url: 'https://www.doabooks.org',
    category: 'global',
    totalItems: 22000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبی ئەکادیمی بێبەرامبەر بە هەموو زمانەکانی جیهان'
  },
  {
    id: 'europeana',
    name: 'Europeana Collections - Kurdish Manuscripts & Maps',
    nameKurdish: 'کۆکراوەکانی کتێبخانەی یەکێتیی ئەوروپا (یۆرۆپیانا)',
    url: 'https://www.europeana.eu',
    category: 'global',
    totalItems: 17500,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس، وێنە و نەخشە مێژووییەکانی موزەخانەکانی ئەوروپا'
  },
  {
    id: 'dpla',
    name: 'Digital Public Library of America (DPLA) - Kurdish Archives',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی گشتیی ئەمریکا',
    url: 'https://dp.la',
    category: 'global',
    totalItems: 28000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤ و سەرچاوە مێژووییەکانی زانکۆ و ئەرشیڤگەڕییەکانی ئەمریکا'
  },
  {
    id: 'kcac',
    name: 'Kurdish Cultural Center & Archives (KCAC)',
    nameKurdish: 'ناوەندی کلتوور و ئەرشیڤی کوردی',
    url: 'https://kcac.org',
    category: 'kurdish',
    totalItems: 11200,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دەنگ، ڕوژنامەگەری و کتێبە ڕەسەنەکانی ناوەندە کوردییەکان'
  }
];

// Combine all library sources and deduplicate by ID
const combinedSourcesMap = new Map<string, LibrarySource>();

[
  ...BASE_DIGITAL_LIBRARY_SOURCES,
  ...ARABIC_LIBRARY_SOURCES,
  ...PERSIAN_LIBRARY_SOURCES,
  ...TURKISH_LIBRARY_SOURCES,
  ...GLOBAL_LIBRARY_SOURCES
].forEach(source => {
  if (!combinedSourcesMap.has(source.id)) {
    combinedSourcesMap.set(source.id, source);
  }
});

export const DIGITAL_LIBRARY_SOURCES: LibrarySource[] = Array.from(combinedSourcesMap.values()).map(source => ({
  ...source,
  status: 'idle',
  lastSync: ''
}));

