import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { VerifiedCitationRecord, EvidenceLinkedClaim, ResearchGateAuditResult } from '../../../helpers/source-verification-engine';

@Component({
  selector: 'app-source-evidence-tabs',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- TAB 3: Deduplication (Canonical Sources) -->
    @if (activeTab() === 'DEDUPLICATION') {
      <div class="space-y-4 font-serif">
        <div class="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-2">
          <h4 class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <mat-icon class="!text-sm text-emerald-400">verified</mat-icon>
            سیستەمی ناسینەوە و پاککردنەوەی سەرچاوەی دووبارە (Canonical Deduplication):
          </h4>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            هەمان کتێب کە لە Google Books، WorldCat یان Internet Archive دۆزرابێتەوە، ناکرێتە چوار سەرچاوەی جیاواز؛ تەنها Canonical Source هەڵدەبژێردرێت.
          </p>
        </div>

        <div class="space-y-3">
          @for (src of deduplicatedSources(); track src.id) {
            <div class="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2 text-xs">
              <div class="flex items-center justify-between border-b pb-2 border-white/10">
                <span class="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/40">
                  canonicalSource: true
                </span>
                <span class="text-[10.5px] text-amber-300 font-mono">
                  Mirrors / Duplicates: {{ src.mirrorsCount }}
                </span>
              </div>

              <div>
                <h4 class="font-bold text-slate-100 text-sm">{{ src.title }}</h4>
                <p class="text-slate-400 text-[11px] mt-0.5">
                  نووسەر: {{ src.author }} ({{ src.publicationYear }}) | {{ src.publisherOrJournal }}
                </p>
              </div>

              <div class="p-2 bg-slate-950/60 rounded border border-slate-800 text-[10.5px] text-slate-300 font-mono">
                identifiers: {{ jsonStringify(src.identifiers) }}
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- TAB 4: Evidence Linking & AI Distinction -->
    @if (activeTab() === 'EVIDENCE_LINK') {
      <div class="space-y-4 font-serif">
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div class="p-2.5 bg-emerald-950/30 border border-emerald-800/80 rounded-lg space-y-1">
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
              [Source-Based] [Evidence Verified]
            </span>
            <p class="text-[10.5px] text-slate-300 mt-1">زانیارییەکە ڕاستەوخۆ پشتبەستووە بە سەرچاوەی خوێندراوەوە.</p>
          </div>

          <div class="p-2.5 bg-amber-950/30 border border-amber-800/80 rounded-lg space-y-1">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
              [Synthesis] [Multiple Sources]
            </span>
            <p class="text-[10.5px] text-slate-300 mt-1">لە کۆکردنەوە و بەراوردکردنی چەند سەرچاوەیەک دروست بووە.</p>
          </div>

          <div class="p-2.5 bg-purple-950/30 border border-purple-800/80 rounded-lg space-y-1">
            <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
              [AI-Inference] [Requires Verification]
            </span>
            <p class="text-[10.5px] text-slate-300 mt-1">شیکاریی نوێی AIـیە و نابێت وەک سەرچاوەی ڕاستییەتی پیشان بدرێت.</p>
          </div>
        </div>

        <div class="space-y-3">
          @for (claim of linkedClaims(); track claim.claimId) {
            <div class="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2 text-xs">
              <div class="flex items-center justify-between border-b pb-2 border-white/10 flex-wrap gap-1">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/30">
                    {{ claim.badges.primary }}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">
                    {{ claim.badges.secondary }}
                  </span>
                </div>
                <span class="text-[10.5px] text-emerald-400 font-mono">Confidence: {{ claim.confidenceScore }}%</span>
              </div>

              <div>
                <h4 class="font-bold text-slate-100 text-sm">📌 {{ claim.claimText }}</h4>
              </div>

              <div class="p-3 bg-black/40 border border-slate-800 rounded-lg space-y-2 text-[11px] text-slate-300">
                <div class="flex items-center gap-1 font-bold text-amber-400 text-[10.5px]">
                  <mat-icon class="!text-xs">sync_alt</mat-icon>
                  Chain: Claim ➔ Evidence ➔ Source ➔ Page
                </div>
                <p class="bg-slate-900 p-2 rounded border border-slate-800">
                  <strong class="text-slate-400 text-[10px] block">بەڵگەی سەلمێنەر (Exact Evidence):</strong>
                  "{{ claim.evidenceText }}"
                </p>
                <p class="text-slate-400">
                  سەرچاوە: <strong class="text-slate-200">{{ claim.sourceTitle }}</strong> — {{ claim.author }} ({{ claim.publicationYear }})
                  @if (claim.pageNumber) {
                    <span class="text-amber-300 font-mono"> | {{ claim.pageNumber }}</span>
                  }
                </p>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- TAB 5: Pre-Writing Research Gate -->
    @if (activeTab() === 'RESEARCH_GATE') {
      <div class="space-y-4 font-serif">
        @let gate = researchGateAudit();

        @if (gate.passed) {
          <div class="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2">
            <div class="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <mat-icon class="!text-lg">check_circle</mat-icon>
              <span>Research Gate: PASSED، ئامادەیە بۆ نووسین</span>
            </div>
            <p class="text-xs text-slate-300">
              سەرچاوەکان و بەڵگەی پەیوەستکراو پشکنراون. ئەمە هێشتا جێگەی پێداچوونەوەی مرۆیی و پشکنینی journal requirement ـەکان ناگرێتەوە.
            </p>
          </div>
        } @else {
          <div class="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-3">
            <div class="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <mat-icon class="!text-lg">block</mat-icon>
              <span>Research Gate: FAILED، بەڵگە پێویستە</span>
            </div>
            <p class="text-xs text-slate-300">
              نووسینی citation ـی Verified تا کاتی چارەسەرکردنی کەموکوڕییەکانی بەڵگە و سەرچاوە ڕێگەپێدراو نییە.
            </p>

            <div class="space-y-2 pt-2 border-t border-rose-900/60 text-xs text-slate-200">
              <div>
                <strong class="text-rose-400 font-bold block mb-1">Claim و Evidence ـی کەم:</strong>
                <ul class="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                  @for (m of gate.missingEvidence; track m) {
                    <li>{{ m }}</li>
                  }
                </ul>
              </div>

              <div class="pt-2">
                <strong class="text-amber-300 font-bold block mb-1">شوێنەکانی گەڕان بۆ سەرچاوە:</strong>
                <div class="flex items-center gap-2 flex-wrap text-[10.5px]">
                  @for (rec of gate.recommendedSources; track rec) {
                    <span class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">
                      {{ rec }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})

export class SourceEvidenceTabsComponent {
  activeTab = input.required<'VERIFICATION' | 'RANKING' | 'DEDUPLICATION' | 'EVIDENCE_LINK' | 'RESEARCH_GATE' | 'INTEGRITY_DASHBOARD' | 'RERANKING'>();
  deduplicatedSources = input.required<VerifiedCitationRecord[]>();
  linkedClaims = input.required<EvidenceLinkedClaim[]>();
  researchGateAudit = input.required<ResearchGateAuditResult>();

  jsonStringify(val: any): string {
    try {
      return JSON.stringify(val);
    } catch {
      return '{}';
    }
  }
}
