import { LibrarySource } from '../../app/models/digital-library.model';

export const ARABIC_LIBRARY_SOURCES_1: LibrarySource[] = [
  {
    id: 'noor_book',
    name: 'Noor Library (مكتبة نور)',
    nameKurdish: 'کتێبخانەی نور بۆ کتێب و ژێدەرە عەرەبییەکان',
    url: 'https://www.noor-book.com/en/',
    category: 'academic',
    totalItems: 85000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گەورەترین کتێبخانەی ئەلیکترۆنیی کراوە بۆ کتێب و نامە زانستییە عەرەبییەکان'
  },
  {
    id: 'arabic_collections_online',
    name: 'Arabic Collections Online (ACO - NYU)',
    nameKurdish: 'کۆکراوەی دیجیتاڵیی ئۆنلاینی عەرەبی (زانکۆی نیویۆڕک)',
    url: 'https://web2.dlib.nyu.edu/',
    category: 'academic',
    totalItems: 29000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی کتێبە عەرەبییە دەگمەن و سکانکراوەکانی زانکۆ بەناوبانگەکانی جیهان'
  },
  {
    id: 'kapl_sa',
    name: 'King Abdulaziz Public Library (مكتبة الملك عبدالعزيز)',
    nameKurdish: 'کتێبخانەی گشتیی مەلیک عەبدولعەزیز',
    url: 'https://www.kapl.org.sa',
    category: 'academic',
    totalItems: 45000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبخانە و ئەرشیڤی گشتیی مێژوویی و ڕۆشنبیریی مەلیک عەبدولعەزیز'
  },
  {
    id: 'sdl_sa',
    name: 'Saudi Digital Library (المكتبة الرقمية السعودية)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی سعودیە',
    url: 'https://sdl.edu.sa',
    category: 'academic',
    totalItems: 120000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گەورەترین ڕیپۆزیتۆری دیجیتاڵی بۆ پەیپەر، تێز و گۆڤارە زانستییەکان'
  },
  {
    id: 'bibalex',
    name: 'Bibliotheca Alexandrina Digital Library (مكتبة الإسكندرية)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی ئەسکەندەرییە',
    url: 'https://www.bibalex.org',
    category: 'academic',
    totalItems: 95000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤ و کاتالۆگی دیجیتاڵیی کتێبخانەی نێودەوڵەتیی ئەسکەندەرییە'
  },
  {
    id: 'daralmandumah',
    name: 'Dar Almandumah (دار المنظومة)',
    nameKurdish: 'بنکەدراوەی زانستیی دار المنظومة',
    url: 'https://daralmazumah.com',
    category: 'academic',
    totalItems: 78000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بنکەدراوەی پێشەنگی گۆڤار و توێژینەوە ئەکادیمییە دادوەرییکراوە عەرەبییەکان'
  },
  {
    id: 'almanhal',
    name: 'Al Manhal Digital Library (المنهل)',
    nameKurdish: 'پۆڕتاڵی دیجیتاڵیی المنهل',
    url: 'https://www.almanhal.com',
    category: 'academic',
    totalItems: 52000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبخانە و بنکەدراوەی تێزە ئەکادیمی و بڵاوکراوە زانستییەکان'
  },
  {
    id: 'hindawi',
    name: 'Hindawi Foundation (مؤسسة هنداوي)',
    nameKurdish: 'دامەزراوەی هینداوی بۆ کتێب و زانست',
    url: 'https://www.hindawi.org',
    category: 'academic',
    totalItems: 24000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبی وەرگێڕدراو و ئەدەبی و زانستی بە بێبەرامبەر و بە کوالیتی بەرز'
  },
  {
    id: 'waqfeya',
    name: 'Al-Waqfeya Digital Library (المكتبة الوقفية)',
    nameKurdish: 'کتێبخانەی وەقفییە بۆ کتێبە ئیسلامی و مێژووییەکان',
    url: 'https://waqfeya.net',
    category: 'academic',
    totalItems: 68000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرچاوە مێژوویی، زمانی و فیکرییەکانی شەرعیی و ئەدەبی'
  },
  {
    id: 'shamela',
    name: 'Al-Shamela Library (المكتبة الشاملة)',
    nameKurdish: 'کتێبخانەی ئینپووتی الشاملة',
    url: 'https://shamela.ws',
    category: 'academic',
    totalItems: 110000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بنکەدراوەی دەقە مێژوویی و کلتوورییە سەرەتاییەکان بە فۆرماتی گەڕانی خێرا'
  },
  {
    id: 'arab_open_lib',
    name: 'Arab Open Library (المكتبة المفتوحة العربية)',
    nameKurdish: 'کتێبخانەی کراوەی عەرەبی',
    url: 'https://arabopenlibrary.org',
    category: 'academic',
    totalItems: 31000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی سەرچاوە کراوەکان و کتێبە فێركارییە زانکۆییەکان'
  },
  {
    id: 'qatar_digital_lib',
    name: 'Qatar Digital Library (مكتبة قطر الرقمية)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی قەتەر',
    url: 'https://www.qdl.qa',
    category: 'academic',
    totalItems: 64000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی بەڵگەنامە، دەستنووس و نەخشە مێژووییەکانی ڕۆژهەڵاتی ناوەڕاست'
  },
  {
    id: 'saudi_national_lib',
    name: 'Saudi National Library (المكتبة الوطنية السعودية)',
    nameKurdish: 'کتێبخانەی نیشتمانیی سعودیە',
    url: 'https://library.moc.gov.sa',
    category: 'academic',
    totalItems: 42000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی نیشتمانیی بڵاوکراوە و کتێبە زانستی و مێژووییەکان'
  },
  {
    id: 'cairo_univ',
    name: 'Cairo University Library (مكتبة جامعة القاهرة)',
    nameKurdish: 'کتێبخانەی زانکۆی قاهیرە',
    url: 'https://cu.edu.eg',
    category: 'academic',
    totalItems: 88000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێزی دکتۆرا و ماستەر و گۆڤارە زانستییەکانی زانکۆی قاهیرە'
  },
  {
    id: 'ksu_lib',
    name: 'King Saud University Library (مكتبة جامعة الملك سعود)',
    nameKurdish: 'کتێبخانەی زانکۆی مەلیک سعود',
    url: 'https://ksu.edu.sa',
    category: 'academic',
    totalItems: 76000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بنکەدراوە و ڕیپۆزیتۆری توێژینەوە ئەکادیمییەکانی زانکۆی مەلیک سعود'
  },
  {
    id: 'jordan_univ',
    name: 'University of Jordan Library (مكتبة الجامعة الأردنية)',
    nameKurdish: 'کتێبخانەی زانکۆی ئوردن',
    url: 'https://library.ju.edu.jo',
    category: 'academic',
    totalItems: 59000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی تێزەکانی ماستەر، دکتۆرا و گۆڤارە توێژینەوەییەکان'
  },
  {
    id: 'aub_lib',
    name: 'AUB Libraries (جامعة الجامعة الأمريكية في بيروت)',
    nameKurdish: 'کتێبخانەی زانکۆی ئەمریکی لە بەیروت',
    url: 'https://libraries.aub.edu.lb',
    category: 'academic',
    totalItems: 63000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دیجیتاڵیی دەستنووس و توێژینەوە ڕۆژهەڵاتناسییەکانی AUB'
  },
  {
    id: 'auc_lib',
    name: 'AUC Library (مكتبة الجامعة الأمريكية بالقاهرة)',
    nameKurdish: 'کتێبخانەی زانکۆی ئەمریکی لە قاهیرە',
    url: 'https://library.aucegypt.edu',
    category: 'academic',
    totalItems: 48000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بڵاوکراوە و توێژینەوە مۆدێرن و ناوچەیییەکانی زانکۆی AUC'
  },
  {
    id: 'uaeu_lib',
    name: 'UAE University Library (مكتبة جامعة الإمارات)',
    nameKurdish: 'کتێبخانەی زانکۆی ئیمارات',
    url: 'https://library.uaeu.ac.ae',
    category: 'academic',
    totalItems: 39000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ڕیپۆزیتۆری دیجیتاڵیی تێزە ئەکادیمی و توێژینەوە زانستییەکان'
  },
  {
    id: 'kuwait_univ',
    name: 'Kuwait University Library (مكتبة جامعة الكويت)',
    nameKurdish: 'کتێبخانەی زانکۆی کوێت',
    url: 'https://library.kuniv.edu.kw',
    category: 'academic',
    totalItems: 44000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرچاوە و تێزە زانستییەکانی زانکۆی کوێت'
  },
  {
    id: 'baghdad_univ',
    name: 'University of Baghdad Library (مكتبة جامعة بغداد)',
    nameKurdish: 'کتێبخانەی زانکۆی بەغداد',
    url: 'https://uobaghdad.edu.iq',
    category: 'academic',
    totalItems: 72000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی گۆڤاری توێژینەوەکان و تێزە زانستییەکانی زانکۆی بەغداد'
  },
  {
    id: 'basrah_univ',
    name: 'University of Basrah Library (مكتبة جامعة البصرة)',
    nameKurdish: 'کتێبخانەی زانکۆی بەسڕە',
    url: 'https://library.uobasrah.edu.iq',
    category: 'academic',
    totalItems: 36000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'خزمەتگوزاریی کتێبخانەی ئەلیکترۆنی و سەرچاوەکانی زانکۆی بەسڕە'
  },
  {
    id: 'mosul_univ',
    name: 'University of Mosul Library (مكتبة جامعة الموصل)',
    nameKurdish: 'کتێبخانەی زانکۆی مووسڵ',
    url: 'https://uomosul.edu.iq',
    category: 'academic',
    totalItems: 41000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی نۆژەنکراوەی کتێب، گۆڤار و دەستنووسەکانی زانکۆی مووسڵ'
  },
  {
    id: 'damascus_univ',
    name: 'Damascus University Library (مكتبة جامعة دمشق)',
    nameKurdish: 'کتێبخانەی زانکۆی دیمەشق',
    url: 'https://damascusuniversity.edu.sy',
    category: 'academic',
    totalItems: 53000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی توێژینەوە پزیشکی، ئەندازیاری و ئەدەبییەکانی زانکۆی دیمەشق'
  },
  {
    id: 'yarmouk_univ',
    name: 'Yarmouk University Library (مكتبة جامعة اليرموك)',
    nameKurdish: 'کتێبخانەی زانکۆی یەرمووک',
    url: 'https://www.yu.edu.jo',
    category: 'academic',
    totalItems: 37000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێزە ئەکادیمییەکان و گۆڤاری توێژینەوەی زانکۆی یەرمووک'
  }
];
