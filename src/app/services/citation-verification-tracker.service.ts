import { Injectable, signal, computed } from '@angular/core';

export interface VerifiedCitationRecord {
  id: string;
  author: string;
  year: string;
  title: string;
  publisherOrLocation: string;
  language: 'ku' | 'fa' | 'ar' | 'en';
  pageOrNote?: string;
  verificationOrigin?: 'google_search_grounded' | 'user_verified_library' | 'primary_corpus';
  footnoteNum?: string;
  verifiedAt: Date;
}

export interface RejectedCitationRecord {
  id: string;
  attemptedAuthor: string;
  attemptedTitle: string;
  attemptedYear: string;
  attemptedPublisher: string;
  language: 'ku' | 'fa' | 'ar' | 'en';
  reason: string;
  matchedPattern: string;
  rejectedAt: Date;
  resolved: boolean;
  alternativeProvided?: VerifiedCitationRecord;
}

export interface TextQualityMetrics {
  totalParagraphs: number;
  substantiatedParagraphs: number;
  unsubstantiatedParagraphs: number;
  densityPercentage: number;
  qualityScore: number;
  qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  gradeColor: string;
  statusLabelKurdish: string;
  citationsCount: number;
  wordsCount: number;
  ruleFollowed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CitationVerificationTrackerService {
  // Verified citations list
  public readonly verifiedCitations = signal<VerifiedCitationRecord[]>([]);

  // Rejected citations list triggering alerts
  public readonly rejectedCitations = signal<RejectedCitationRecord[]>([]);

  // Total attempted verification counter for progress calculation
  public readonly totalAttemptedCount = signal<number>(0);

  // Active text being analyzed
  public readonly currentAnalyzedText = signal<string>('');

  // Computed: Unresolved rejections count (warning active state)
  public readonly activeWarnings = computed(() =>
    this.rejectedCitations().filter((r) => !r.resolved)
  );

  // Computed: Verification Progress percentage
  public readonly verificationProgress = computed(() => {
    const verified = this.verifiedCitations().length;
    const rejected = this.rejectedCitations().length;
    const total = verified + rejected;
    if (total === 0) return 100;
    return Math.round((verified / total) * 100);
  });

  // Computed: Real-time Quality Score based on current text
  public readonly qualityMetrics = computed<TextQualityMetrics>(() => {
    const text = this.currentAnalyzedText();
    return this.calculateQualityMetrics(text);
  });

  public readonly BANNED_FAKE_PATTERNS = [
    'unknown',
    'anonymous',
    'n/a',
    'example',
    'placeholder',
    ' نەناسراو',
    'بێ ناو',
    'سەرچاوەی گریمانەیی',
    'کتێبی نموونە',
    'فڵان',
    'test author'
  ];

  constructor() {
    // Initialize with a demo verified citation for immediate high-fidelity visualization
    this.seedInitialDemoState();
  }

  private seedInitialDemoState(): void {
    this.verifiedCitations.set([
      {
        id: 'dr_kamal_mazhar_kurdish_history_1985',
        author: 'د. کەمال مەزهەر ئەحمەد',
        year: '١٩٨٥',
        title: 'مێژووی هاوچەرخی کورد و بزووتنەوەی ڕزگاریخوازی',
        publisherOrLocation: 'بەغدا: دەزگای ڕۆشنبیری و بڵاوکردنەوەی کوردی',
        language: 'ku',
        pageOrNote: '٤٥-٤٨',
        verificationOrigin: 'google_search_grounded',
        footnoteNum: '١',
        verifiedAt: new Date()
      },
      {
        id: 'alaaldin_sajjadi_kurdish_literature_1952',
        author: 'عەلائەدین سەجادی',
        year: '١٩٥٢',
        title: 'مێژووی ئەدەبی کوردی',
        publisherOrLocation: 'بەغدا: چاپخانەی مەعاریف',
        language: 'ku',
        pageOrNote: '١١٢',
        verificationOrigin: 'user_verified_library',
        footnoteNum: '٢',
        verifiedAt: new Date()
      }
    ]);
  }

  /**
   * Register a verified citation
   */
  public recordVerification(
    item: {
      id: string;
      author: string;
      year: string;
      title: string;
      publisherOrLocation: string;
      language: 'ku' | 'fa' | 'ar' | 'en';
      pageOrNote?: string;
      verificationOrigin?: 'google_search_grounded' | 'user_verified_library' | 'primary_corpus';
      footnoteNum?: string;
    }
  ): void {
    const existing = this.verifiedCitations();
    const isAlreadyPresent = existing.some(
      (c) => c.author.trim() === item.author.trim() && c.title.trim() === item.title.trim()
    );

    if (!isAlreadyPresent) {
      const record: VerifiedCitationRecord = {
        ...item,
        verifiedAt: new Date(),
        verificationOrigin: item.verificationOrigin || 'google_search_grounded'
      };
      this.verifiedCitations.update((list) => [record, ...list]);
      this.totalAttemptedCount.update((c) => c + 1);
    }
  }

  /**
   * Register a rejected fake or incomplete citation and trigger UI alert
   */
  public recordRejection(
    source: {
      id?: string;
      author?: string;
      year?: string;
      title?: string;
      publisherOrLocation?: string;
      language?: 'ku' | 'fa' | 'ar' | 'en';
    },
    reason: string,
    matchedPattern: string
  ): void {
    const record: RejectedCitationRecord = {
      id: source.id || `rejected_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      attemptedAuthor: source.author || 'نەناسراو',
      attemptedTitle: source.title || 'ناونیشانی نادیار',
      attemptedYear: source.year || 'نادیار',
      attemptedPublisher: source.publisherOrLocation || 'شوێنی بڵاوکردنەوەی نادیار',
      language: source.language || 'ku',
      reason,
      matchedPattern,
      rejectedAt: new Date(),
      resolved: false
    };

    this.rejectedCitations.update((list) => [record, ...list]);
    this.totalAttemptedCount.update((c) => c + 1);
  }

  /**
   * Check if a source triggers banned fake patterns
   */
  public checkAuthenticity(src: {
    author: string;
    title: string;
    year: string;
    publisherOrLocation?: string;
  }): { valid: boolean; pattern?: string; reason?: string } {
    if (!src || !src.author || !src.title || !src.year) {
      return { valid: false, reason: 'زانیاری نووسەر، ساڵ یان ناونیشان بەتاڵە' };
    }
    const combined = `${src.author} ${src.title} ${src.publisherOrLocation || ''}`.toLowerCase();
    for (const pattern of this.BANNED_FAKE_PATTERNS) {
      if (combined.includes(pattern.trim().toLowerCase())) {
        return {
          valid: false,
          pattern,
          reason: `دەستەواژەی گوماناوی و قەدەغەکراوی (${pattern}) تێدایە`
        };
      }
    }
    const cleanYear = src.year.replace(/[^\d٠-٩]/g, '');
    if (cleanYear.length < 3) {
      return { valid: false, reason: 'ساڵی چاپ نادروستە یان بوونی نییە' };
    }
    if (src.author.trim().length < 3 || src.title.trim().length < 3) {
      return { valid: false, reason: 'ناوی نووسەر یان ناونیشان زۆر کورتە' };
    }
    return { valid: true };
  }

  /**
   * User manually resolves a rejected citation by providing a verified alternative
   */
  public resolveRejectionWithAlternative(
    rejectedId: string,
    alternative: {
      author: string;
      year: string;
      title: string;
      publisherOrLocation: string;
      language: 'ku' | 'fa' | 'ar' | 'en';
      pageOrNote?: string;
    }
  ): { success: boolean; error?: string } {
    const check = this.checkAuthenticity(alternative);
    if (!check.valid) {
      return { success: false, error: check.reason || 'سەرچاوە پێشکەشکراوەکە ستاندارد نییە' };
    }

    const verifiedRecord: VerifiedCitationRecord = {
      id: `manual_verified_${Date.now()}`,
      ...alternative,
      verificationOrigin: 'user_verified_library',
      verifiedAt: new Date()
    };

    // Mark rejection as resolved
    this.rejectedCitations.update((list) =>
      list.map((item) =>
        item.id === rejectedId
          ? { ...item, resolved: true, alternativeProvided: verifiedRecord }
          : item
      )
    );

    // Add to verified list
    this.verifiedCitations.update((list) => [verifiedRecord, ...list]);

    return { success: true };
  }

  /**
   * Dismiss a warning manually
   */
  public dismissRejection(rejectedId: string): void {
    this.rejectedCitations.update((list) =>
      list.map((item) => (item.id === rejectedId ? { ...item, resolved: true } : item))
    );
  }

  /**
   * Update active text to recompute Quality Score dynamically
   */
  public updateAnalyzedText(text: string): void {
    this.currentAnalyzedText.set(text);
  }

  /**
   * Calculates 'Quality Score' (0-100) based on Claim + Evidence density in paragraphs
   */
  public calculateQualityMetrics(rawText: string): TextQualityMetrics {
    if (!rawText || rawText.trim().length === 0) {
      return {
        totalParagraphs: 0,
        substantiatedParagraphs: 0,
        unsubstantiatedParagraphs: 0,
        densityPercentage: 100,
        qualityScore: 100,
        qualityGrade: 'A+',
        gradeColor: 'text-emerald-400',
        statusLabelKurdish: 'دەقی نوێ - ئامادەیە بۆ شیکاری',
        citationsCount: 0,
        wordsCount: 0,
        ruleFollowed: true
      };
    }

    // Split text into meaningful paragraphs
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30 && !p.startsWith('#') && !p.startsWith('---'));

    const totalParagraphs = Math.max(1, paragraphs.length);
    let substantiatedCount = 0;
    let totalCitationsFound = 0;

    // Regex for evidence markers: footnotes <sup>, citations {{CITE:}}, bracket citations, numbers, quotes
    const citationRegex = /<sup>\(?[٠-٩\d]+\)?<\/sup>|\{\{CITE:[^}]+\}\}|\([A-Za-z\u0600-\u06FF\s]+،\s*[٠-٩\d]{4}\)|«[^»]+»|"[^"]+"/g;

    for (const p of paragraphs) {
      const matches = p.match(citationRegex);
      if (matches && matches.length > 0) {
        substantiatedCount++;
        totalCitationsFound += matches.length;
      }
    }

    const unsubstantiatedParagraphs = totalParagraphs - substantiatedCount;
    const densityPercentage = Math.round((substantiatedCount / totalParagraphs) * 100);

    // Compute Quality Score:
    // 70% weight on paragraph evidence density + 30% on verified citation ratio
    const verifiedBonus = Math.min(30, this.verifiedCitations().length * 3);
    const rawScore = Math.round(densityPercentage * 0.7 + (densityPercentage > 0 ? verifiedBonus : 0));
    const qualityScore = Math.max(10, Math.min(100, rawScore));

    let qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'C';
    let gradeColor = 'text-amber-400';
    let statusLabelKurdish = 'پێویستی بە بەڵگە و سەرچاوەی زیاترە';

    if (qualityScore >= 90) {
      qualityGrade = 'A+';
      gradeColor = 'text-emerald-400';
      statusLabelKurdish = 'پێوەری زێڕینی ئەکادیمی (Gold Academic Standard)';
    } else if (qualityScore >= 80) {
      qualityGrade = 'A';
      gradeColor = 'text-emerald-300';
      statusLabelKurdish = 'ئاستی سەلماندنی زۆر بەرز و پتەو';
    } else if (qualityScore >= 65) {
      qualityGrade = 'B';
      gradeColor = 'text-blue-400';
      statusLabelKurdish = 'گونجاوە بەڵام کەمێک بەڵگەی زیاتری دەوێت';
    } else if (qualityScore >= 50) {
      qualityGrade = 'C';
      gradeColor = 'text-amber-400';
      statusLabelKurdish = 'چەندین پەرەگرافی بێ بەڵگەی تێدایە';
    } else {
      qualityGrade = 'D';
      gradeColor = 'text-rose-400';
      statusLabelKurdish = 'پێچەوانەی یاسای ئەکادیمی (بانگەشەی بێ بەڵگە)';
    }

    const wordsCount = rawText.trim().split(/\s+/).filter(Boolean).length;
    const ruleFollowed = densityPercentage >= 75;

    return {
      totalParagraphs,
      substantiatedParagraphs: substantiatedCount,
      unsubstantiatedParagraphs,
      densityPercentage,
      qualityScore,
      qualityGrade,
      gradeColor,
      statusLabelKurdish,
      citationsCount: totalCitationsFound,
      wordsCount,
      ruleFollowed
    };
  }

  /**
   * Reset / Clear tracker
   */
  public reset(): void {
    this.verifiedCitations.set([]);
    this.rejectedCitations.set([]);
    this.totalAttemptedCount.set(0);
    this.currentAnalyzedText.set('');
  }
}
