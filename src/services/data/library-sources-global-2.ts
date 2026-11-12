import { LibrarySource } from '../../app/models/digital-library.model';

export const GLOBAL_LIBRARY_SOURCES_2: LibrarySource[] = [
  {
    id: 'cambridge_core',
    name: 'Cambridge Core (Oxford/Cambridge)',
    nameKurdish: 'پۆڕتاڵی ئەکادیمیی کامبریج کۆڕ',
    url: 'https://www.cambridge.org/core',
    category: 'academic',
    totalItems: 2200000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێب و گۆڤارە زانستییەکانی زانکۆی کامبریج'
  },
  {
    id: 'academic_oup',
    name: 'Oxford Academic (OUP)',
    nameKurdish: 'پۆڕتاڵی ئەکادیمیی زانکۆی ئۆکسفۆرد',
    url: 'https://academic.oup.com',
    category: 'academic',
    totalItems: 2500000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بڵاوکراوە و گۆڤارە ئەکادیمییەکانی زانکۆی ئۆکسفۆرد'
  },
  {
    id: 'open_edition',
    name: 'OpenEdition Humanities Portal',
    nameKurdish: 'پۆڕتاڵی زانستە مرۆڤایەتییەکانی ئۆپن ئیدیشن',
    url: 'https://www.openedition.org',
    category: 'academic',
    totalItems: 180000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کۆکراوەی کتێب و گۆڤارەکانی زانستە کۆمەڵایەتییەکان لە ئەوروپا'
  },
  {
    id: 'gallica_bnf',
    name: 'Gallica (BnF France)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی گالیکا (کتێبخانەی نیشتمانیی فەڕەنسا)',
    url: 'https://gallica.bnf.fr',
    category: 'academic',
    totalItems: 10000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دەستنووس، نەخشە و کتێبە مێژووییەکانی فەڕەنسا'
  },
  {
    id: 'bne_es',
    name: 'Biblioteca Digital Hispánica (BNE)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی نیشتمانیی ئیسپانیا',
    url: 'https://bdh.bne.es',
    category: 'academic',
    totalItems: 320000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس، نەخشە و کتێبە دەگمەنە مێژووییەکان'
  },
  {
    id: 'zbw_eu',
    name: 'EconBiz (ZBW Economics Germany)',
    nameKurdish: 'ناوەندی زانیاریی ئابووریی ئەڵمانیا EconBiz',
    url: 'https://www.econbiz.de',
    category: 'academic',
    totalItems: 11000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'پۆڕتاڵی توێژینەوە ئابووری و بازرگانییەکان لە جیهاندا'
  },
  {
    id: 'bav_vat',
    name: 'Vatican Digital Library (DigiVatLib)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی ڤاتیکان DigiVatLib',
    url: 'https://digi.vatlib.it',
    category: 'academic',
    totalItems: 25000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووسە کەلەپووری و مێژووییەکانی جیهان'
  },
  {
    id: 'dl_harvard',
    name: 'Harvard Digital Collections',
    nameKurdish: 'کۆکراوە دیجیتاڵییەکانی زانکۆی هارڤارد',
    url: 'https://library.harvard.edu/digital-collections',
    category: 'academic',
    totalItems: 6000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس، وێنە و بەڵگەنامە دەگمەنەکانی زانکۆی هارڤارد'
  },
  {
    id: 'bodleian_oxford',
    name: 'Bodleian Digital Library (Oxford)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی بودلیان (ئۆکسفۆرد)',
    url: 'https://digital.bodleian.ox.ac.uk',
    category: 'academic',
    totalItems: 1200000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووس و بڵاوکراوە نایابەکانی زانکۆی ئۆکسفۆرد'
  },
  {
    id: 'stanford_dl',
    name: 'Stanford Digital Repository',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی ستانفۆرد',
    url: 'https://sdr.stanford.edu',
    category: 'academic',
    totalItems: 2100000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ڕیپۆزیتۆری ئەکادیمی و کاتالۆگی توێژینەوەکانی ستانفۆرد'
  },
  {
    id: 'yale_dl',
    name: 'Yale University Digital Collections',
    nameKurdish: 'کۆکراوە دیجیتاڵییەکانی زانکۆی یەیڵ',
    url: 'https://collections.yale.edu',
    category: 'academic',
    totalItems: 1800000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دەستنووس و توێژینەوە نایابەکانی زانکۆی یەیڵ'
  },
  {
    id: 'mit_dspace',
    name: 'DSpace@MIT Research Repository',
    nameKurdish: 'ڕیپۆزیتۆری توێژینەوەکانی MIT',
    url: 'https://dspace.mit.edu',
    category: 'academic',
    totalItems: 120000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێز و وتارە زانستییەکانی پەیمانگای تەکنەلۆجیی ماساچوسێتس'
  },
  {
    id: 'caltech_authors',
    name: 'Caltech Authors Repository',
    nameKurdish: 'ڕیپۆزیتۆری توێژینەوەکانی زانکۆی کالتێک',
    url: 'https://authors.library.caltech.edu',
    category: 'academic',
    totalItems: 95000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'بڵاوکراوە زانستی و فیزیاو تەکنەلۆجییەکانی کالتێک'
  },
  {
    id: 'columbia_academic_commons',
    name: 'Columbia Academic Commons',
    nameKurdish: 'ڕیپۆزیتۆری ئەکادیمیی زانکۆی کۆلۆمبیا',
    url: 'https://academiccommons.columbia.edu',
    category: 'academic',
    totalItems: 85000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تێز و سەرچاوە زانستییەکانی زانکۆی کۆلۆمبیا'
  },
  {
    id: 'princeton_diglib',
    name: 'Princeton University Digital Library',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی پرینستۆن',
    url: 'https://dpul.princeton.edu',
    category: 'academic',
    totalItems: 920000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'ئەرشیڤی دەستنووسە ڕۆژهەڵاتییەکان و بڵاوکراوەکانی پرینستۆن'
  },
  {
    id: 'cambridge_cudl',
    name: 'Cambridge Digital Library (CUDL)',
    nameKurdish: 'کتێبخانەی دیجیتاڵیی زانکۆی کامبریج',
    url: 'https://cudl.lib.cam.ac.uk',
    category: 'academic',
    totalItems: 650000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووسە زانستی و مێژووییەکانی نیوتن، داروین و زانایان'
  },
  {
    id: 'eth_e_rara',
    name: 'e-rara Rare Books (ETH Zurich)',
    nameKurdish: 'ئەرشیڤی کتێبە دەگمەنەکانی ETH زیوریخ e-rara',
    url: 'https://www.e-rara.ch',
    category: 'academic',
    totalItems: 92000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'کتێبە زانستی و مێژووییە سکانکراوەکانی سویسرا'
  },
  {
    id: 'eth_e_manuscripta',
    name: 'e-manuscripta (Switzerland)',
    nameKurdish: 'پۆڕتاڵی دەستنووسەکانی سویسرا e-manuscripta',
    url: 'https://www.e-manuscripta.ch',
    category: 'academic',
    totalItems: 110000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'دەستنووسە مێژوویی و زانستییە دیجیتاڵکراوەکان'
  },
  {
    id: 'openalex_org',
    name: 'OpenAlex Index',
    nameKurdish: 'ئیندیكسی کراوەی زانستیی جیهانی OpenAlex',
    url: 'https://openalex.org',
    category: 'academic',
    totalItems: 250000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'تۆڕی کراوەی گشتگیری توێژینەوە، دانەران و سەرچاوەکان'
  },
  {
    id: 'zenodo_org',
    name: 'Zenodo Open Repository (CERN)',
    nameKurdish: 'ڕیپۆزیتۆری کراوەی Zenodo (سێرن - CERN)',
    url: 'https://zenodo.org',
    category: 'academic',
    totalItems: 3500000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'داتا، وتار و بڵاوکراوە زانستییە کراوەکان'
  },
  {
    id: 'figshare_com',
    name: 'Figshare Research Data',
    nameKurdish: 'بنکەدراوەی داتای توێژینەوەی Figshare',
    url: 'https://figshare.com',
    category: 'academic',
    totalItems: 5000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'داتای ئەکادیمی، پەیپەر و ئەنجامە زانستییەکان'
  },
  {
    id: 'osf_io',
    name: 'Open Science Framework (OSF)',
    nameKurdish: 'چوارچێوەی زانستی کراوە OSF',
    url: 'https://osf.io',
    category: 'academic',
    totalItems: 1500000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'توێژینەوە و داتاسێتی هەڕەمەکی و ئەکادیمی'
  },
  {
    id: 'researchgate_net',
    name: 'ResearchGate Academic Network',
    nameKurdish: 'تۆڕی ئەکادیمیی ڕیسێرچ گەیت',
    url: 'https://www.researchgate.net',
    category: 'academic',
    totalItems: 135000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'پایپەری توێژەران و وتارە زانستییە ڕاستەوخۆکان'
  },
  {
    id: 'academia_edu',
    name: 'Academia.edu Repository',
    nameKurdish: 'تۆڕی زانستیی ئەکادیمیا',
    url: 'https://www.academia.edu',
    category: 'academic',
    totalItems: 40000000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'وتار و توێژینەوە ئەکادیمییەکانی مامۆستایان و خوێندکارانی زانکۆ'
  },
  {
    id: 'smithsonian_digital',
    name: 'Smithsonian Digital Collections',
    nameKurdish: 'ئەرشیڤی دیجیتاڵیی سمیسۆنیان (ئەمریکا)',
    url: 'https://www.si.edu/openaccess',
    category: 'academic',
    totalItems: 4500000,
    lastSync: new Date().toISOString(),
    status: 'active',
    description: 'سەرچاوەی بێبەرامبەر و بەڵگەنامەی مێژوویی و زانستی'
  }
];
