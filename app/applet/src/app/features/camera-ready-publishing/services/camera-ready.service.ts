import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { sha256Fingerprint } from './sha256-fingerprint';
import {
  CameraReadyReport,
  DefenseAssessment,
  DefenseRehearsalQuestion,
  PreFlightCheckItem,
  PublishingMetadata
} from '../models/camera-ready.models';

const STORAGE_KEY = 'mam_publishing_metadata_v1';

@Injectable({
  providedIn: 'root'
})
export class CameraReadyService {
  private readonly http = inject(HttpClient);

  public getDefaultMetadata(): PublishingMetadata {
    return {
      titleKurdish: '',
      titleEnglish: '',
      authorName: '',
      authorOrcid: '',
      supervisorName: '',
      academicDegree: 'master',
      institution: 'زانکۆی سلێمانی / زانکۆی سەلاحەدین',
      faculty: 'کۆلێژی زانست / کۆلێژی زمان',
      department: 'بەشی خوێندنی باڵا',
      publicationYear: '٢٠٢٦',
      legalDepositNumber: '',
      isbn: '',
      doi: '',
      ethicalClearanceCode: '',
      ethicalStatement: 'ڕەزامەندیی ئەخلاقی و پاراستنی داتا بەپێی پێداویستییەکانی ئەم توێژینەوەیە و یاسای زانکۆ پڕبکرێتەوە.',
      copyrightNotice: 'هەموو مافەکانی ئەم بەرهەمە بۆ نووسەر پارێزراوە © ٢٠٢٦'
    };
  }

  public loadMetadata(): PublishingMetadata {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...this.getDefaultMetadata(), ...JSON.parse(stored) };
      }
    } catch {
      // Graceful fallback
    }
    return this.getDefaultMetadata();
  }

  public saveMetadata(meta: PublishingMetadata): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch {
      // Ignore local storage error
    }
  }

  public async runDefenseRehearsal(
    workspaceId: string,
    payload: {
      topic: string;
      title: string;
      researchQuestion?: string;
      methodology?: string;
      conclusion?: string;
      limitations?: string;
      contribution?: string;
      evidenceSummary?: string;
      chapters: Array<{ id: string; title: string; order: number; content: string; citationIds?: string[] }>;
      citations?: Array<{ citationId: string; sourceId: string; inText: string; bibliography: string; verified: boolean; evidenceId?: string }>;
      referencedCitationCount: number;
      verifiedCitationCount: number;
      bibliographyCount: number;
      structuralStatus: 'PASS' | 'REJECT';
      exportBlocked: boolean;
      answers: Array<{ questionId: string; answer: string }>;
    }
  ): Promise<{
    success: boolean;
    questions: DefenseRehearsalQuestion[];
    assessments: DefenseAssessment[];
    readiness: { defenseScore: number; defenseStatus: string; publicationStatus: string };
    answerSummary: { attempted: number; averageScore: number; status: string };
  }> {
    const res = await firstValueFrom(
      this.http.post<any>(`/api/defense-rehearsal/${encodeURIComponent(workspaceId)}`, payload)
    );
    return res;
  }

  public generateFrontMatterText(meta: PublishingMetadata): string {
    const degreeLabel = {
      bachelor: 'نامەی دەرچوونی بەکالۆریۆس',
      master: 'تێزی ماستەر لە زانستدا',
      phd: 'تێزی دکتۆرا لە فەلسەفەی زانستدا',
      postdoc: 'توێژینەوەی پۆست-دکتۆرا',
      book: 'کتێبی زانستی و ئەکادیمی'
    }[meta.academicDegree];

    return `=======================================================
${meta.institution}
${meta.faculty}
${meta.department}
=======================================================

${meta.titleKurdish || 'ناونیشانی توێژینەوە'}
${meta.titleEnglish ? '(' + meta.titleEnglish + ')' : ''}

پێشکەش کراوە وەک بەشێک لە پێداویستییەکانی بەدەستهێنانی:
[ ${degreeLabel} ]

ئامادەکردنی:
${meta.authorName || 'ناوی توێژەر'}
${meta.authorOrcid ? 'ناسنامەی ORCID: ' + meta.authorOrcid : ''}

سەرپەرشتیاری زانستی:
${meta.supervisorName || 'ناوی سەرپەرشتیار'}

ساڵی خوێندن / چاپ: ${meta.publicationYear}

-------------------------------------------------------
زانیاریی یاسایی و چاپی کتێبخانە:
* ژمارەی سپاردن (Legal Deposit): ${meta.legalDepositNumber || 'لە پرۆسەدایە'}
* ژمارەی نێودەوڵەتی (ISBN/ISSN): ${meta.isbn || 'دیاری نەکراوە'}
* ناسێنەری دیجیتاڵی (DOI): ${meta.doi || 'تۆمار نەکراوە'}
* ڕەزامەندیی ئەخلاقی (IRB Clearance): ${meta.ethicalClearanceCode || 'پەسەندکراوە'}
* ڕێسای مافی چاپ: ${meta.copyrightNotice}
-------------------------------------------------------`;
  }

  public async evaluatePreFlight(
    meta: PublishingMetadata,
    chapterCount: number,
    citationCount: number,
    verifiedCount: number,
    hasPassStatus: boolean,
    fingerprintMaterial?: unknown
  ): Promise<CameraReadyReport> {
    const checks: PreFlightCheckItem[] = [
      {
        id: 'title_meta',
        title: 'ناونیشان و ناسنامەی نووسەر',
        status: meta.titleKurdish.trim() && meta.authorName.trim() ? 'PASS' : 'FAIL',
        detail: meta.titleKurdish.trim() && meta.authorName.trim()
          ? 'ناونیشان و ناوی نووسەر بە تەواوی تۆمارکراون.'
          : 'پێویستە ناونیشانی کوردی و ناوی نووسەر پڕبکرێنەوە.'
      },
      {
        id: 'chapters_integrity',
        title: 'پێکهاتەی تەواوی بەشەکان (P10 Structural Integrity)',
        status: chapterCount >= 3 && hasPassStatus ? 'PASS' : chapterCount > 0 ? 'WARN' : 'FAIL',
        detail: chapterCount >= 3
          ? `پڕۆژەکە خاوەنی ${chapterCount} بەشی ڕێکخراوە و پێکهاتەی تەواوە.`
          : 'دەستنووسی کەمتر لە ٣ بەش بە تەواوی ئامادەی چاپی زانستی نییە.'
      },
      {
        id: 'citations_verified',
        title: 'سەرچاوە و ژێدەرە سەلمێنراوەکان (Evidence Grounding)',
        status: verifiedCount > 0 && verifiedCount === citationCount ? 'PASS' : verifiedCount > 0 ? 'WARN' : 'FAIL',
        detail: verifiedCount > 0
          ? `${verifiedCount} سەرچاوەی سەلمێنراو بوونیان هەیە.`
          : 'هیچ سەرچاوەیەکی سەلمێنراو لە دەستنووسەکەدا بەردەست نییە.'
      },
      {
        id: 'legal_metadata',
        title: 'ژمارەی سپاردن و داتای چاپ (Legal & Deposit)',
        status: meta.legalDepositNumber.trim() || meta.isbn.trim() ? 'PASS' : 'WARN',
        detail: meta.legalDepositNumber.trim() || meta.isbn.trim()
          ? 'زانیاریی سپاردنی کتێبخانە یان ISBN تۆمارکراوە.'
          : 'تۆمارکردنی ژمارەی سپاردن یان ISBN بۆ چاپی ڕاستەوخۆ پێشنیار دەکرێت.'
      },
      {
        id: 'ethical_clearance',
        title: 'ڕەزامەندیی ئەخلاقی (Ethical Clearance / IRB)',
        status: 'WARN',
        detail: meta.ethicalClearanceCode.trim()
          ? `کۆدی ئەخلاقی تۆمارکراوە (${meta.ethicalClearanceCode})، بەڵام پەسەندکردنی ڕاستەقینە لەم پشکنینەدا پشتڕاست نەکراوەتەوە.`
          : 'کۆدی ڕەزامەندیی ئەخلاقی بەردەست نییە؛ ئەگەر توێژینەوەکە پێویستی پێیە، پێش بڵاوکردنەوە پشتڕاستی بکەوە.'
      }
    ];

    let manuscriptFingerprint = '';
    try {
      manuscriptFingerprint = await sha256Fingerprint(fingerprintMaterial ?? {
        metadata: meta,
        chapterCount,
        citationCount,
        verifiedCount,
        hasPassStatus,
        checks
      });
    } catch {
      // A report without a real digest must never be called camera-ready.
    }

    checks.push({
      id: 'manuscript_fingerprint',
      title: 'پەنجەمۆری تێز (SHA-256)',
      status: manuscriptFingerprint ? 'PASS' : 'FAIL',
      detail: manuscriptFingerprint
        ? 'پەنجەمۆری SHA-256 لە زانیارییە پێدراوەکان بەرهەم هاتووە.'
        : 'پەنجەمۆری ڕاستەقینە بەردەست نەبوو؛ ئامادەی چاپ ناڕاگەیەنرێت.'
    });

    const passCount = checks.filter(c => c.status === 'PASS').length;
    const readinessPercentage = Math.round((passCount / checks.length) * 100);
    const hasBlockingFailure = checks.some(check => check.status === 'FAIL');

    return {
      overallStatus: readinessPercentage >= 80 && !hasBlockingFailure
        ? 'CAMERA_READY'
        : 'ACTION_REQUIRED',
      readinessPercentage,
      checks,
      manuscriptFingerprint: manuscriptFingerprint || 'UNAVAILABLE',
      generatedAt: new Date().toLocaleDateString('ckb-IQ')
    };
  }
}
