export type ChecklistStatus = 'complete' | 'partial' | 'missing';

export interface PrismaItem {
  id: number;
  section: string;
  label: string;
}

export interface PrismaFlowCounts {
  identified: number | null;
  duplicatesRemoved: number | null;
  screened: number | null;
  excludedAfterScreening: number | null;
  fullTextAssessed: number | null;
  excludedAfterFullText: number | null;
  included: number | null;
}

export interface PrismaPreflightResult {
  completedItems: number;
  partialItems: number;
  missingItems: number;
  totalItems: number;
  completionPercent: number;
  flowConsistent: boolean;
  flowErrors: string[];
  missingRequiredIds: number[];
  readyForReporting: boolean;
}

export const PRISMA_2020_ITEMS: readonly PrismaItem[] = [
  { id: 1, section: 'ناونیشان', label: 'ڕاپۆرتەکە بە ڕوونی وەک systematic review ناسێنرێت.' },
  { id: 2, section: 'پوختە', label: 'پوختە بە پێی PRISMA 2020 for Abstracts ڕێکخراوە.' },
  { id: 3, section: 'پێشەکی', label: 'هۆکاری ئەنجامدانی review لە کۆنتێکستی زانیاریی پێشوو ڕوونکراوەتەوە.' },
  { id: 4, section: 'پێشەکی', label: 'پرسیار یان ئامانجی review بە شێوەی دیاریکراو نووسراوە.' },
  { id: 5, section: 'مێتۆد', label: 'معیارەکانی inclusion و exclusion دیاریکراون.' },
  { id: 6, section: 'مێتۆد', label: 'هەموو database، register، website و سەرچاوەکانی گەڕان تۆمارکراون.' },
  { id: 7, section: 'مێتۆد', label: 'search strategy بۆ هەر سەرچاوەیەکی سەرەکی بە وردی هەیە.' },
  { id: 8, section: 'مێتۆد', label: 'پڕۆسەی هەڵبژاردنی توێژینەوەکان و چاوپێکەوتنی داوەرەکان ڕوونە.' },
  { id: 9, section: 'مێتۆد', label: 'پڕۆسەی data collection/extraction و ئەوەی چۆن کراوە ڕوونە.' },
  { id: 10, section: 'مێتۆد', label: 'هەموو data items ـە سەرەکییەکانی وەرگیراو دیاریکراون.' },
  { id: 11, section: 'مێتۆد', label: 'ئامراز و شێوازی هەڵسەنگاندنی risk of bias دیاریکراوە.' },
  { id: 12, section: 'مێتۆد', label: 'effect measures ـە بەکارهاتووەکان دیاریکراون، کاتێک پێویستە.' },
  { id: 13, section: 'مێتۆد', label: 'شێوازی synthesis، model و هەر شێوازی گروپکردن ڕوونە.' },
  { id: 14, section: 'مێتۆد', label: 'شێوازی پشکنینی reporting bias دیاریکراوە، کاتێک پێویستە.' },
  { id: 15, section: 'مێتۆد', label: 'شێوازی هەڵسەنگاندنی certainty/confidence ـی evidence دیاریکراوە.' },
  { id: 16, section: 'ئەنجام', label: 'ژمارەی study ـەکان لە هەر قۆناغی selection ـدا و هۆکاری دەرخستن تۆمارکراوە.' },
  { id: 17, section: 'ئەنجام', label: 'تایبەتمەندیی study ـە بەشدارییەکان بۆ هەر سەرچاوەیەک پێشکەشکراوە.' },
  { id: 18, section: 'ئەنجام', label: 'ئەنجامی risk of bias ـی study ـەکان پێشکەشکراوە.' },
  { id: 19, section: 'ئەنجام', label: 'ئەنجامی تاکە study ـەکان بۆ هەر outcome ـێک پێشکەشکراوە، کاتێک پێویستە.' },
  { id: 20, section: 'ئەنجام', label: 'ئەنجامی syntheses و uncertainty بە شێوەی گونجاو پێشکەشکراوە.' },
  { id: 21, section: 'ئەنجام', label: 'نیشانەکانی reporting bias پشکنراون و ڕوونکراونەتەوە.' },
  { id: 22, section: 'ئەنجام', label: 'certainty ـی evidence بۆ outcome ـە سەرەکییەکان ڕوونکراوەتەوە.' },
  { id: 23, section: 'گفتوگۆ', label: 'لێکدانەوەی ئەنجامەکان لەگەڵ evidence ـی پێشوو و سنووردارییەکان هەیە.' },
  { id: 24, section: 'تۆمار و protocol', label: 'ژمارە/لینکی registration و protocol یان هۆکاری نەبوونیان تۆمارکراوە.' },
  { id: 25, section: 'پشتیوانی', label: 'سەرچاوەی پشتیوانی دارایی/مادی و ڕۆڵی sponsor ڕوونە.' },
  { id: 26, section: 'بەرژەوەندی', label: 'competing interests بە ڕوونی تۆمارکراون.' },
  { id: 27, section: 'دووبارەبەکارهێنان', label: 'داتا، code و ماددەی پەیوەندیدار وەک بەردەست/بەردەست نییە ڕوونکراونەتەوە.' }
];

export class SystematicReviewService {
  readonly items = PRISMA_2020_ITEMS;

  assess(statuses: Record<number, ChecklistStatus>, flow: PrismaFlowCounts): PrismaPreflightResult {
    const values = this.items.map(item => statuses[item.id] || 'missing');
    const completedItems = values.filter(value => value === 'complete').length;
    const partialItems = values.filter(value => value === 'partial').length;
    const missingItems = values.filter(value => value === 'missing').length;
    const completionPercent = Math.round(((completedItems + partialItems * 0.5) / this.items.length) * 100);

    const flowErrors: string[] = [];
    const n = flow;
    if (n.identified !== null && n.duplicatesRemoved !== null && n.screened !== null &&
        n.identified - n.duplicatesRemoved !== n.screened) {
      flowErrors.push('ژمارەی screened لەگەڵ identified و duplicatesRemoved یەکسان نییە.');
    }
    if (n.screened !== null && n.excludedAfterScreening !== null && n.fullTextAssessed !== null &&
        n.screened - n.excludedAfterScreening !== n.fullTextAssessed) {
      flowErrors.push('ژمارەی full-text assessed لەگەڵ screened و exclusions یەکسان نییە.');
    }
    if (n.fullTextAssessed !== null && n.excludedAfterFullText !== null && n.included !== null &&
        n.fullTextAssessed - n.excludedAfterFullText !== n.included) {
      flowErrors.push('ژمارەی included لەگەڵ full-text assessed و full-text exclusions یەکسان نییە.');
    }

    const missingRequiredIds = this.items
      .filter(item => (statuses[item.id] || 'missing') !== 'complete')
      .map(item => item.id);

    return {
      completedItems,
      partialItems,
      missingItems,
      totalItems: this.items.length,
      completionPercent,
      flowConsistent: flowErrors.length === 0,
      flowErrors,
      missingRequiredIds,
      readyForReporting: completionPercent === 100 && flowErrors.length === 0
    };
  }
}
