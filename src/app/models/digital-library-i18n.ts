import { SupportedLanguage } from './digital-library.model';

export interface UIStrings {
  appName: string;
  searchPlaceholder: string;
  allSources: string;
  allLanguages: string;
  allSubjects: string;
  allDocTypes: string;
  filterTitle: string;
  sourcesTitle: string;
  yearRange: string;
  sortBy: string;
  readOnline: string;
  downloadPdf: string;
  bookmark: string;
  bookmarked: string;
  sourceBadge: string;
  adminDashboard: string;
  syncNow: string;
  syncSuccess: string;
  ocrExtract: string;
  ocrProcessing: string;
  readingHistory: string;
  myBookmarks: string;
  searchResults: string;
  noResults: string;
  clearFilters: string;
  darkLightMode: string;
  languageName: string;
  crawlingStatus: string;
}

export const I18N_DICTIONARY: Record<SupportedLanguage, UIStrings> = {
  ckb: {
    appName: 'کتێبخانەی دیجیتاڵیی کوردی',
    searchPlaceholder: 'گەڕانی ژیر لە ناونیشان، نووسەر، بابەت، دەستنووس یان ناوەرۆک...',
    allSources: 'سەرجەم ٤٠ کتێبخانە و ئەرشیڤەکە',
    allLanguages: 'هەموو زمانەکان',
    allSubjects: 'سەرجەم بابەتەکان',
    allDocTypes: 'سەرجەم جۆرەکانی بەڵگەنامە',
    filterTitle: 'فلتەرە پێشکەوتووەکان',
    sourcesTitle: 'کۆکراوەی ٤٠ کتێبخانە و ئەرشیڤی دیجیتاڵی',
    yearRange: 'ساڵی بڵاوکردنەوە',
    sortBy: 'ڕێکخستن بەپێی',
    readOnline: 'خوێندنەوەی سەرهێڵ',
    downloadPdf: 'دابەزاندنی PDF',
    bookmark: 'پاشەکەوتکردن',
    bookmarked: 'پاشەکەوتکراوە',
    sourceBadge: 'سەرچاوە',
    adminDashboard: 'داشبۆردی بەڕێوەبەرایەتی و ڕەوتکردنەوە',
    syncNow: 'دەستپێکردنی ڕەوتکردنەوە (Sync Now)',
    syncSuccess: 'هاودەمکردن بەسەرکەوتوویی ئەنجامدرا',
    ocrExtract: 'دەرھێنانی دەق بە OCR',
    ocrProcessing: 'پڕۆسەکردنی وێنە و بەڵگەنامە بە ژیریی دەستکرد...',
    readingHistory: 'مێژووی خوێندنەوە',
    myBookmarks: 'کتێبە پاشەکەوتکراوەکانم',
    searchResults: 'ئەنجامەکانی گەڕان',
    noResults: 'هیچ کتێبێک یان بەڵگەنامەیەک نەدۆزرایەوە',
    clearFilters: 'سڕینەوەی فلتەرەکان',
    darkLightMode: 'دۆخی شەو/ڕۆژ',
    languageName: 'کوردی (سۆرانی)',
    crawlingStatus: 'بارودۆخی ڕۆژانەی گەڕان و خاوێنکردنەوە'
  },
  kmr: {
    appName: 'Pirtûkxaneya Dîjîtal a Kurdî',
    searchPlaceholder: 'Lêgerîna biaqil di nav sernav, nivîskar, mijar û naverokê de...',
    allSources: 'Hemû 40 Pirtûkxane û Arşîv',
    allLanguages: 'Hemû Ziman',
    allSubjects: 'Hemû Mijar',
    allDocTypes: 'Hemû Cureyên Belgeyan',
    filterTitle: 'Fîlterên Pêşketî',
    sourcesTitle: 'Koleksiyona 40 Arşîvên Dîjîtal',
    yearRange: 'Sala Weşanê',
    sortBy: 'Rêzkirin li gorî',
    readOnline: 'Serserî Bixwîne',
    downloadPdf: 'PDF Daxîne',
    bookmark: 'Pleysek bike',
    bookmarked: 'Hate tomar kirin',
    sourceBadge: 'Çavkanî',
    adminDashboard: 'Panela Rêveberiyê û Senkronîzasyonê',
    syncNow: 'Nûvekirin / Sync Bike',
    syncSuccess: 'Senkronîzasyon bi serkeftî hate kirin',
    ocrExtract: 'Nivîsê bi OCR Derxîne',
    ocrProcessing: 'Pêvajoya AI OCR berdewam e...',
    readingHistory: 'Dîroka Xwendinê',
    myBookmarks: 'Pirtûkên Min ên Tomarkirî',
    searchResults: 'Encamên Lêgerînê',
    noResults: 'Çu pirtûk an belge nehate dîtin',
    clearFilters: 'Fîlteran Paqij Bike',
    darkLightMode: 'Rewşa Şev / ڕۆژ',
    languageName: 'Kurdî (Kurmancî)',
    crawlingStatus: 'Statûya Arşîvkirinê'
  },
  ar: {
    appName: 'المكتبة الرقمية الكردية الشاملة',
    searchPlaceholder: 'البحث الذكي في العناوين، المؤلفين، المواضيع، المخطوطات والتحليل...',
    allSources: 'جميع المكتبات والأرشيفات الـ ٤٠',
    allLanguages: 'جميع اللغات',
    allSubjects: 'جميع المواضيع',
    allDocTypes: 'جميع أنواع الوثائق',
    filterTitle: 'الفلاتر المتقدمة',
    sourcesTitle: 'مجموعة ٤٠ مكتبة وأرشيف رقمي',
    yearRange: 'سنة النشر',
    sortBy: 'ترتيب حسب',
    readOnline: 'قراءة عبر الإنترنت',
    downloadPdf: 'تحميل PDF',
    bookmark: 'حفظ المرجع',
    bookmarked: 'محفوظ',
    sourceBadge: 'المصدر',
    adminDashboard: 'لوحة الإدارة والمزامنة الفورية',
    syncNow: 'بدء المزامنة والزحف (Sync Now)',
    syncSuccess: 'تمت المزامنة بنجاح',
    ocrExtract: 'استخراج النص بالذكاء الاصطناعي (OCR)',
    ocrProcessing: 'جاري معالجة الوثيقة والمخطوطة...',
    readingHistory: 'سجل القراءة',
    myBookmarks: 'كتبـي المحفوظة',
    searchResults: 'نتائج البحث',
    noResults: 'لم يتم العثور على أي كتب أو وثائق مطابقة',
    clearFilters: 'إعادة ضبط الفلاتر',
    darkLightMode: 'الوضع الليلي / النهاري',
    languageName: 'العربية',
    crawlingStatus: 'حالة الزحف والفهرسة اليومية'
  },
  en: {
    appName: 'Kurdish Multilingual Digital Library',
    searchPlaceholder: 'Smart AI search by title, author, topic, manuscript or full-text...',
    allSources: 'All 40 Libraries & Archives',
    allLanguages: 'All Languages',
    allSubjects: 'All Subjects',
    allDocTypes: 'All Document Types',
    filterTitle: 'Advanced Filters',
    sourcesTitle: 'Indexed Collection of 40 Digital Repositories',
    yearRange: 'Publication Year',
    sortBy: 'Sort By',
    readOnline: 'Read Online',
    downloadPdf: 'Download PDF',
    bookmark: 'Bookmark',
    bookmarked: 'Bookmarked',
    sourceBadge: 'Source',
    adminDashboard: 'Admin Control & Crawler Dashboard',
    syncNow: 'Start Crawler Sync Now',
    syncSuccess: 'Synchronization completed successfully',
    ocrExtract: 'AI OCR Text Extraction',
    ocrProcessing: 'Extracting text from scanned pages using Gemini...',
    readingHistory: 'Reading History',
    myBookmarks: 'My Saved Books',
    searchResults: 'Search Results',
    noResults: 'No books or manuscripts matched your criteria',
    clearFilters: 'Reset Filters',
    darkLightMode: 'Dark / Light Mode',
    languageName: 'English',
    crawlingStatus: 'Daily Crawler & Indexing Status'
  },
  fa: {
    appName: 'کتابخانه دیجیتال جامع کردی',
    searchPlaceholder: 'جستجوی هوشمند در عناوین، نویسندگان، موضوعات و نسخ خطی...',
    allSources: 'تمامی ۴۰ کتابخانه و آرشیو',
    allLanguages: 'همه زبان‌ها',
    allSubjects: 'همه موضوعات',
    allDocTypes: 'همه انواع اسناد',
    filterTitle: 'فیلترهای پیشرفته',
    sourcesTitle: 'مجموعه ۴۰ مخزن دیجیتال',
    yearRange: 'سال انتشار',
    sortBy: 'مرتب‌سازی بر اساس',
    readOnline: 'مطالعه آنلاین',
    downloadPdf: 'دانلود PDF',
    bookmark: 'نشان‌گذاری',
    bookmarked: 'نشان‌شده',
    sourceBadge: 'منبع',
    adminDashboard: 'پنل مدیریت و همگام‌سازی',
    syncNow: 'شروع همگام‌سازی (Sync Now)',
    syncSuccess: 'همگام‌سازی با موفقیت انجام شد',
    ocrExtract: 'استخراج متن با هوش مصنوعی (OCR)',
    ocrProcessing: 'در حال پردازش سند با هوش مصنوعی...',
    readingHistory: 'تاریخچه مطالعه',
    myBookmarks: 'کتاب‌های نشان‌شده من',
    searchResults: 'نتایج جستجو',
    noResults: 'هیچ کتاب یا سندی یافت نشد',
    clearFilters: 'پاک‌سازی فیلترها',
    darkLightMode: 'حالت شب / روز',
    languageName: 'فارسی',
    crawlingStatus: 'وضعیت روزانه پایش و نمایه'
  },
  tr: {
    appName: 'Kürtçe Çok Dilli Dijital Kütüphane',
    searchPlaceholder: 'Başlık, yazar, konu, el yazması veya metin içi akıllı arama...',
    allSources: 'Tüm 40 Kütüphane ve Arşiv',
    allLanguages: 'Tüm Diller',
    allSubjects: 'Tüm Konular',
    allDocTypes: 'Tüm Belge Türleri',
    filterTitle: 'Gelişmiş Filtreler',
    sourcesTitle: '40 Dijital Arşiv Koleksiyonu',
    yearRange: 'Yayın Yılı',
    sortBy: 'Sırala',
    readOnline: 'Çevrimiçi Oku',
    downloadPdf: 'PDF İndir',
    bookmark: 'Kaydet',
    bookmarked: 'Kaydedildi',
    sourceBadge: 'Kaynak',
    adminDashboard: 'Yönetim ve Senkronizasyon Paneli',
    syncNow: 'Senkronizasyonu Başlat',
    syncSuccess: 'Senkronizasyon başarıyla tamamlandı',
    ocrExtract: 'Yapay Zeka OCR Metin Çıkarma',
    ocrProcessing: 'Tarama metni işleniyor...',
    readingHistory: 'Okuma Geçmişi',
    myBookmarks: 'Kaydedilen Kitaplarım',
    searchResults: 'Arama Sonuçları',
    noResults: 'Aramanızla eşleşen kitap bulunamadı',
    clearFilters: 'Filtreleri Temizle',
    darkLightMode: 'Karanlık / Aydınlık Mod',
    languageName: 'Türkçe',
    crawlingStatus: 'Günlük Tarama Durumu'
  }
};
