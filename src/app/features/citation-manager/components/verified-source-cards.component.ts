import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SourceVerificationService, VerifiedAcademicSource, SourceVerificationStatus } from '../../../services/source-verification.service';
import { ManuscriptBridgeActionsService } from '../../../services/manuscript-bridge-actions.service';
import { AppNotificationsService } from '../../../core/app.notifications';

@Component({
  selector: 'app-verified-source-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 font-sans text-right" dir="rtl">
      <!-- Search & Verification Top Bar -->
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <mat-icon class="!text-lg">verified_user</mat-icon>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-100 font-serif">کارتەکانی سەرچاوەی پشتڕاستکراو (Crossref & OpenAlex)</h4>
              <p class="text-[10px] text-slate-400">تەنها ئەو سەرچاوەیانە شیاون بۆ بەکارهێنان کە بە فەرمی سەلمێنراون و پەسەند کراون.</p>
            </div>
          </div>

          <!-- Quick Stats Pills -->
          <div class="flex items-center gap-1.5 text-[10px] font-mono">
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              پەسەندکراو: {{ verificationService.approvedCount() }}
            </span>
            <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              پێداچوونەوە: {{ verificationService.needsReviewCount() }}
            </span>
            <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              کۆی گشتی: {{ verificationService.totalCount() }}
            </span>
          </div>
        </div>

        <!-- Real Lookup Input (DOI / Query) -->
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
          <label class="block text-[11px] font-bold text-slate-300 font-serif">
            پشکنین و دۆزینەوەی دەستبەجێ بە DOI یان ناونیشان (Crossref & OpenAlex):
          </label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="lookupInput"
              placeholder="بۆ نموونە: 10.1000/182 یان ناونیشانی توێژینەوەکە بنووسە..."
              (keyup.enter)="runLookup()"
              class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-serif"
            />
            <button
              type="button"
              (click)="runLookup()"
              [disabled]="isSearching() || !lookupInput.trim()"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md">
              <mat-icon class="!text-sm">search</mat-icon>
              <span>{{ isSearching() ? 'خەریکی پشکنینە...' : 'پشکنینی فەرمی' }}</span>
            </button>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800">
          <div class="flex-1 min-w-[200px] relative">
            <input
              type="text"
              [ngModel]="verificationService.searchQuery()"
              (ngModelChange)="verificationService.searchQuery.set($event)"
              placeholder="گەڕان بەدوای ناونیشان، نووسەر، DOI یان گۆڤار..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <mat-icon class="absolute right-2.5 top-2 text-slate-500 !text-sm !w-4 !h-4">filter_list</mat-icon>
          </div>

          <div class="flex items-center gap-1 text-[11px] font-serif">
            <button
              type="button"
              (click)="verificationService.statusFilter.set('ALL')"
              [class]="verificationService.statusFilter() === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer">
              هەموو
            </button>
            <button
              type="button"
              (click)="verificationService.statusFilter.set('VERIFIED')"
              [class]="verificationService.statusFilter() === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer">
              پشتڕاستکراو (VERIFIED)
            </button>
            <button
              type="button"
              (click)="verificationService.statusFilter.set('NEEDS_REVIEW')"
              [class]="verificationService.statusFilter() === 'NEEDS_REVIEW' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer">
              پێداچوونەوە
            </button>
            <button
              type="button"
              (click)="verificationService.statusFilter.set('FAILED')"
              [class]="verificationService.statusFilter() === 'FAILED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-lg font-bold transition cursor-pointer">
              شکستخواردوو
            </button>
          </div>
        </div>
      </div>

      <!-- Source Cards Grid -->
      @if (verificationService.filteredSources().length === 0) {
        <div class="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
          <mat-icon class="!text-3xl text-slate-500">menu_book</mat-icon>
          <p class="text-xs text-slate-300 font-serif">هیچ سەرچاوەیەک نەدۆزرایەوە.</p>
          <p class="text-[11px] text-slate-500">دەتوانیت DOI یان ناونیشانی کتێب/توێژینەوە لە باڕی سەرەوە بنووسیت بۆ پشکنینی فەرمی لە Crossref و OpenAlex.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (source of verificationService.filteredSources(); track source.id) {
            <div [class]="'p-4 rounded-2xl border space-y-3 transition-all relative ' +
              (source.status === 'VERIFIED' && source.userApproved ? 'bg-slate-900 border-emerald-500/40 shadow-sm' :
               source.status === 'VERIFIED' ? 'bg-slate-900 border-indigo-500/40' :
               source.status === 'NEEDS_REVIEW' ? 'bg-amber-950/20 border-amber-500/30' : 'bg-rose-950/20 border-rose-500/30')">

              <!-- Top Status Badges -->
              <div class="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  @if (source.status === 'VERIFIED') {
                    <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <mat-icon class="!text-xs !w-3 !h-3">verified</mat-icon>
                      VERIFIED
                    </span>
                  } @else if (source.status === 'NEEDS_REVIEW') {
                    <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <mat-icon class="!text-xs !w-3 !h-3">warning</mat-icon>
                      NEEDS REVIEW
                    </span>
                  } @else {
                    <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <mat-icon class="!text-xs !w-3 !h-3">error</mat-icon>
                      FAILED
                    </span>
                  }

                  @if (source.userApproved) {
                    <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      ✓ پەسەندکراوی توێژەر
                    </span>
                  }

                  <span class="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-slate-800 text-purple-300 border border-slate-700">
                    {{ source.provider }}
                  </span>
                </div>

                <button
                  type="button"
                  (click)="verificationService.removeSource(source.id)"
                  class="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                  title="سڕینەوە">
                  <mat-icon class="!text-xs !w-3.5 !h-3.5">delete</mat-icon>
                </button>
              </div>

              <!-- Main Bibliographic Info -->
              <div class="space-y-1">
                <h5 class="text-xs font-bold text-slate-100 leading-snug font-serif">
                  {{ source.title }}
                </h5>
                <p class="text-[11px] text-slate-300">
                  <strong class="text-slate-200">نووسەر:</strong> {{ source.authors.join('، ') || 'دیارینەکراو' }}
                  <span class="text-slate-500 mx-1">•</span>
                  <strong class="text-slate-200">ساڵ:</strong> {{ source.year }}
                </p>
                @if (source.venue) {
                  <p class="text-[10.5px] text-slate-400">
                    <strong class="text-slate-300">گۆڤار/بڵاوکەرەوە:</strong> {{ source.venue }}
                  </p>
                }
              </div>

              <!-- DOI & Canonical URL Links -->
              <div class="flex items-center gap-2 text-[10.5px] font-mono flex-wrap">
                @if (source.doi) {
                  <a
                    [href]="'https://doi.org/' + source.doi"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-0.5 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
                    <mat-icon class="!text-xs !w-3 !h-3">open_in_new</mat-icon>
                    doi:{{ source.doi }}
                  </a>
                }
                @if (source.url && !source.doi) {
                  <a
                    [href]="source.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/80">
                    <mat-icon class="!text-xs !w-3 !h-3">link</mat-icon>
                    لینکی فەرمی
                  </a>
                }
                <span class="text-slate-500 text-[9.5px]">
                  پشکنین: {{ source.retrievalTime ? source.retrievalTime.slice(0, 10) : 'ئەمڕۆ' }}
                </span>
              </div>

              <!-- Failure or Review Reason Alert -->
              @if (source.failureReason) {
                <div class="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                  <div class="flex items-center gap-1 font-bold">
                    <mat-icon class="!text-xs !w-3.5 !h-3.5 text-rose-400">info</mat-icon>
                    <span>هۆکاری تێبینی / ڕەتکردنەوە:</span>
                  </div>
                  <p class="text-[10.5px] leading-relaxed">{{ source.failureReason }}</p>
                  <p class="text-[9.5px] text-amber-300">💡 تکایە DOI دروست دابین بکە بۆ پشتڕاستکردنەوە.</p>
                </div>
              }

              <!-- Claim-to-Source Traceability -->
              <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1.5 font-serif">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-300 flex items-center gap-1 text-[10.5px]">
                    <mat-icon class="!text-xs !w-3.5 !h-3.5 text-purple-400">link</mat-icon>
                    بەستنەوە بە بانگەشەی تێز (Claim Traceability):
                  </span>
                  @if (!activeClaimEditingId || activeClaimEditingId !== source.id) {
                    <button
                      type="button"
                      (click)="startEditingClaim(source)"
                      class="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold cursor-pointer">
                      {{ source.claimText ? 'دەستکاری' : '+ بەستنەوە' }}
                    </button>
                  }
                </div>

                @if (source.claimText && (!activeClaimEditingId || activeClaimEditingId !== source.id)) {
                  <p class="text-slate-200 text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                    «{{ source.claimText }}»
                  </p>
                  @if (source.evidenceSnippet) {
                    <p class="text-[10px] text-slate-400 italic">
                      بەڵگە: "{{ source.evidenceSnippet }}" {{ source.pageNumber ? '(ل. ' + source.pageNumber + ')' : '' }}
                    </p>
                  }
                }

                @if (activeClaimEditingId === source.id) {
                  <div class="space-y-1.5 pt-1">
                    <input
                      type="text"
                      [(ngModel)]="tempClaimText"
                      placeholder="بانگەشە یان بڕگەی تێز کە ئەم سەرچاوەیە پشتیوانی دەکات..."
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    />
                    <input
                      type="text"
                      [(ngModel)]="tempEvidenceSnippet"
                      placeholder="دەقی بەڵگەی وەرگیراو لە سەرچاوەکەوە..."
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                    />
                    <div class="flex justify-end gap-1.5">
                      <button
                        type="button"
                        (click)="cancelClaimEditing()"
                        class="px-2.5 py-1 bg-slate-800 text-slate-400 text-[10px] rounded cursor-pointer">
                        پاشگەزبوونەوە
                      </button>
                      <button
                        type="button"
                        (click)="saveClaimEditing(source.id)"
                        class="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-bold rounded cursor-pointer">
                        پاشەکەوت
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Action Controls: Approval & Citation Insertion -->
              <div class="flex items-center gap-1.5 pt-2 border-t border-slate-800 flex-wrap">
                <!-- Approval Toggle Button -->
                @if (source.userApproved) {
                  <button
                    type="button"
                    (click)="verificationService.revokeApproval(source.id)"
                    class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10.5px] font-bold transition cursor-pointer">
                    هەڵوەشاندنەوەی پەسەند
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="onApprove(source.id)"
                    [disabled]="source.status !== 'VERIFIED'"
                    [class]="source.status === 'VERIFIED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'"
                    class="px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer">
                    <mat-icon class="!text-xs !w-3.5 !h-3.5">check_circle</mat-icon>
                    <span>پەسەندکردنی سەرچاوە</span>
                  </button>
                }

                <!-- In-Text Citation Button -->
                <button
                  type="button"
                  (click)="insertCitation(source, 'inline')"
                  [disabled]="source.status !== 'VERIFIED' || !source.userApproved"
                  [class]="(source.status === 'VERIFIED' && source.userApproved) ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'"
                  class="flex-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1">
                  <mat-icon class="!text-xs !w-3.5 !h-3.5">add</mat-icon>
                  <span>دانان وەک Citation</span>
                </button>

                <!-- Bibliography Insert Button -->
                <button
                  type="button"
                  (click)="insertCitation(source, 'bibliography')"
                  [disabled]="source.status !== 'VERIFIED' || !source.userApproved"
                  [class]="(source.status === 'VERIFIED' && source.userApproved) ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer' : 'bg-slate-850 text-slate-600 cursor-not-allowed'"
                  class="px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition"
                  title="دانان لە پێڕستی کۆتایی سەرچاوەکان">
                  پێڕست
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class VerifiedSourceCardsComponent {
  public verificationService = inject(SourceVerificationService);
  private bridgeActions = inject(ManuscriptBridgeActionsService);
  private toastService = inject(AppNotificationsService);

  lookupInput = '';
  isSearching = signal<boolean>(false);

  activeClaimEditingId: string | null = null;
  tempClaimText = '';
  tempEvidenceSnippet = '';

  async runLookup(): Promise<void> {
    const q = this.lookupInput.trim();
    if (!q) return;

    this.isSearching.set(true);
    try {
      const res = await this.verificationService.verifySource(q);
      if (res.status === 'VERIFIED') {
        this.toastService.showSuccess('سەرچاوەکە دۆزرایەوە', `سەرچاوەی «${res.title}» لە ${res.provider.toUpperCase()} پشتڕاستکرایەوە.`);
        this.lookupInput = '';
      } else {
        this.toastService.showWarning('پێویستی بە پێداچوونەوەیە', res.failureReason || 'سەرچاوەکە بە تەواوی نەسەلمێندرا.');
      }
    } catch (e: any) {
      this.toastService.showError('پشکنین سەرکەوتوو نەبوو', e?.message || 'هەڵە لە گەڕاندا.');
    } finally {
      this.isSearching.set(false);
    }
  }

  onApprove(id: string): void {
    const res = this.verificationService.approveSource(id);
    if (res.success) {
      this.toastService.showSuccess('سەرچاوە پەسەندکرا', res.message);
    } else {
      this.toastService.showWarning('پەسەندکردن ڕەتکرایەوە', res.message);
    }
  }

  insertCitation(source: VerifiedAcademicSource, mode: 'inline' | 'bibliography'): void {
    this.bridgeActions.injectAcademicSourceCitation(source, mode);
  }

  startEditingClaim(source: VerifiedAcademicSource): void {
    this.activeClaimEditingId = source.id;
    this.tempClaimText = source.claimText || '';
    this.tempEvidenceSnippet = source.evidenceSnippet || '';
  }

  cancelClaimEditing(): void {
    this.activeClaimEditingId = null;
    this.tempClaimText = '';
    this.tempEvidenceSnippet = '';
  }

  saveClaimEditing(id: string): void {
    this.verificationService.linkClaimToSource(id, this.tempClaimText, this.tempEvidenceSnippet);
    this.activeClaimEditingId = null;
    this.toastService.showSuccess('بانگەشە بەستراوە', 'بانگەشەی تێز بە سەرکەوتوویی بە سەرچاوەکەوە بەسترا.');
  }
}
