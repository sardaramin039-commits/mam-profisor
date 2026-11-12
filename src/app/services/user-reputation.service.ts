import { Injectable, signal, computed } from '@angular/core';

export interface ReputationEvent {
  id: string;
  title: string;
  points: number;
  timestamp: string;
  type: 'quality_review' | 'peer_review' | 'verified_source' | 'chapter_milestone' | 'citation_integrity';
  description: string;
}

export type ReputationTier = 'novice' | 'verified' | 'senior' | 'distinguished';

export interface UserProfileReputation {
  userId: string;
  displayName: string;
  email: string;
  reputationScore: number;
  tier: ReputationTier;
  tierNameKurdish: string;
  badgeIcon: string;
  badgeClass: string;
  nextTierPoints: number;
  progressPercent: number;
  canPublishNewChapter: boolean;
  canSubmitPeerReview: boolean;
  canReviewQuality: boolean;
  totalReviewsGiven: number;
  totalReviewsReceived: number;
  history: ReputationEvent[];
}

const STORAGE_KEY = 'mam_reputation_profile_v1';

@Injectable({
  providedIn: 'root'
})
export class UserReputationService {
  // Base state
  public readonly score = signal<number>(this.loadStoredScore());
  public readonly history = signal<ReputationEvent[]>(this.loadStoredHistory());
  public readonly reviewsGivenCount = signal<number>(this.loadStoredCount('mam_rep_reviews_given', 3));
  public readonly reviewsReceivedCount = signal<number>(this.loadStoredCount('mam_rep_reviews_rcvd', 5));

  public readonly tierLabel = computed(() => this.profile().tierNameKurdish);
  public readonly tier = computed(() => this.profile().tier);

  // Gating thresholds
  readonly MIN_POINTS_FOR_PUBLISH = 50;
  readonly MIN_POINTS_FOR_PEER_REVIEW = 100;
  readonly MIN_POINTS_FOR_QUALITY_EVAL = 25;

  public readonly profile = computed<UserProfileReputation>(() => {
    const s = this.score();
    let tier: ReputationTier = 'novice';
    let tierNameKurdish = 'توێژەری سەرەتایی (Novice)';
    let badgeIcon = 'school';
    let badgeClass = 'text-amber-400 bg-amber-950/40 border-amber-500/40';
    let nextTierPoints = 150;
    let progressPercent = Math.min(100, Math.round((s / 150) * 100));

    if (s >= 500) {
      tier = 'distinguished';
      tierNameKurdish = 'پڕۆفیسۆری پایەبەرز (Distinguished Scholar)';
      badgeIcon = 'military_tech';
      badgeClass = 'text-purple-300 bg-purple-950/60 border-purple-400/50';
      nextTierPoints = 1000;
      progressPercent = 100;
    } else if (s >= 250) {
      tier = 'senior';
      tierNameKurdish = 'پێداچوونیاری باڵا (Senior Peer Reviewer)';
      badgeIcon = 'workspace_premium';
      badgeClass = 'text-emerald-300 bg-emerald-950/60 border-emerald-400/50';
      nextTierPoints = 500;
      progressPercent = Math.min(100, Math.round(((s - 250) / 250) * 100));
    } else if (s >= 100) {
      tier = 'verified';
      tierNameKurdish = 'توێژەری باوەڕپێکراو (Verified Researcher)';
      badgeIcon = 'verified';
      badgeClass = 'text-cyan-300 bg-cyan-950/60 border-cyan-400/50';
      nextTierPoints = 250;
      progressPercent = Math.min(100, Math.round(((s - 100) / 150) * 100));
    }

    return {
      userId: 'usr_academic_lead',
      displayName: 'توێژەری ئەکادیمی',
      email: 'researcher@mam-professor.edu.krd',
      reputationScore: s,
      tier,
      tierNameKurdish,
      badgeIcon,
      badgeClass,
      nextTierPoints,
      progressPercent,
      canPublishNewChapter: s >= this.MIN_POINTS_FOR_PUBLISH,
      canSubmitPeerReview: s >= this.MIN_POINTS_FOR_PEER_REVIEW,
      canReviewQuality: s >= this.MIN_POINTS_FOR_QUALITY_EVAL,
      totalReviewsGiven: this.reviewsGivenCount(),
      totalReviewsReceived: this.reviewsReceivedCount(),
      history: this.history()
    };
  });

  private loadStoredScore(): number {
    if (typeof window === 'undefined') return 120;
    try {
      const val = localStorage.getItem('mam_reputation_score_v1');
      if (val !== null) {
        const num = parseInt(val, 10);
        if (!isNaN(num)) return num;
      }
    } catch {}
    return 120; // Default active researcher starting score
  }

  private loadStoredCount(key: string, defaultVal: number): number {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const num = parseInt(val, 10);
        if (!isNaN(num)) return num;
      }
    } catch {}
    return defaultVal;
  }

  private loadStoredHistory(): ReputationEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('mam_reputation_history_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'rep_init_1',
        title: 'دەستپێکی پلاتفۆرمی مام پڕۆفیسۆر',
        points: 50,
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        type: 'chapter_milestone',
        description: 'تۆمارکردنی ئەژماری ئەکادیمی و داڕشتنی یەکەمین پەیکەری تێز.'
      },
      {
        id: 'rep_init_2',
        title: 'سەلماندنی سەرچاوەی Crossref',
        points: 40,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        type: 'verified_source',
        description: 'پشتڕاستکردنەوەی DOI فەرمی بۆ سەرچاوەی ئەکادیمی لە تێزدا.'
      },
      {
        id: 'rep_init_3',
        title: 'پێداچوونەوەی کوالیتیی دەقی پێشەکی',
        points: 30,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'quality_review',
        description: 'بەدەستهێنانی پلەی باڵای گوتاری زانستی و پاککردنەوە لە کڵیشەکان.'
      }
    ];
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mam_reputation_score_v1', String(this.score()));
      localStorage.setItem('mam_reputation_history_v1', JSON.stringify(this.history()));
      localStorage.setItem('mam_rep_reviews_given', String(this.reviewsGivenCount()));
      localStorage.setItem('mam_rep_reviews_rcvd', String(this.reviewsReceivedCount()));
    } catch {}
  }

  /**
   * Adds reputation points with verification log
   */
  public addPoints(points: number, title: string, description: string, type: ReputationEvent['type']): void {
    const event: ReputationEvent = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      points,
      timestamp: new Date().toISOString(),
      type,
      description
    };

    this.score.update(prev => prev + points);
    this.history.update(prev => [event, ...prev].slice(0, 30));
    this.persist();
  }

  /**
   * Checks permission for academic actions based on reputation score
   */
  public checkPermission(action: 'publish_chapter' | 'peer_review' | 'quality_review'): {
    allowed: boolean;
    requiredPoints: number;
    currentPoints: number;
    reasonKurdish?: string;
  } {
    const s = this.score();
    if (action === 'publish_chapter') {
      const allowed = s >= this.MIN_POINTS_FOR_PUBLISH;
      return {
        allowed,
        requiredPoints: this.MIN_POINTS_FOR_PUBLISH,
        currentPoints: s,
        reasonKurdish: allowed ? undefined : `دانانی پۆست و بڵاوکردنەوەی بەشی نوێ پێویستی بە لانیکەم ${this.MIN_POINTS_FOR_PUBLISH} خاڵی ناوبانگ هەیە. ئێستا خاوەنی ${s} خاڵیت.`
      };
    }
    if (action === 'peer_review') {
      const allowed = s >= this.MIN_POINTS_FOR_PEER_REVIEW;
      return {
        allowed,
        requiredPoints: this.MIN_POINTS_FOR_PEER_REVIEW,
        currentPoints: s,
        reasonKurdish: allowed ? undefined : `پێشکەشکردنی ڕەخنە و پێداچوونەوەی هاوتا پێویستی بە لانیکەم ${this.MIN_POINTS_FOR_PEER_REVIEW} خاڵی ناوبانگ هەیە تا شایستەیی ئەکادیمی مسۆگەر بێت.`
      };
    }
    // quality review
    const allowed = s >= this.MIN_POINTS_FOR_QUALITY_EVAL;
    return {
      allowed,
      requiredPoints: this.MIN_POINTS_FOR_QUALITY_EVAL,
      currentPoints: s,
      reasonKurdish: allowed ? undefined : `داواکردنی پێداچوونەوەی کوالیتی پێویستی بە ${this.MIN_POINTS_FOR_QUALITY_EVAL} خاڵ هەیە.`
    };
  }

  /**
   * Evaluates text quality and awards points based on scholarly depth
   */
  public evaluateTextQualityAndAward(chapterTitle: string, text: string): {
    awardedPoints: number;
    qualityScore: number;
    verdictKurdish: string;
  } {
    const length = (text || '').trim().split(/\s+/).filter(Boolean).length;
    let qualityScore = 70;

    if (length >= 500) qualityScore += 10;
    if (length >= 1200) qualityScore += 10;
    if (text.includes('سەرچاوە') || text.includes('ژێدەر') || text.includes('DOI') || text.includes('[')) qualityScore += 5;
    if (!text.includes('بەڕای من') && !text.includes('بێگومان هەموان دەزانن')) qualityScore += 5;

    const awardedPoints = qualityScore >= 90 ? 45 : qualityScore >= 80 ? 30 : 20;

    this.reviewsReceivedCount.update(c => c + 1);
    this.addPoints(
      awardedPoints,
      `پێداچوونەوەی کوالیتی: «${chapterTitle}»`,
      `دەقەکە نمرەی کوالیتیی ${qualityScore}/100ی بەدەستهێنا و بە سەرکەوتوویی لە لایەن لیژنەی ئەکادیمییەوە پەسەندکرا.`,
      'quality_review'
    );

    return {
      awardedPoints,
      qualityScore,
      verdictKurdish: `دەقی «${chapterTitle}» نمرەی ئەکادیمیی ${qualityScore}/100 ی پێبەخشرا و +${awardedPoints} خاڵی ناوبانگ زیادکرا.`
    };
  }

  /**
   * Submits a peer review and awards reputation for contributing scholarly critiques
   */
  public submitPeerReviewAndAward(authorName: string, chapterTitle: string, critique: string): {
    success: boolean;
    awardedPoints: number;
    message: string;
  } {
    const perm = this.checkPermission('peer_review');
    if (!perm.allowed) {
      return {
        success: false,
        awardedPoints: 0,
        message: perm.reasonKurdish || 'خاڵی ناوبانگت کەمترە لە پێویست بۆ پێداچوونەوەی هاوتا.'
      };
    }

    const awardedPoints = 35;
    this.reviewsGivenCount.update(c => c + 1);
    this.addPoints(
      awardedPoints,
      `پێداچوونەوەی هاوتا بۆ: ${authorName}`,
      `پێشکەشکردنی ڕەخنە و تێبینیی ئەکادیمی لەسەر توێژینەوەی «${chapterTitle}».`,
      'peer_review'
    );

    return {
      success: true,
      awardedPoints,
      message: `پێداچوونەوەی هاوتا بە سەرکەوتوویی تۆمارکرا! +${awardedPoints} خاڵی ناوبانگ وەک ڕێزلێنان پێبەخشرا.`
    };
  }
}
