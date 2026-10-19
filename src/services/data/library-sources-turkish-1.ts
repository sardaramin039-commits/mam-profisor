import { LibrarySource } from '../../app/models/digital-library.model';

export const TURKISH_LIBRARY_SOURCES_PART1: LibrarySource[] = [
  {
    id: 'milli_kutuphane',
    name: 'Millî Kütüphane (Türkiye Millî Dijital Kütüphanesi)',
    nameKurdish: 'کتێبخانەی نیشتمانیی تورکیا',
    url: 'https://www.millikutuphane.gov.tr/',
    category: 'academic',
    totalItems: 125000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دیجیتاڵیی نیشتمانیی تورکیا بۆ کتێب و دەستنووسە مێژووییەکان'
  },
  {
    id: 'kasif_catalog',
    name: 'Millî Kütüphane KÂŞİF Catalog',
    nameKurdish: 'فێرسی بنکەدراوە ئەلیکترۆنییەکانی کاشیف',
    url: 'https://www.millikutuphane.gov.tr/page/elektron%C4%B1k-ver%C4%B1tabanlar%C4%B1',
    category: 'academic',
    totalItems: 85000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سیستمی فێرسکردن و گەڕانی سەرچاوە ئەکادیمییەکان'
  },
  {
    id: 'ktb_ekitap',
    name: 'Kültür ve Turizm Bakanlığı E-Kitap',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی وەزارەتی کلتوور و گەشتوگوزار',
    url: 'https://kygm.ktb.gov.tr/TR-1025/e-kitap.html',
    category: 'academic',
    totalItems: 42000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبی ئەلیکترۆنی و سەرچاوە کلتووری و مێژووییەکان'
  },
  {
    id: 'ataturk_kitapligi',
    name: 'Atatürk Kitaplığı İBB Digital Archives',
    nameKurdish: 'کتێبخانە و ئەرشیڤی دیجیتاڵیی ئەتاتورک (ئیستانبوڵ)',
    url: 'https://ataturkkitapligi.ibb.gov.tr/en/Anasayfa',
    category: 'academic',
    totalItems: 98000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'یەکێک لە گەورەترین ئەرشیڤەکانی ڕۆژنامەگەری، نەخشە و کتێبی دەگمەن'
  },
  {
    id: 'ataturk_collections',
    name: 'Atatürk Kitaplığı Special Collections',
    nameKurdish: 'کۆکراوەی سەرچاوە دەگمەنەکانی کتێبخانەی ئەتاتورک',
    url: 'https://ataturkkitapligi.ibb.gov.tr/en/Kitaplik/Koleksiyonlar',
    category: 'academic',
    totalItems: 51000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس، کلاسیات و ئەرشیڤی مێژوویی عوسمانی و ناوچەکە'
  },
  {
    id: 'ttk_kutuphane',
    name: 'Türk Tarih Kurumu Kütüphanesi (TTK)',
    nameKurdish: 'کتێبخانەی دامەزراوەی مێژووی تورکیا',
    url: 'https://ttk.gov.tr/en/kutuphane/',
    category: 'academic',
    totalItems: 67000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرچاوە و بەڵگەنامە مێژووییەکانی ناوچەکە'
  },
  {
    id: 'library_tr',
    name: 'Türkçe Dijital Kütüphane (Library.tr)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زمانی تورکی',
    url: 'https://library.tr/',
    category: 'academic',
    totalItems: 38000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'پۆڕتاڵی کۆکراوەی سەرچاوە و کتێبە ئەلیکترۆنییەکان'
  },
  {
    id: 'dergipark',
    name: 'DergiPark Akademik Platform',
    nameKurdish: 'پۆڕتاڵی گۆڤارە ئەکادیمییەکانی دەرگیپارک',
    url: 'https://dergipark.org.tr',
    category: 'academic',
    totalItems: 145000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گەورەترین مەکینەی گۆڤار و وتارە زانستییە دادوەرییکراوەکان'
  },
  {
    id: 'tr_dizin',
    name: 'TÜBİTAK ULAKBİM TR Dizin',
    nameKurdish: 'بنکەدراوەی زانستیی تی ئاڕ دیزین (TÜBİTAK)',
    url: 'https://trdizin.gov.tr',
    category: 'academic',
    totalItems: 112000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئیندیكسی زانستی و نیشتمانیی وتار و لێکۆڵینەوەکان'
  },
  {
    id: 'yok_tez',
    name: 'YÖK Ulusal Tez Merkezi Archive',
    nameKurdish: 'ناوەندی نیشتمانیی تێزەکانی YÖK',
    url: 'https://tez.yok.gov.tr',
    category: 'academic',
    totalItems: 180000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی سەرجەم تێزەکانی ماستەر و دکتۆرای زانکۆکانی تورکیا'
  },
  {
    id: 'isam_kutuphane',
    name: 'İSAM Center Library (İslâm Araştırmaları)',
    nameKurdish: 'کتێبخانەی ناوەندی لێکۆڵینەوە ئیسلامییەکانی İSAM',
    url: 'https://www.isam.org.tr',
    category: 'academic',
    totalItems: 73000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'یەکێک لە دەوڵەمەندترین ئەرشیڤەکانی مێژوو و فیکر لە ئیستانبوڵ'
  },
  {
    id: 'devlet_arsivleri',
    name: 'State Archives Presidency (Devlet Arşivleri)',
    nameKurdish: 'ئەرشیڤی نیشتمانی و دەوڵەتیی تورکیا',
    url: 'https://www.devletarsivleri.gov.tr',
    category: 'academic',
    totalItems: 160000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی بەڵگەنامە مێژووییەکانی عوسمانی و کۆماریی تورکیا'
  },
  {
    id: 'salt_research',
    name: 'SALT Research Digital Archives',
    nameKurdish: 'ئەرشیڤی توێژینەوەی سالت - SALT',
    url: 'https://archives.saltresearch.org',
    category: 'academic',
    totalItems: 48000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دیجیتاڵیی کلتوور، تەلارسازی و مێژووی هاوچەرخ'
  },
  {
    id: 'koc_library',
    name: 'Koç University Suna Kıraç Library',
    nameKurdish: 'کتێبخانەی زانکۆی کۆچ - ئیستانبوڵ',
    url: 'https://library.ku.edu.tr',
    category: 'academic',
    totalItems: 62000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ڕیپۆزیتۆری ئەکادیمی و کۆکراوە دیجیتاڵییەکانی زانکۆی کۆچ'
  },
  {
    id: 'bogazici_library',
    name: 'Boğaziçi University Library',
    nameKurdish: 'کتێبخانەی زانکۆی بؤغازچی',
    url: 'https://library.bogazici.edu.tr',
    category: 'academic',
    totalItems: 71000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێز، سەرچاوە و ئەرشیڤی دەستنووسەکانی زانکۆی بۆغازچی'
  },
  {
    id: 'istanbul_univ_lib',
    name: 'Istanbul University Central Library',
    nameKurdish: 'کتێبخانەی ناوەندیی زانکۆی ئیستانبوڵ',
    url: 'https://kutuphane.istanbul.edu.tr',
    category: 'academic',
    totalItems: 92000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی مێژوویی، تێزە زانستییەکان و بڵاوکراوەکانی زانکۆی ئیستانبوڵ'
  },
  {
    id: 'ankara_univ_archive',
    name: 'Ankara University Open Archive',
    nameKurdish: 'ئەرشیڤی کراوەی زانکۆی ئەنقەرە',
    url: 'https://acikarsiv.ankara.edu.tr',
    category: 'academic',
    totalItems: 64000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێز، گۆڤار و لێکۆڵینەوە ئەکادیمییەکانی زانکۆی ئەنقەرە'
  },
  {
    id: 'hacettepe_lib',
    name: 'Hacettepe University Library',
    nameKurdish: 'کتێبخانەی زانکۆی هەجەتتەپە',
    url: 'https://library.hacettepe.edu.tr',
    category: 'academic',
    totalItems: 59000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە پزیشکی، زانستی و مرۆڤایەتییەکانی زانکۆی هەجەتتەپە'
  },
  {
    id: 'metu_lib',
    name: 'METU / ODTÜ University Library',
    nameKurdish: 'کتێبخانەی زانکۆی تەکنیکیی ڕۆژهەڵاتی ناوەڕاست (ODTÜ)',
    url: 'https://lib.metu.edu.tr',
    category: 'academic',
    totalItems: 68000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ڕیپۆزیتۆری ئەندازیاری و تێزە ئەکادیمییەکانی ODTÜ'
  },
  {
    id: 'ege_univ_lib',
    name: 'Ege University Library',
    nameKurdish: 'کتێبخانەی زانکۆی ئەگە - ئیزمیر',
    url: 'https://kutuphane.ege.edu.tr',
    category: 'academic',
    totalItems: 47000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەرچاوە و تێزە ئەکادیمییەکانی زانکۆی ئەگە'
  },
  {
    id: 'marmara_univ_lib',
    name: 'Marmara University Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی مەڕمەڕە',
    url: 'https://kutuphane.marmara.edu.tr',
    category: 'academic',
    totalItems: 56000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی تێزەکان و گوڤارە زانستییەکانی زانکۆی مەڕمەڕە'
  },
  {
    id: 'medeniyet_lib',
    name: 'İstanbul Medeniyet Univ Library',
    nameKurdish: 'کتێبخانەی زانکۆی مدەنییەتی ئیستانبوڵ',
    url: 'https://kutuphane.medeniyet.edu.tr',
    category: 'academic',
    totalItems: 34000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەرچاوە و توێژینەوە زانستییەکانی زانکۆی مدەنییەت'
  },
  {
    id: 'anadolu_lib',
    name: 'Anadolu University Library',
    nameKurdish: 'کتێبخانەی زانکۆی ئەنادۆڵو',
    url: 'https://kutuphane.anadolu.edu.tr',
    category: 'academic',
    totalItems: 63000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەرچاوەی فێركاریی ئۆنلاین و ڕیپۆزیتۆری زانستی'
  },
  {
    id: 'deu_lib',
    name: 'Dokuz Eylül University Library',
    nameKurdish: 'کتێبخانەی زانکۆی دۆکوز ئەیلول - ئیزمیر',
    url: 'https://kutuphane.deu.edu.tr',
    category: 'academic',
    totalItems: 42000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێز و سەرچاوە زانستییەکانی زانکۆی دۆکوز ئەیلول'
  },
  {
    id: 'gazi_lib',
    name: 'Gazi University Library',
    nameKurdish: 'کتێبخانەی زانکۆی گازی - ئەنقەرە',
    url: 'https://kutuphane.gazi.edu.tr',
    category: 'academic',
    totalItems: 58000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی سەرچاوە پۆست گڕادوەیت و تێزەکانی زانکۆی گازی'
  }
];
