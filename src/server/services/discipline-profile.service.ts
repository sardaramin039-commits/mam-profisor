export interface DisciplineProfile {
  id: string;
  name: string;
  style: string;
  preferredMethods: string[];
  sourcePriority: string[];
  terminology: string[];
  structure: string[];
}

const PROFILES: Record<string, DisciplineProfile> = {
  psychology: {
    id: 'psychology',
    name: 'دەروونناسی',
    style: 'ئەمپیری و بەڵگەدار، بە جیاکردنەوەی correlation و causation',
    preferredMethods: ['quantitative', 'qualitative', 'experimental', 'systematic-review'],
    sourcePriority: ['peer-reviewed-journal', 'meta-analysis', 'systematic-review', 'academic-book'],
    terminology: ['گۆڕاو', 'هەڵسەنگاندن', 'نمونە', 'پشتڕاستی', 'کاریگەری'],
    structure: ['کێشە', 'پێداچوونەوەی ئەدەبیات', 'میتۆد', 'داتا', 'شیکردنەوە', 'ئەنجام']
  },
  education: {
    id: 'education',
    name: 'پەروەردە',
    style: 'میدانی و مێتۆدۆلۆژی، بە جیاکردنەوەی تیۆری و داتای مەیدانی',
    preferredMethods: ['survey', 'case-study', 'action-research', 'mixed-methods'],
    sourcePriority: ['peer-reviewed-journal', 'academic-book', 'thesis', 'institutional-report'],
    terminology: ['فێربوون', 'پەروەردە', 'قوتابی', 'مامۆستا', 'هەڵسەنگاندن'],
    structure: ['کێشە', 'تیۆری', 'توێژینەوەکانی پێشوو', 'میتۆد', 'دۆزینەوە', 'گفتوگۆ']
  },
  linguistics: {
    id: 'linguistics',
    name: 'زمانەوانی',
    style: 'ورد و شێوەزاری، بە جیاکردنەوەی شێوەی زمان لە تێڕوانین',
    preferredMethods: ['descriptive', 'comparative', 'corpus', 'historical'],
    sourcePriority: ['peer-reviewed-journal', 'academic-book', 'corpus', 'thesis'],
    terminology: ['مورفیم', 'ڕستە', 'شێوە', 'واتا', 'پێکهاتە'],
    structure: ['پێناسە', 'چوارچێوە', 'داتا', 'شیکاری', 'بەراورد', 'ئەنجام']
  },
  history: {
    id: 'history',
    name: 'مێژوو',
    style: 'سەرچاوە-بنەما، جیاکردنەوەی بەڵگەی سەرەتایی و لاوەکی',
    preferredMethods: ['historical-analysis', 'archival', 'comparative'],
    sourcePriority: ['primary-source', 'archive', 'academic-book', 'peer-reviewed-journal'],
    terminology: ['سەرچاوەی سەرەتایی', 'سەرچاوەی لاوەکی', 'کۆنتێکست', 'دۆکیومێنت'],
    structure: ['کۆنتێکست', 'سەرچاوەکان', 'ڕووداو', 'شیکردنەوە', 'دژەدیدگا', 'ئەنجام']
  },
  literature: {
    id: 'literature',
    name: 'ئەدەب',
    style: 'شیکاری و هەڵسەنگاندنی دەق، بە جیاکردنەوەی تێڕوانین و بەڵگەی دەقی',
    preferredMethods: ['close-reading', 'comparative', 'historical-criticism'],
    sourcePriority: ['primary-text', 'peer-reviewed-journal', 'academic-book', 'thesis'],
    terminology: ['دەق', 'شێواز', 'وێنە', 'ڕۆمان', 'هۆنراوە'],
    structure: ['دەقی سەرەکی', 'چوارچێوەی تیۆری', 'شیکاری', 'بەراورد', 'گفتوگۆ', 'ئەنجام']
  }
};

export class DisciplineProfileService {
  public getProfile(discipline: string): DisciplineProfile {
    const key = String(discipline || '').toLocaleLowerCase().trim();
    const aliases: Record<string, string> = {
      'psychology': 'psychology', 'دەروونناسی': 'psychology',
      'education': 'education', 'پەروەردە': 'education',
      'linguistics': 'linguistics', 'زمانەوانی': 'linguistics',
      'history': 'history', 'مێژوو': 'history',
      'literature': 'literature', 'ئەدەب': 'literature'
    };
    return PROFILES[aliases[key] || key] || {
      id: 'general',
      name: discipline || 'زانستی گشتی',
      style: 'زانستی، بێلایەن و بەڵگەدار',
      preferredMethods: ['descriptive', 'qualitative', 'quantitative', 'mixed-methods'],
      sourcePriority: ['peer-reviewed-journal', 'academic-book', 'thesis', 'institutional-report'],
      terminology: [],
      structure: ['کێشە', 'پێداچوونەوەی ئەدەبیات', 'میتۆد', 'شیکردنەوە', 'گفتوگۆ', 'ئەنجام']
    };
  }
}

export const disciplineProfileService = new DisciplineProfileService();
