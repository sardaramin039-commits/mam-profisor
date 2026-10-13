import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
      institution: '',
      faculty: '',
      department: '',
      publicationYear: '',
      legalDepositNumber: '',
      isbn: '',
      doi: '',
      ethicalClearanceCode: '',
      ethicalStatement: '',
      copyrightNotice: ''
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

ساڵی خوێندن / چاپ: ${meta.publicationYear || 'دیاری نەکراوە'}

-------------------------------------------------------
زانیاریی یاسایی و چاپی کتێبخانە:
* ژمارەی سپاردن (Legal Deposit): ${meta.legalDepositNumber || 'تۆمار نەکراوە'}
* ژمارەی نێودەوڵەتی (ISBN/ISSN): ${meta.isbn || 'دیاری نەکراوە'}
* ناسێنەری دیجیتاڵی (DOI): ${meta.doi || 'تۆمار نەکراوە'}
* ڕەزامەندیی ئەخلاقی (IRB Clearance): ${meta.ethicalClearanceCode || 'کۆدی پەسەندکردن تۆمار نەکراوە'}
* ڕێسای مافی چاپ: ${meta.copyrightNotice || 'مەرجەکانی مافی چاپ دیاری نەکراوە'}
-------------------------------------------------------`;
  }

  public evaluatePreFlight(
    meta: PublishingMetadata,
    chapterCount: number,
    citationCount: number,
    verifiedCount: number,
    hasPassStatus: boolean,
    manuscriptSnapshot: string
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
        title: 'نیشانەکانی پشتڕاستکردنەوەی سەرچاوە (Server verification required)',
        status: 'WARN',
        detail: verifiedCount > 0
          ? `${verifiedCount} تۆمار نیشانەی verification هەیە لە ڕووکاردا؛ ئەمە بەڵگەی پشکنینی سەربەخۆ نییە و پێش دەرکردن دەبێت لەلایەن سێرڤەرەوە دووبارە بپشکنرێن.`
          : citationCount > 0
            ? 'سەرچاوە هەیە، بەڵام هیچ یەکێک لەم پشکنینی ڕووکارەدا بە شێوەیەکی سەربەخۆ نەسەلمێنراوە.'
            : 'هیچ سەرچاوەیەک نییە؛ پێش چاپ، سەرچاوەی ڕاستەقینە زیاد و پشتڕاست بکەوە.'
      },
      {
        id: 'legal_metadata',
        title: 'ژمارەی سپاردن و داتای چاپ (Legal & Deposit)',
        status: 'WARN',
        detail: meta.legalDepositNumber.trim() || meta.isbn.trim()
          ? 'داتای چاپ لە خانەکەدا نووسراوە، بەڵام لەم پشکنینی ناوخۆییەدا لەگەڵ تۆماری دەسەڵاتدار پشتڕاست نەکراوەتەوە.'
          : 'ژمارەی سپاردن و ISBN تۆمار نەکراون؛ زانیاریی ڕاستەقینەی گۆڤار/کتێبخانە دابین بکە.'
      },
      {
        id: 'ethical_clearance',
        title: 'ڕەزامەندیی ئەخلاقی (Ethical Clearance / IRB)',
        status: 'WARN',
        detail: meta.ethicalClearanceCode.trim()
          ? 'کۆدێک لە خانەکەدا تۆمارکراوە، بەڵام پەسەندکردنی IRB لەم ئەپەدا پشتڕاست نەکراوەتەوە.'
          : 'کۆدی پەسەندکردنی لێژنەی ئەخلاقی بەردەست نییە؛ ئەگەر توێژینەوەکە پێویستی پێیە، پەسەندکردنی ڕاستەقینە وەرگرە.'
      }
    ];

    const passCount = checks.filter(c => c.status === 'PASS').length;
    const readinessPercentage = Math.round((passCount / checks.length) * 100);

    const fingerprintPayload = JSON.stringify({
      manuscriptSnapshot,
      metadata: meta,
      chapterCount,
      citationCount,
      verifiedCount,
      hasPassStatus,
      checkResults: checks.map(check => ({ id: check.id, status: check.status }))
    });
    let preflightFingerprint = 'UNAVAILABLE';
    try {
      const digest = await globalThis.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(fingerprintPayload)
      );
      preflightFingerprint = 'SHA256:' + Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Readiness still renders, but never fabricate a hash if WebCrypto is unavailable.
    }

    return {
      overallStatus: checks.every(check => check.status === 'PASS') ? 'CAMERA_READY' : 'ACTION_REQUIRED',
      readinessPercentage,
      checks,
      preflightFingerprint,
      generatedAt: new Date().toISOString()
    };
  }
}
