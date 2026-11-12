import { LibrarySource } from '../../app/models/digital-library.model';

export const GLOBAL_LIBRARY_SOURCES_1: LibrarySource[] = [
  {
    id: 'internet_archive',
    name: 'Internet Archive (IA)',
    nameKurdish: 'ئەرشیڤی سەرانسەریی ئینتەرنێت',
    url: 'https://archive.org',
    category: 'academic',
    totalItems: 38000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ملیۆنەها کتێب، توێژینەوە و بەڵگەنامەی مێژوویی کراوە'
  },
  {
    id: 'worldcat',
    name: 'WorldCat Global Network',
    nameKurdish: 'تۆڕی جیهانیی کتێبخانەکان WorldCat',
    url: 'https://www.worldcat.org',
    category: 'academic',
    totalItems: 500000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گەورەترین فێرس و کاتالۆگی کتێبخانەکانی جیهان'
  },
  {
    id: 'google_books',
    name: 'Google Books Engine',
    nameKurdish: 'مەکینەی گەڕانی کتێبی گووگڵ',
    url: 'https://books.google.com',
    category: 'academic',
    totalItems: 40000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئیندیكس و مەتنی تەواوی ملیۆنان کتێبی دیجیتاڵکراو'
  },
  {
    id: 'jstor_org',
    name: 'JSTOR Academic Repository',
    nameKurdish: 'ڕیپۆزیتۆری زانستیی JSTOR',
    url: 'https://www.jstor.org',
    category: 'academic',
    totalItems: 12000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤارە زانستییەکان، کتێبە ئەکادیمییەکان و سەرچاوە سەرەتاییەکان'
  },
  {
    id: 'loc_gov',
    name: 'Library of Congress (LoC)',
    nameKurdish: 'کتێبخانەی کۆنگرێسی ئەمریکا',
    url: 'https://www.loc.gov',
    category: 'academic',
    totalItems: 170000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گەورەترین کتێبخانەی نیشتمانی لە جیهاندا'
  },
  {
    id: 'british_library',
    name: 'British Library Collections',
    nameKurdish: 'کتێبخانەی نیشتمانیی بریتانیا',
    url: 'https://www.bl.uk',
    category: 'academic',
    totalItems: 170000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووسە دەگمەنەکان، ئەرشیڤی ڕۆژهەڵات و بڵاوکراوە جیهانییەکان'
  },
  {
    id: 'hathitrust',
    name: 'HathiTrust Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی هاتی تراست',
    url: 'https://www.hathitrust.org',
    category: 'academic',
    totalItems: 18000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'هاوبەشیی دیجیتاڵیی کتێبخانە زانکۆییە گەورەکانی ئەمریکا و ئەوروپا'
  },
  {
    id: 'gutenberg_org',
    name: 'Project Gutenberg',
    nameKurdish: 'پڕۆژەی گوتنبێرگ بۆ کتێبە کراوەکان',
    url: 'https://www.gutenberg.org',
    category: 'academic',
    totalItems: 70000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبی کلاسیکی بێبەرامبەر لە بوارە جیاوازەکاندا'
  },
  {
    id: 'europeana_eu',
    name: 'Europeana Collections',
    nameKurdish: 'ئەرشیڤی دیجیتاڵیی ئەوروپیی یۆرۆپیانا',
    url: 'https://www.europeana.eu',
    category: 'academic',
    totalItems: 58000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی کلتووری، مێژوویی و ئەکادیمیی مۆزەخانە و کتێبخانەکانی ئەوروپا'
  },
  {
    id: 'doaj_org',
    name: 'DOAJ Open Access Journals',
    nameKurdish: 'فێرسی گۆڤارە زانستییە دەستگەیشتووە کراوەکان (DOAJ)',
    url: 'https://doaj.org',
    category: 'academic',
    totalItems: 9000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤارە زانستییە ئاست بەرزە دادوەرییکراوەکان'
  },
  {
    id: 'doab_org',
    name: 'DOAB Open Access Books',
    nameKurdish: 'فێرسی کتێبە زانستییە دەستگەیشتووە کراوەکان (DOAB)',
    url: 'https://www.doabooks.org',
    category: 'academic',
    totalItems: 75000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبە ئەکادیمییە هەڵسەنگێندراوەکانی زانکۆ باوەڕپێکراوەکان'
  },
  {
    id: 'core_ac_uk',
    name: 'CORE Global Open Papers',
    nameKurdish: 'مەکینەی گەڕانی کۆڕ (CORE UK)',
    url: 'https://core.ac.uk',
    category: 'academic',
    totalItems: 210000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکەرەوەی توێژینەوە و وتارە ئەکادیمییە کراوەکان لە سەرانسەری جیهاندا'
  },
  {
    id: 'semanticscholar',
    name: 'Semantic Scholar AI',
    nameKurdish: 'مەکینەی گەڕانی زانستیی سێمانتیک سکۆلار',
    url: 'https://www.semanticscholar.org',
    category: 'academic',
    totalItems: 200000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'مەکینەی گەڕانی هۆشمەند بۆ شیکردنەوە و دۆزینەوەی ئاماژە زانستییەکان'
  },
  {
    id: 'google_scholar',
    name: 'Google Scholar Repository',
    nameKurdish: 'گووگڵ سکۆلار بۆ وتار و تێزە ئەکادیمییەکان',
    url: 'https://scholar.google.com',
    category: 'academic',
    totalItems: 380000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئیندیكسی سەرانسەریی وتارە ئەکادیمییەکان لە جیهاندا'
  },
  {
    id: 'pubmed_central',
    name: 'PubMed Central (PMC)',
    nameKurdish: 'ئەرشیڤی نیشتمانیی پزیشکیی ئەمریکا PubMed',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/',
    category: 'academic',
    totalItems: 9000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی بێبەرامبەری توێژینەوە پزیشکی و زیندەییەکان'
  },
  {
    id: 'arxiv_org',
    name: 'arXiv Repository (Cornell)',
    nameKurdish: 'ئەرشیڤی کراوەی arXiv (زانکۆی کۆرنێل)',
    url: 'https://arxiv.org',
    category: 'academic',
    totalItems: 2400000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە پێشوەختەکانی فیزیا، بیرکاری، کۆمپیوتەر و بیردۆزەکان'
  },
  {
    id: 'biorxiv_org',
    name: 'bioRxiv Preprints',
    nameKurdish: 'ئەرشیڤی توێژینەوە زیندەیییەکان bioRxiv',
    url: 'https://www.biorxiv.org',
    category: 'academic',
    totalItems: 210000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە ئەکادیمییەکانی زانستە زیندەیییەکان'
  },
  {
    id: 'medrxiv_org',
    name: 'medRxiv Medical Preprints',
    nameKurdish: 'ئەرشیڤی توێژینەوە پزیشکییەکان medRxiv',
    url: 'https://www.medrxiv.org',
    category: 'academic',
    totalItems: 65000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە ئەکادیمییە پزیشکییەکان پێش بڵاوبوونەوەیان لە گۆڤاردا'
  },
  {
    id: 'ssrn_com',
    name: 'SSRN Social Science Network',
    nameKurdish: 'تۆڕی توێژینەوەی زانستە کۆمەڵایەتییەکان SSRN',
    url: 'https://www.ssrn.com',
    category: 'academic',
    totalItems: 1100000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە ئەکادیمییەکان لە بوارەکانی ئابووری، یاسا و زانستە کۆمەڵایەتییەکان'
  },
  {
    id: 'sciencedirect',
    name: 'ScienceDirect (Elsevier)',
    nameKurdish: 'پۆڕتاڵی زانستیی ScienceDirect',
    url: 'https://www.sciencedirect.com',
    category: 'academic',
    totalItems: 19000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'وتاری گۆڤارە زانستییەکان و بەشەکتێبە ئەکادیمییەکان'
  },
  {
    id: 'springerlink',
    name: 'SpringerLink Repository',
    nameKurdish: 'بنکەدراوەی زانستیی شپرینگەر سبرینگەر لینک',
    url: 'https://link.springer.com',
    category: 'academic',
    totalItems: 15000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێب، گۆڤار و بەرهەمە ئەکادیمیییەکانی شپرینگەر'
  },
  {
    id: 'wiley_online',
    name: 'Wiley Online Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی وایلی',
    url: 'https://onlinelibrary.wiley.com',
    category: 'academic',
    totalItems: 10000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێب و گۆڤارە زانستییە باوەڕپێکراوە نێودەوڵەتییەکان'
  },
  {
    id: 'ieee_xplore',
    name: 'IEEE Xplore Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی IEEE Xplore',
    url: 'https://ieeexplore.ieee.org',
    category: 'academic',
    totalItems: 6000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'پایپەری ئەندازیاری، کارەبا، کۆمپیوتەر و تەکنەلۆجیا'
  },
  {
    id: 'acm_digital_lib',
    name: 'ACM Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی ACM بۆ کۆمپیوتەر',
    url: 'https://dl.acm.org',
    category: 'academic',
    totalItems: 3500000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'وتار و کنفرانسە ئەکادیمییەکانی زانستی کۆمپیوتەر'
  },
  {
    id: 'tandfonline',
    name: 'Taylor & Francis Online',
    nameKurdish: 'کتێبخانەی تایلۆر و فرەنسیس',
    url: 'https://www.tandfonline.com',
    category: 'academic',
    totalItems: 5000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'گۆڤارە زانستییەکان لە زانستە مرۆڤایەتی و بنەڕەتییەکاندا'
  }
];
