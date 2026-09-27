/**
 * Academic Agents Suite Module
 * Structured modular agent architecture for multi-agent academic workflows.
 */

export interface AcademicAgent {
  id: string;
  nameKurdish: string;
  role: string;
  description: string;
  capabilities: string[];
}

export const ACADEMIC_AGENTS: AcademicAgent[] = [
  {
    id: 'research-planner',
    nameKurdish: '1. ئێجێنتی داڕێژەری توێژینەوە (Research Planner)',
    role: 'دیاریکردنی بابەت، ئامانج، پرسیاری توێژینەوە و سنووری کار',
    description: 'داڕشتنی چوارچێوەی گشتی، پرسیارەکانی توێژینەوە، گریمانەکان و سنووردارییە زانستییەکان.',
    capabilities: ['دیاریکردنی بابەت', 'پرسیاری توێژینەوە', 'سنووربەندی ئەکادیمی']
  },
  {
    id: 'literature-review',
    nameKurdish: '2. ئێجێنتی ئەدەبیاتی توێژینەوە (Literature Review Agent)',
    role: 'کۆکردنەوە و هەڵسەنگاندنی ئەدەبیاتی پێشوو',
    description: 'پشکنینی وتار، کتێب و تێزەکان بۆ دۆزینەوەی دەرکەوت و درزە زانستییەکان (Literature Gap).',
    capabilities: ['کۆکردنەوەی پەیپەر', 'دۆزینەوەی Literature Gap', 'پۆلێنکردنی سەرچاوە']
  },
  {
    id: 'source-verification',
    nameKurdish: '3. ئێجێنتی پشتڕاستکەرەوەی سەرچاوە (Source Verification Agent)',
    role: 'پشتڕاستکردنەوەی هەموو سەرچاوەکان',
    description: 'پشکنینی ڕاستی DOI، ISBN، نووسەر، ساڵ و بەڵگەنامەکان لە کتێبخانە دیجیتاڵییەکان.',
    capabilities: ['پشکنینی DOI/ISBN', 'ساغکردنەوەی سەرچاوە', 'ڕێگری لە Hallucination']
  },
  {
    id: 'evidence-extraction',
    nameKurdish: '4. ئێجێنتی دەرهێنانی بەڵگە (Evidence Extraction Agent)',
    role: 'دەرهێنانی بەڵگە و دابەشکردنیان بە پلەی متمانە',
    description: 'دەرهێنانی فاکت، ئامار و وتە بەڵگەدارەکان و پۆلێنکردنیان بەپێی ئاستی متمانە.',
    capabilities: ['دەرهێنانی فاکت', 'پۆلێنکردنی بەڵگە', 'دیاریکردنی ئاستی متمانە']
  },
  {
    id: 'fact-checking',
    nameKurdish: '5. ئێجێنتی پشکنەری ڕاستییەکان (Fact Checking Agent)',
    role: 'پشتڕاستکردنەوەی هەر زانیارییەک لە چەند سەرچاوەی سەربەخۆ',
    description: 'پشکنین و بەراوردکاری زانیارییەکان لەگەڵ بنکەدراوە ئەکادیمییە سەربەخۆکان.',
    capabilities: ['Fact Checking', 'بەراوردکاری سەربەخۆ', 'سڕینەوەی بانگەشەی بێ بەڵگە']
  },
  {
    id: 'methodology',
    nameKurdish: '6. ئێجێنتی میتۆدۆلۆژی (Methodology Agent)',
    role: 'نووسینی ڕێبازی توێژینەوەی دروست',
    description: 'داڕشتنی میتۆدی چەندایەتی، چۆنایەتی یان تێکەڵاو بۆ کۆکردنەوە و شیکاری داتا.',
    capabilities: ['میتۆدی چەندایەتی/چۆنایەتی', 'دیزاینی سامپڵ', 'شیکاری ئاماری']
  },
  {
    id: 'academic-writer',
    nameKurdish: '7. ئێجێنتی نووسەری ئەکادیمی (Academic Writer Agent)',
    role: 'نووسینی دەقی ئەکادیمی بە زمانێکی زانستی و ڕەسەن',
    description: 'نووسینی بەشەکانی تێز و وتاری زانستی بە زمانی کوردی سۆرانی پێوەر بە تەواوی ڕەسەن و بێ AI-footprint.',
    capabilities: ['نووسینی تێز', 'داڕشتنی زانستی', '0% AI Footprint']
  },
  {
    id: 'citation',
    nameKurdish: '8. ئێجێنتی سەرچاوەکان (Citation Agent)',
    role: 'ڕێکخستنی Citation و Bibliography بە شێوازی دیاریکراو',
    description: 'فۆرماتکردنی دەق و بیبلیۆگرافی بە شێوازەکانی APA 7th, Harvard, IEEE, Chicago, MLA.',
    capabilities: ['APA / Harvard / IEEE', 'In-Text Citations', 'دروستکردنی Bibliography']
  },
  {
    id: 'professor',
    nameKurdish: '9. ئێجێنتی پڕۆفیسۆر (Professor Agent)',
    role: 'هەڵسەنگاندنی بابەت و دۆزینەوەی لاوازییە زانستییەکان',
    description: 'دۆزینەوەی کەلەبەرە زانستییەکان، ڕەخنەی قووڵ و پرسیارکردن هاوشێوەی کۆمیتی ماستەر و دکتۆرا.',
    capabilities: ['Viva Voce Simulation', 'ڕەخنەی ئەکادیمی', 'دۆزینەوەی کەلەبەر']
  },
  {
    id: 'reviewer',
    nameKurdish: '10. ئێجێنتی هەڵسەنگێنەر (Reviewer Agent)',
    role: 'پشکنینی وەک هەڵسەنگێنەری گۆڤاری زانستی',
    description: 'هەڵسەنگاندنی سەربەخۆ لەسەر ئاستی Peer-Review ی گۆڤارە جیهانییەکان.',
    capabilities: ['Peer-Review Audit', 'پشکنینی لۆژیک', 'ڕێژەی ئەکادیمی']
  },
  {
    id: 'editor',
    nameKurdish: '11. ئێجێنتی سەرنووسەر (Editor Agent)',
    role: 'چاککردنی زمان، ڕێزمان، ڕێکخستن و ستایل',
    description: 'ڕاستکردنەوەی ڕێنوس، ڕێزمان و بەرزکردنەوەی ڕەوانیی دەق بە شێوەزاری سۆرانی پێوەر.',
    capabilities: ['ڕاستکردنەوەی ڕێنوس', 'یەکخستنی زاراوە', 'ڕەوانی داڕشتن']
  },
  {
    id: 'quality-assurance',
    nameKurdish: '12. ئێجێنتی دڵنیایی جۆری (Quality Assurance Agent)',
    role: 'دڵنیابوون لەوەی هیچ قۆناغێک نەفەوتاوە',
    description: 'پشکنینی کۆتایی تەواوی توێژینەوەکە لەسەر ٧ ڕەهەندی زانستی پێش ڕادەستکردن.',
    capabilities: ['پشکنینی کۆتایی', 'QA Verification', 'دڵنیابوون لە هەموو قۆناغەکان']
  }
];
