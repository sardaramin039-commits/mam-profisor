export interface AcademicRule {
  id: string;
  icon: string;
  title: string;
  desc: string;
  active: boolean;
  isCustom?: boolean;
}

export const DEFAULT_ACADEMIC_RULES: AcademicRule[] = [
  {
    id: 'default_academic_intro',
    icon: 'article',
    title: 'پێشەکی زانستی ٥ سێکژنی ستاندارد',
    desc: 'پێشەکی زانستی بە هیچ شێوەیەک نانووسرێت بە یەک سێکشن؛ پێویستە دەستبەجێ بە تەواوی لە ٥ (پێنج) سێکژنی جیاوازی سەربەخۆدا بنووسرێت (پاشخان، کێشەی توێژینەوە، گرنگی و ئامانجەکان، پرسیارەکان/گریمانەکان، و ڕێکخستنی بەشەکانی تێزەکە) و تەواوی هەمووی بە چڕی دابڕێژرێت.',
    active: true
  },
  {
    id: 'epistemology',
    icon: 'psychology',
    title: 'چوارچێوەی ئیپستۆمۆلۆژی و تیۆری قووڵ',
    desc: 'بەستنەوەی فڕکات بە پارادایمە فیکری و مێتۆدییە جێگیرەکان (Ontological & Epistemological Framework).',
    active: true
  },
  {
    id: 'lexicon',
    icon: 'translate',
    title: 'زاراوەسازیی ورد و توندوتۆڵ',
    desc: 'بەکارهێنانی زاراوەی زانستی دەوڵەمەند و دانانی هاوتا بیانییە باوەکان لەناو کەوانەدا بۆ نموونە (Empirical Analysis).',
    active: true
  },
  {
    id: 'cohesion',
    icon: 'alt_route',
    title: 'سازانی لۆژیکی و بەستەری گوتار',
    desc: 'بەکارهێنانی بەردەوامی نیشاندەری پەیوەندی لۆژیکی نێوان دەستەواژەکان وەک (بەم پێیە، لەم سۆنگەیەوە، بە پێچەوانەوە).',
    active: true
  },
  {
    id: 'citations',
    icon: 'format_quote',
    title: 'سەرچاوەدانی ورد بە شێوازی APA-7',
    desc: 'داڕشتنی ئاماژەی ناوەکی کورت بە شێوەی (Smith, 2023) یان (مستەفا، ٢٠٢٤) لە شوێنی شیاودا لەناو مەتنی بەرهەمەکەدا.',
    active: true
  },
  {
    id: 'purism',
    icon: 'spellcheck',
    title: 'زمانپاکیی ڕێزمانی و گوتاری ئەکادیمی',
    desc: 'ڕێگریکردنی ڕەها لە زمانی ڕاگەیاندن، ڕۆژنامەوانی، یان شێوازی گفتوگۆی ئاسایی؛ دابینکردنی فۆرمی توندوتۆڵی فەرمی.',
    active: true
  },
  {
    id: 'anti_hallucination',
    icon: 'verified_user',
    title: 'پیاچوونەوەی فاکت و دژە-هەڵبەستن',
    desc: 'پابەندبوونی ڕەسەن و پاراستنی فاکتی تەواو بەبێ دروستکردنی هیچ جۆرە گوزارشت یان سەرچاوەیەکی مێژوویی نەسەلمێنراو.',
    active: true
  },
  {
    id: 'dialogic_synthesis',
    icon: 'balance',
    title: 'دیالێکتیک و پێکهەڵپەساردنی بۆچوونەکان',
    desc: 'هێنانە کایەی ڕوانگە هاودژەکان (Thesis & Antithesis) و بەراوردکاری زمانەوانی زۆر بێ لایەن بۆ گەیشتن بە سێنتێز.',
    active: true
  },
  {
    id: 'evidences',
    icon: 'analytics',
    title: 'پشتگیری بەڵگەیی و داتای ئەزموونی',
    desc: 'لێکۆڵینەوە لە دەرئەنجامە ئەزموونییەکان (Empirical Cases) تا کارەکە زۆر تاقیکاری و ساغکراوە بێت.',
    active: true
  },
  {
    id: 'lexicon_align',
    icon: 'auto_stories',
    title: 'زمانساز و گونجاندنی زاراوەکان',
    desc: 'گونجاندنی زمانەوانی و زاراوە تیۆرییە دۆزراوەکانی کایەی زانستی لەگەڵ فەرهەنگی فەرمی بابەتەکە.',
    active: true
  },
  {
    id: 'doctoral_depth',
    icon: 'school',
    title: 'ئاستی تێزەکانی ماستەر و دکتۆرا',
    desc: 'پێشکەشکردنی گوتاری چڕ بە شێوەیەکی فۆرماتکراو و بەرزترین ئاستی ڕەسەنایەتی بۆ تێزی زانکۆیی.',
    active: true
  }
];
