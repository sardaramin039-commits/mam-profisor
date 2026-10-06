import { Injectable, signal } from '@angular/core';

export interface LexiconEntry {
  id: string;
  kurdishTerm: string;
  englishTerm: string;
  arabicTerm: string;
  discipline: 'زانستە مرۆڤایەتییەکان' | 'زانستە کۆمەڵایەتییەکان' | 'زانستە سروشتییەکان' | 'میتۆدۆلۆژیا و فەلسەفە';
  academicDefinition: string;
  usageContextKurdish: string;
}

export interface UniversityThesisPreset {
  id: string;
  universityNameKurdish: string;
  fontFamily: string;
  fontSizeTitlePt: number;
  fontSizeBodyPt: number;
  lineSpacing: number; // 1.5, 2.0
  marginCm: { top: number; bottom: number; right: number; left: number };
  citationStyle: 'APA 7th' | 'Chicago / Turabian' | 'Harvard' | 'IEEE';
  prefaceOrder: string[];
}

export interface FormattedCitationKurdish {
  inTextCitation: string;
  fullBibliography: string;
  styleName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcademicLexiconStandardsService {
  readonly activeUniversityPreset = signal<string>('uok_sulaimani');
  readonly selectedDiscipline = signal<string>('هەموو بوارەکان');

  readonly universityPresets: UniversityThesisPreset[] = [
    {
      id: 'uok_sulaimani',
      universityNameKurdish: 'زانکۆی سلێمانی',
      fontFamily: 'Unikurd Goran / Ali K',
      fontSizeTitlePt: 16,
      fontSizeBodyPt: 12,
      lineSpacing: 1.5,
      marginCm: { top: 3.0, bottom: 2.5, right: 3.5, left: 2.5 },
      citationStyle: 'APA 7th',
      prefaceOrder: ['ئایەتی قورئان', 'پەڕەی پەسەندکردن', 'پێشکەشکردن', 'سوپاس و پێزانین', 'پوختە بە کوردی', 'پوختە بە ئینگلیزی', 'پێڕستی بابەتەکان']
    },
    {
      id: 'uok_salahaddin',
      universityNameKurdish: 'زانکۆی سەڵاحەدین - هەولێر',
      fontFamily: 'Kurdish Ali / Arial Unicode',
      fontSizeTitlePt: 16,
      fontSizeBodyPt: 12,
      lineSpacing: 1.5,
      marginCm: { top: 3.0, bottom: 2.5, right: 3.0, left: 2.5 },
      citationStyle: 'APA 7th',
      prefaceOrder: ['پەڕەی پەسەندکردن', 'پوختە بە کوردی', 'پوختە بە ئینگلیزی', 'پێڕست', 'خشتە و هێڵکارییەکان']
    },
    {
      id: 'uok_duhok',
      universityNameKurdish: 'زانکۆی دهۆک',
      fontFamily: 'Times New Roman / Calibri',
      fontSizeTitlePt: 16,
      fontSizeBodyPt: 12,
      lineSpacing: 1.5,
      marginCm: { top: 3.0, bottom: 2.5, right: 3.5, left: 2.5 },
      citationStyle: 'Harvard',
      prefaceOrder: ['پەڕەی فەرمی', 'سوپاسگوزاری', 'پوختە', 'پێڕستی سەرەکی']
    },
    {
      id: 'uok_polytechnic',
      universityNameKurdish: 'زانکۆی پۆلیتەکنیکی هەولێر / سلێمانی',
      fontFamily: 'Segoe UI / Arial',
      fontSizeTitlePt: 14,
      fontSizeBodyPt: 11,
      lineSpacing: 1.15,
      marginCm: { top: 2.5, bottom: 2.5, right: 2.5, left: 2.5 },
      citationStyle: 'IEEE',
      prefaceOrder: ['Title Page', 'Approval', 'Abstract', 'Table of Contents', 'List of Figures']
    }
  ];

  readonly comparativeLexicon: LexiconEntry[] = [
    {
      id: 'lex_1',
      kurdishTerm: 'ئیپیستمۆلۆژیا (تیۆریی مەعریفە)',
      englishTerm: 'Epistemology',
      arabicTerm: 'نظرية المعرفة / الإبستمولوجيا',
      discipline: 'میتۆدۆلۆژیا و فەلسەفە',
      academicDefinition: 'لقی فەلسەفە کە لە سروشت، سەرچاوە و سنوورەکانی زانین و مەعریفەی مرۆڤ دەکۆڵێتەوە.',
      usageContextKurdish: 'توێژینەوەی ئێستا لە ڕوانگەی ئیپیستمۆلۆژیای پێکهاتەخوازییەوە دیاردەکە شیدەکاتەوە.'
    },
    {
      id: 'lex_2',
      kurdishTerm: 'هێرمینیۆتیک (تەئویلناسی)',
      englishTerm: 'Hermeneutics',
      arabicTerm: 'الهرمنيوطيقا / علم التأويل',
      discipline: 'زانستە مرۆڤایەتییەکان',
      academicDefinition: 'تیۆری و میتۆدۆلۆژیای لێکدانەوە و تێگەیشتن لە دەق، بەتایبەت دەقە فەلسەفی و ئەدەبییەکان.',
      usageContextKurdish: 'بۆ خوێندنەوەی بەڵگەنامە مێژووییەکان پشت بە میتۆدی هێرمینیۆتیک بەستراوە.'
    },
    {
      id: 'lex_3',
      kurdishTerm: 'کارکردخوازیی پێکهاتەیی',
      englishTerm: 'Structural Functionalism',
      arabicTerm: 'البنيوية الوظيفية',
      discipline: 'زانستە کۆمەڵایەتییەکان',
      academicDefinition: 'چوارچێوەیەکی تیۆریی کۆمەڵناسی کە کۆمەڵگە وەک سیستمێکی ئاڵۆز دەبینێت کە بەشەکانی بۆ سەقامگیری پێکەوە کار دەکەن.',
      usageContextKurdish: 'پێکهاتەی دامەزراوەکانی خوێندن لە ڕوانگەی کارکردخوازییەوە هەڵسەنگێندراوە.'
    },
    {
      id: 'lex_4',
      kurdishTerm: 'کەلێنی زانستی (کەلێنی توێژینەوە)',
      englishTerm: 'Research Gap',
      arabicTerm: 'الفجوة البحثية',
      discipline: 'میتۆدۆلۆژیا و فەلسەفە',
      academicDefinition: 'ئەو ڕووبەر یان پرسیارە نەزانراوەی کە لە ئەدەبیاتی زانستیی پێشوودا چارەسەر یان بەسەر نەکراوەتەوە.',
      usageContextKurdish: 'پڕکردنەوەی ئەم کەلێنە زانستییە ئامانجی سەرەکیی ئەم لێکۆڵینەوەیەیە.'
    },
    {
      id: 'lex_5',
      kurdishTerm: 'نموونەگیریی بەمەبەست',
      englishTerm: 'Purposive Sampling',
      arabicTerm: 'العينة القصدية',
      discipline: 'زانستە کۆمەڵایەتییەکان',
      academicDefinition: 'میتۆدێکی نائەگەرییە بۆ هەڵبژاردنی نموونەی توێژینەوە لەسەر بنەمای تایبەتمەندییە دیاریکراوەکانی دانیشتووانی ئامانج.',
      usageContextKurdish: 'بەشداربووانی چاوپێکەوتنەکان بە میتۆدی نموونەگیریی بەمەبەست هەڵبژێردراون.'
    },
    {
      id: 'lex_6',
      kurdishTerm: 'تێکڕای لادانی پێوانەیی',
      englishTerm: 'Standard Deviation',
      arabicTerm: 'الانحراف المعياري',
      discipline: 'زانستە سروشتییەکان',
      academicDefinition: 'پێوەرێکی ئامارییە کە ڕادەی بڵاوبوونەوە یان جیاوازیی بەهاکان لە تێکڕای ژمێریاری نیشان دەدات.',
      usageContextKurdish: 'نمرەی بەشداربووان خاوەنی تێکڕای لادانی پێوانەیی (SD = 1.42) بووە.'
    }
  ];

  /**
   * گۆڕینی ژێدەر بۆ شێوازە جیهانییەکان بە زمانی کوردی
   */
  formatCitationKurdish(
    author: string,
    year: string | number,
    title: string,
    publisher: string,
    style: 'APA' | 'Chicago' | 'IEEE' = 'APA',
    page?: string
  ): FormattedCitationKurdish {
    const safeYear = year ? String(year) : 'بێ بەروار';
    const safeAuthor = author || 'نووسەری نەناسراو';
    const pageStr = page ? `، ل. ${page}` : '';

    if (style === 'IEEE') {
      return {
        styleName: 'IEEE',
        inTextCitation: '[1]',
        fullBibliography: `[1] ${safeAuthor}, "${title}," ${publisher}, ${safeYear}.`
      };
    }

    if (style === 'Chicago') {
      return {
        styleName: 'Chicago (پەراوێز و سەرچاوە)',
        inTextCitation: `(${safeAuthor} ${safeYear}${pageStr})`,
        fullBibliography: `${safeAuthor}. ${safeYear}. ${title}. ${publisher}.`
      };
    }

    // Default: APA 7th Edition بە زمانی کوردی
    return {
      styleName: 'APA 7th Edition (پێوەری کوردی)',
      inTextCitation: `(${safeAuthor}، ${safeYear}${pageStr})`,
      fullBibliography: `${safeAuthor} (${safeYear}). ${title}. ${publisher}.`
    };
  }

  /**
   * دۆزینەوەی زاراوەکان بەپێی دەق یان وشەی گەڕان
   */
  searchLexicon(query: string, disciplineFilter?: string): LexiconEntry[] {
    const cleanQuery = (query || '').toLowerCase().trim();
    return this.comparativeLexicon.filter(entry => {
      const matchesQuery = !cleanQuery || 
        entry.kurdishTerm.toLowerCase().includes(cleanQuery) ||
        entry.englishTerm.toLowerCase().includes(cleanQuery) ||
        entry.arabicTerm.toLowerCase().includes(cleanQuery);

      const matchesDiscipline = !disciplineFilter || 
        disciplineFilter === 'هەموو بوارەکان' || 
        entry.discipline === disciplineFilter;

      return matchesQuery && matchesDiscipline;
    });
  }

  getPresetById(id: string): UniversityThesisPreset | undefined {
    return this.universityPresets.find(p => p.id === id);
  }
}
