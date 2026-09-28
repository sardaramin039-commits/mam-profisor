import type { AiToolItem } from '../ai-tools-catalog';

export const CATALOG_PART1_A: AiToolItem[] = [
export const CATALOG_PART1: AiToolItem[] = [
  // Block 1: 1–30
  {
    num: 1,
    id: 'openalex_api',
    titleKurdish: 'بەستەری OpenAlex API',
    titleEnglish: 'OpenAlex API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'hub',
    description: 'گەڕانی ڕاستەوخۆ لە زانیاریدانی جیهانیی OpenAlex بۆ دۆزینەوەی وتاری زانستی و ئیندیكسەکان.',
    placeholder: 'کلیلەوشە یان بابەت بنووسە بۆ لێکۆڵینەوە لە OpenAlex...'
  },
  {
    num: 2,
    id: 'crossref_api',
    titleKurdish: 'بەستەری Crossref API',
    titleEnglish: 'Crossref API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'dataset',
    description: 'دۆزینەوەی مێتا-داتای فەرمیی DOI و ژێدەرە بڵاوکراوەکان لە ڕێگەی داتابەیزی Crossref.',
    placeholder: 'ناونیشانی توێژینەوە یان DOI بنووسە بۆ هێنانی داتای Crossref...'
  },
  {
    num: 3,
    id: 'google_books_api',
    titleKurdish: 'بەستەری Google Books API',
    titleEnglish: 'Google Books API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'menu_book',
    description: 'گەڕان لە ملیۆنان کتێبی زانستی و وەرگرتنی زانیاریی نووسەر، ساڵ و چاپخانە.',
    placeholder: 'ناونیشانی کتێب یان ISBN بنووسە بۆ گەڕان لە Google Books...'
  },
  {
    num: 4,
    id: 'research_agent',
    titleKurdish: 'ئەی ئای بریکاری توێژینەوە',
    titleEnglish: 'Research Agent',
    category: 'creation_planning',
    section: '1-30',
    icon: 'smart_toy',
    description: 'بریکارێکی ژیر بۆ ئەنجامدانی توێژینەوەی فرە-قۆناغی و کۆکردنەوەی بەڵگەنامە زانستییەکان.',
    placeholder: 'پرسیاری سەرەکی توێژینەوەکەت بنووسە تا بریکارەکە دەستپێبکات...'
  },
  {
    num: 5,
    id: 'fact_checker',
    titleKurdish: 'پشکنەری ڕاستییەکان',
    titleEnglish: 'Fact Checker',
    category: 'analytics_review',
    section: '1-30',
    icon: 'fact_check',
    description: 'پشکنینی ئەکادیمیی ڕاستییەکان و ئاماژەدان بە داتای دروستکراو بەبێ بەڵگە.',
    placeholder: 'دەق یان وتەیەک بنووسە بۆ پشکنینی ڕاستییەکان...'
  },
  {
    num: 6,
    id: 'source_confidence_score',
    titleKurdish: 'نمرەی متمانەی سەرچاوە',
    titleEnglish: 'Source Confidence Score',
    category: 'analytics_review',
    section: '1-30',
    icon: 'verified',
    description: 'خەمڵاندنی پلەی متمانە و ئەکادیمیی سەرچاوەکان لەسەر پێوەری ژمارەیی (0-100).',
    placeholder: 'سەرچاوە یان ناوی گۆڤارەکە بنووسە بۆ خەمڵاندنی متمانە...'
  },
  {
    num: 7,
    id: 'citation_engine',
    titleKurdish: 'مۆتۆڕی ئاماژەدان',
    titleEnglish: 'Citation Engine',
    category: 'editing_writing',
    section: '1-30',
    icon: 'format_quote',
    description: 'دروستکردنی خۆکاری ئاماژەدان بە شێوازەکانی APA، Harvard، Chicago و IEEE.',
    placeholder: 'زانیاری زانیاریی سەرچاوەکە بنووسە بۆ ئاماژەدانی ڕێکخراو...',
    hasStyleOption: true
  },
  {
    num: 8,
    id: 'semantic_scholar_api',
    titleKurdish: 'بەستەری Semantic Scholar API',
    titleEnglish: 'Semantic Scholar Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'school',
    description: 'گەڕانی دەق و لێکۆڵینەوە لە وتارە هەڵبژێردراوەکانی Semantic Scholar.',
    placeholder: 'بابەت یان ناوی توێژینەوە بنووسە بۆ Semantic Scholar...'
  },
  {
    num: 9,
    id: 'pubmed_api',
    titleKurdish: 'بەستەری PubMed API',
    titleEnglish: 'PubMed API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'medical_services',
    description: 'گەڕان لە داتابەیزی دەرمان، پزیشکی و بایۆلۆجی لە PubMed.',
    placeholder: 'بابەتی پزیشکی یان بایۆلۆجی بنووسە بۆ گەڕانی PubMed...'
  },
  {
    num: 10,
    id: 'open_library_api',
    titleKurdish: 'بەستەری Open Library API',
    titleEnglish: 'Open Library API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'local_library',
    description: 'گەڕان لە کتێبخانەی ئازاد و بێبەرامبەری جیهانیی Open Library.',
    placeholder: 'ناوی کتێب یان نووسەر بنووسە بۆ گەڕانی Open Library...'
  },
  {
    num: 11,
    id: 'internet_archive_api',
    titleKurdish: 'بەستەری Internet Archive API',
    titleEnglish: 'Internet Archive API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'archive',
    description: 'گەڕان لە ئەرشیڤی مێژوویی و بەڵگەنامە دیجیتاڵییەکانی جیهان.',
    placeholder: 'بابەتی مێژوویی یان سەرچاوە بنووسە بۆ گەڕانی ئەرشیڤ...'
  },
  {
    num: 12,
    id: 'doaj_api',
    titleKurdish: 'بەستەری DOAJ API',
    titleEnglish: 'DOAJ API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'library_books',
    description: 'گەڕان لە گۆڤارە ئەکادیمییە کراوەکان (Directory of Open Access Journals).',
    placeholder: 'کلیلەوشە یان بابەتی گۆڤار بنووسە بۆ گەڕانی DOAJ...'
  },
  {
    num: 13,
    id: 'worldcat_api',
    titleKurdish: 'بەستەری WorldCat API',
    titleEnglish: 'WorldCat API Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'public',
    description: 'گەڕان لە کاتالۆگی گشتی کتێبخانەکانی جیهان لە ڕێگەی WorldCat.',
    placeholder: 'ناوی کتێب یان بابەتی زانستی بنووسە بۆ WorldCat...'
  },
  {
    num: 14,
    id: 'europeana_api',
    titleKurdish: 'بەستەری Europeana API',
    titleEnglish: 'Europeana Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'museum',
    description: 'گەڕان لە ئەرشیڤی کلتوری و مێژوویی و دەستنووسەکانی ئەوروپا.',
    placeholder: 'ناوی دەستنووس یان بابەتی کلتوری بنووسە...'
  },
  {
    num: 15,
    id: 'loc_api',
    titleKurdish: 'کتێبخانەی کۆنگرێسی ئەمریکا (LOC)',
    titleEnglish: 'Library of Congress API',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'account_balance',
    description: 'گەڕان لە ئەرشیڤی فەرمیی کتێبخانەی کۆنگرێس (LOC).',
    placeholder: 'بابەت یان بڕگەی مێژوویی بنووسە بۆ گەڕانی LOC...'
  },
  {
    num: 16,
    id: 'oai_pmh_integration',
    titleKurdish: 'هارڤستەری OAI-PMH',
    titleEnglish: 'OAI-PMH Harvesting',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'import_export',
    description: 'کۆکردنەوەی مێتا-داتای زانستی لە ڕێگەی پرۆتۆکۆلی OAI-PMH.',
    placeholder: 'لینکی هێڵی ڕاستەوخۆی OAI-PMH بنووسە...'
  },
  {
    num: 17,
    id: 'ocr_pdf_images',
    titleKurdish: 'سەرقاڵکاری OCR بۆ PDF و وێنە',
    titleEnglish: 'OCR PDF & Images',
    category: 'editing_writing',
    section: '1-30',
    icon: 'document_scanner',
    description: 'دەرهێنانی دەقی کوردی و ئینگلیزی لە وێنە و بەڵگەنامە سڕاوەکاندا.',
    placeholder: 'دەقی سکانکراو بنووسە یان ڕەوانەی بکە بۆ شیکردنەوەی OCR...'
  },
  {
    num: 18,
    id: 'export_latex',
    titleKurdish: 'داکۆپی/ناردن بۆ LaTeX',
    titleEnglish: 'Export to LaTeX',
    category: 'system_workspace',
    section: '1-30',
    icon: 'code',
    description: 'گۆڕینی ڕاستەوخۆی ڕەشنووسەکان بۆ کۆدی ستانداردکراوی LaTeX.',
    placeholder: 'دەقی ئاسایی بنووسە بۆ گۆڕینی بۆ ڕەمزەکانی LaTeX...'
  },
  {
    num: 19,
    id: 'export_epub',
    titleKurdish: 'داکۆپی/ناردن بۆ EPUB',
    titleEnglish: 'Export to EPUB',
    category: 'system_workspace',
    section: '1-30',
    icon: 'book',
    description: 'سازدانی فایلی EPUB بۆ کتێبخانە دیجیتاڵییەکان و ئامێرەکانی خوێندنەوە.',
    placeholder: 'دەق یان بەشەکان بنووسە بۆ سازدانی فایلی EPUB...'
  },
  {
    num: 20,
    id: 'export_markdown',
    titleKurdish: 'داکۆپی/ناردن بۆ Markdown',
    titleEnglish: 'Export to Markdown',
    category: 'system_workspace',
    section: '1-30',
    icon: 'notes',
    description: 'دابەزاندن و ڕێکخستنی دەق بە فۆڕماتی پاکی Markdown.',
    placeholder: 'دەقی ئاسایی بنووسە بۆ ڕێکخستنی بە فۆڕماتی Markdown...'
  },
  {
    num: 21,
    id: 'ai_peer_review',
    titleKurdish: 'پێداچوونەوەی هاوەڵانی ئەی ئای',
    titleEnglish: 'AI Peer Review',
    category: 'analytics_review',
    section: '1-30',
    icon: 'rate_review',
    description: 'شیکاری ڕەخنەیی و هه‌ڵسه‌نگاندنی هاوەڵانە (Peer Review) بەپێی پێوەرەکانی Nature.',
    placeholder: 'ڕەشنووسی بەش یان توێژینەوەکەت بنووسە بۆ هەڵسەنگاندن...'
  },
  {
    num: 22,
    id: 'ai_plagiarism_analysis',
    titleKurdish: 'شیکاری دزینی ئەدەبی',
    titleEnglish: 'AI Plagiarism Analysis',
    category: 'analytics_review',
    section: '1-30',
    icon: 'policy',
    description: 'پشکنینی ئەگەری لێکچوون یان وەرگرتنی ناڕاستەوخۆی دەق بە بێ ئاماژەدان.',
    placeholder: 'دەق بنووسە بۆ ڕێژەی تخمینکراوی لێکچوون...'
  },
  {
    num: 23,
    id: 'citation_validator',
    titleKurdish: 'ساغکەرەوەی ئاماژەدانەکان',
    titleEnglish: 'Citation Validator',
    category: 'analytics_review',
    section: '1-30',
    icon: 'rule',
    description: 'دڵنیابوونەوە لە بەستنی ئاماژەدانە ناوەکییەکان بە لیستی سەرچاوەکانەوە.',
    placeholder: 'دەق لەگەڵ لیستی سەرچاوەکان بنووسە بۆ پشکنین...'
  },
  {
    num: 24,
    id: 'zotero_integration',
    titleKurdish: 'بەستەری Zotero',
    titleEnglish: 'Zotero Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'collections_bookmark',
    description: 'هاوسازکردنی سەرچاوەکان لەگەڵ نەرمەواڵەی زۆتێرۆ (Zotero Export).',
    placeholder: 'زانیاری سەرچاوەکان بنووسە بۆ گۆڕین بۆ ڕێکخراوی Zotero BibTeX...'
  },
  {
    num: 25,
    id: 'mendeley_integration',
    titleKurdish: 'بەستەری Mendeley',
    titleEnglish: 'Mendeley Integration',
    category: 'apis_integrations',
    section: '1-30',
    icon: 'bookmark',
    description: 'هاوسازکردن و هاوردەکردنی سەرچاوەکان بۆ نەرمەواڵەی مندێلی.',
    placeholder: 'زانیاری سەرچاوەکان بنووسە بۆ فۆڕماتی Mendeley...'
  },
];
