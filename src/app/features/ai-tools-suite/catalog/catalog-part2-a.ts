import { AiToolItem } from '../ai-tools-catalog';

export const CATALOG_PART2_A: AiToolItem[] = [
  // Block 3: 51–100
  {
    num: 51,
    id: 'thesis_builder',
    titleKurdish: 'بونیادنەری تێزی ئەکادیمی',
    titleEnglish: 'Thesis Builder',
    category: 'creation_planning',
    section: '31-60',
    icon: 'construction',
    description: 'دروستکردنی ڕەشنووسی بونیادی تێزەکە بە بەکارهێنانی مۆدێلی زانستی.',
    placeholder: 'بابەت و ئامانجەکانی تێزەکە بنووسە...'
  },
  {
    num: 52,
    id: 'dissertation_assistant',
    titleKurdish: 'یارمەتیدەری بڕوانامەی دکتۆرا',
    titleEnglish: 'Dissertation Assistant',
    category: 'creation_planning',
    section: '31-60',
    icon: 'psychology',
    description: 'شیکاری قووڵ و بونیادنانی گریمانەکانی توێژینەوەی بڕوانامەی دکتۆرا.',
    placeholder: 'تەوەر و کێشەی سەرەکی دکتۆراکەت بنووسە...'
  },
  {
    num: 53,
    id: 'literature_map',
    titleKurdish: 'نەخشەی ئەدەبیاتی توێژینەوە',
    titleEnglish: 'Literature Map',
    category: 'analytics_review',
    section: '31-60',
    icon: 'map',
    description: 'دۆزینەوە و دروستکردنی پەیوەندی لە نێوان توێژەران و قوتابخانە زانستییەکان.',
    placeholder: 'کلیلەوشە یان ناوی توێژەرێکی دیار بنووسە...'
  },
  {
    num: 54,
    id: 'citation_graph',
    titleKurdish: 'گرافی ئاماژەدانەکان',
    titleEnglish: 'Citation Graph',
    category: 'analytics_review',
    section: '31-60',
    icon: 'hub',
    description: 'هێڵکاری بینراوی پەیوەندیی ئاماژەدان لە نێوان سەرچاوە زانستییەکاندا.',
    placeholder: 'وتارێکی سەرەکی یان DOI بنووسە...'
  },
  {
    num: 55,
    id: 'topic_clustering',
    titleKurdish: 'دەستەبەندیکردنی بابەتەکان',
    titleEnglish: 'Topic Clustering',
    category: 'analytics_review',
    section: '31-60',
    icon: 'bubble_chart',
    description: 'پۆلێنکردنی دەیان وتاری زانستی بەپێی کلیلەوشە و تەوەرە هاوبەشەکان.',
    placeholder: 'دەق یان وتارەکان بنووسە بۆ پۆلێنکردن...'
  },
  {
    num: 56,
    id: 'research_gap_finder',
    titleKurdish: 'دۆزەرەوەی کەلەبەری زانستی',
    titleEnglish: 'Research Gap Finder',
    category: 'analytics_review',
    section: '31-60',
    icon: 'search_off',
    description: 'دۆزینەوەی ئەو خاڵانەی لە لێکۆڵینەوەکانی پێشووتردا بێ وەڵام ماونەتەوە.',
    placeholder: 'دەق یان پوختەی توێژینەوەکان بنووسە...'
  },
  {
    num: 57,
    id: 'academic_translator',
    titleKurdish: 'وەرگێڕی ئەکادیمیی ژیر',
    titleEnglish: 'Academic Translator',
    category: 'editing_writing',
    section: '31-60',
    icon: 'g_translate',
    description: 'وەرگێڕانی وورد و زانستی لە نێوان ئینگلیزی، کوردی، عەرەبی و فارسی.',
    placeholder: 'دەق بنووسە بۆ وەرگێڕانی ئەکادیمی...',
    hasLanguageOption: true
  },
  {
    num: 58,
    id: 'citation_formatter',
    titleKurdish: 'ڕێکخەری شێوازی ئاماژەدان',
    titleEnglish: 'Citation Formatter',
    category: 'editing_writing',
    section: '31-60',
    icon: 'style',
    description: 'گۆڕینی فۆڕماتی سەرچاوە لە شێوازێکەوە بۆ شێوازێکی تر (APA, Harvard, Chicago).',
    hasStyleOption: true,
    placeholder: 'لیستی سەرچاوەکان بنووسە بۆ گۆڕینی فۆڕماتەکەیان...'
  },
  {
    num: 59,
    id: 'reference_sanitizer',
    titleKurdish: 'پاقژکەرەوەی لیستی سەرچاوەکان',
    titleEnglish: 'Reference Sanitizer',
    category: 'analytics_review',
    section: '31-60',
    icon: 'cleaning_services',
    description: 'ڕاستکردنەوەی کەێنۆکە ڕێزمانییەکان و فۆنت لە لیستی سەرچاوەکاندا.',
    placeholder: 'لیستی سەرچاوەکان بنووسە بۆ خاوێنکردنەوە...'
  },
  {
    num: 60,
    id: 'doi_batch_verifier',
    titleKurdish: 'پشکنەری بڕیی DOI',
    titleEnglish: 'DOI Batch Verifier',
    category: 'apis_integrations',
    section: '31-60',
    icon: 'fact_check',
    description: 'پشکنینی دروستی و کارایی دەیان کدۆدی DOI بە یەک کاتدا.',
    placeholder: 'لیستی کۆدەکانی DOI بنووسە (کۆدێک لە هر دێڕێکدا)...'
  },
  // Block 4: 61–100
  {
    num: 61,
    id: 'abstract_generator',
    titleKurdish: 'دروستکەری پوختەی زانستی (Abstract)',
    titleEnglish: 'Abstract Generator',
    category: 'creation_planning',
    section: '61-90',
    icon: 'short_text',
    description: 'نووسینی پوختەیەکی چڕی توێژینەوە بەپێی پێوەرەکانی Nature و Science.',
    placeholder: 'داتای سەرەکی و دەرئەنجامەکان بنووسە...'
  },
  {
    num: 62,
    id: 'executive_summary',
    titleKurdish: 'سازدەری کورتەی کارگێڕی',
    titleEnglish: 'Executive Summary',
    category: 'creation_planning',
    section: '61-90',
    icon: 'summarize',
    description: 'نووسینی ڕاپۆرتی کورت و بەپەلە بۆ بەڕێوەبەران و بڕیاردەران.',
    placeholder: 'دەق یان ڕاپۆرتەکە بنووسە بۆ کورتکردنەوەی کارگێڕی...'
  },
  {
    num: 63,
    id: 'literature_review_builder',
    titleKurdish: 'بونیادنەری بەشی پێداچوونەوەی ئەدەبیات',
    titleEnglish: 'Literature Review Builder',
    category: 'creation_planning',
    section: '61-90',
    icon: 'history_edu',
    description: 'ڕێکخستن و گێڕانەوەی ڕەوتی مێژوویی سەرچاوەکان لەسەر بابەتێک.',
    placeholder: 'سەرچاوەکان و بابەتەکە بنووسە بۆ دروستکردنی لیتەرەچەر ڕیڤیو...'
  },
  {
    num: 64,
    id: 'methodology_designer',
    titleKurdish: 'دیزاینەری مێتۆدۆلۆژی',
    titleEnglish: 'Methodology Designer',
    category: 'creation_planning',
    section: '61-90',
    icon: 'architecture',
    description: 'نووسین و شیکارکردنی ڕێبازی کۆکردنەوەی داتا (چەندایەتی یان جۆراپۆر).',
    placeholder: 'کێشەی توێژینەوە و ئامانجەکان بنووسە...'
  },
  {
    num: 65,
    id: 'results_analyzer',
    titleKurdish: 'شیکارکەری دەرئەنجامەکان',
    titleEnglish: 'Results Analyzer',
    category: 'analytics_review',
    section: '61-90',
    icon: 'analytics',
    description: 'تەفسیرکردنی داتای کۆکراوە و خستنەڕووی دەرئەنجامە ئەکادیمییەکان.',
    placeholder: 'داتا یان خشتەکان لێرەدا دەستنیشان بکە بۆ شیکاری...'
  },
  {
    num: 66,
    id: 'discussion_builder',
    titleKurdish: 'بونیادنەری بەشی ناوەرۆک و دەمەزەرد',
    titleEnglish: 'Discussion Builder',
    category: 'creation_planning',
    section: '61-90',
    icon: 'comments_disabled',
    description: 'بەراوردکردنی دەرئەنجامەکانی توێژینەوەکەت لەگەڵ تێزی توێژەرانی تر.',
    placeholder: 'دەرئەنجامەکانت لەگەڵ سەرچاوە سەرەکییەکان بنووسە...'
  },
  {
    num: 67,
    id: 'conclusion_generator',
    titleKurdish: 'دروستکەری دەرئەنجام و کۆتایی',
    titleEnglish: 'Conclusion Generator',
    category: 'creation_planning',
    section: '61-90',
    icon: 'task',
    description: 'داڕشتنەوەی دەرئەنجامی سەرەکی و ڕاسپاردەکان بە زمانی ئەکادیمی.',
    placeholder: 'کورتەی دەستکەوتەکانی توێژینەوەکەت بنووسە...'
  },
  {
    num: 68,
    id: 'title_optimizer',
    titleKurdish: 'باشسازکەری ناونیشانی توێژینەوە',
    titleEnglish: 'Title Optimizer',
    category: 'editing_writing',
    section: '61-90',
    icon: 'title',
    description: 'پێشنیارکردنی ۱۰ ناونیشانی ئەکادیمی سەرنجڕاکێش و بەهێز.',
    placeholder: 'ناونیشانی سەرەتایی توێژینەوەکەت بنووسە...'
  },
  {
    num: 69,
    id: 'keyword_extractor',
    titleKurdish: 'دەرهێنەری کلیلەوشەکان',
    titleEnglish: 'Keyword Extractor',
    category: 'analytics_review',
    section: '61-90',
    icon: 'label',
    description: 'دەستنیشانکردنی گرنگترین کلیلەوشەی زانستی (Keywords) بۆ گۆڕین بۆ SEO/Indexing.',
    placeholder: 'دەق یان پوختەی توێژینەوە لێرەدا دابنێ...'
  },
  {
    num: 70,
    id: 'paraphraser_pro',
    titleKurdish: 'داڕێژەرەوەی باڵای زانستی',
    titleEnglish: 'Paraphraser Pro',
    category: 'editing_writing',
    section: '61-90',
    icon: 'published_with_changes',
    description: 'داڕشتنەوەی دەق بە شێوازی نوێ بێ تێکدانی مانای زانستی.',
    placeholder: 'دەقەکە بنووسە بۆ داڕشتنەوەی زانستی...'
  },
  {
    num: 71,
    id: 'grammar_checker',
    titleKurdish: 'پشکنەری ڕێزمان و تەنگسازی',
    titleEnglish: 'Grammar Checker',
    category: 'editing_writing',
    section: '61-90',
    icon: 'spellcheck',
    description: 'ساغکردنەوەی ڕێزمان و هەڵەی ڕێنووس لە دەقی کوردی و ئینگلیزیدا.',
    placeholder: 'دەق بنووسە بۆ پشکنینی هەڵەی ڕێزمانی...'
  },
  {
    num: 72,
    id: 'tone_adjuster',
    titleKurdish: 'ڕێکخەری شێوازی دەربڕین (Tone)',
    titleEnglish: 'Tone Adjuster',
    category: 'editing_writing',
    section: '61-90',
    icon: 'tune',
    description: 'گۆڕینی زمانی نووسین بۆ شێوازی فەرمی، ئەکادیمی، یان گوتاری زانستی.',
    hasToneOption: true,
    placeholder: 'دەق بنووسە بۆ گۆڕینی تۆنی دەربڕینەکە...'
  },
  {
    num: 73,
    id: 'active_passive_converter',
    titleKurdish: 'گۆڕەری بکەرادیار و بکەرنادیار',
    titleEnglish: 'Active/Passive Voice Converter',
    category: 'editing_writing',
    section: '61-90',
    icon: 'swap_horiz',
    description: 'گۆڕینی ڕستەکان لە نێوان شێوازی بکەرادیار (Active) و بکەرنادیار (Passive).',
    placeholder: 'دەق بنووسە بۆ گۆڕینی شێوازی بکەر...'
  },
  {
    num: 74,
    id: 'jargon_simplifier',
    titleKurdish: 'سادەکەرەوەی زاراوە ئاڵۆزەکان',
    titleEnglish: 'Jargon Simplifier',
    category: 'editing_writing',
    section: '61-90',
    icon: 'psychology_alt',
    description: 'گۆڕینی زاراوە سەخت و نادیارەکان بۆ زمانێکی سادە و ڕوون.',
    placeholder: 'دەقی پڕ لە زاراوەی ئاڵۆز بنووسە...'
  },
  {
    num: 75,
    id: 'concise_writer',
    titleKurdish: 'پوختەکەرەوەی دەقی ڕازاوە',
    titleEnglish: 'Concise Writer',
    category: 'editing_writing',
    section: '61-90',
    icon: 'compress',
    description: 'سڕینەوەی وشە زیادەکان و کورتکردنەوەی دەق بە شێوازی چڕ.',
    placeholder: 'دەقێکی درێژ بنووسە بۆ پوختکردنەوەی چڕ...'
  },
];
