import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface GraphMetricData {
  totalClaims: number;
  supportedClaims: number;
  unsupportedClaims: number;
  evidenceCoveragePercent: number;
  graphIntegrityScore: number;
  verifiedCitationsCount: number;
  partiallyVerifiedCount: number;
  syntheticCitationsBlockedCount: number;
  trustLevelDistribution: {
    tierA: number;
    tierB: number;
    tierC: number;
    tierF: number;
  };
}

@Component({
  selector: 'app-integrity-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-6 font-sans text-right text-slate-100" dir="rtl">
      
      <!-- Top Title Bar -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <mat-icon class="!text-2xl">analytics</mat-icon>
          </div>
          <div>
            <h2 class="text-base font-extrabold text-slate-100 flex items-center gap-2 font-serif">
              <span>داشبۆردی پشتڕاستکردنەوە و بڕواپێکراوی زانستی (Thesis Integrity Dashboard)</span>
              <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                P2 Claim-Evidence Graph Active
              </span>
            </h2>
            <p class="text-xs text-slate-400 font-serif mt-0.5">
              پشکنین و شیbottom‌کردنەوەی بڕواپێکراوی، ڕێژەی پشتگیریی بەڵگەکان و فیلتەرکردنی ژێدەرە خەیاڵییەکان
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="refreshMetrics()"
            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
            <mat-icon class="!text-sm text-emerald-400">sync</mat-icon>
            <span>نوێکردنەوەی داتاکان</span>
          </button>
        </div>
      </div>

      <!-- Top Metric Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div class="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-1 text-center shadow-md">
          <span class="text-[11px] text-slate-400 block font-serif">کۆی ئیدعا زانستییەکان</span>
          <span class="text-2xl font-extrabold text-indigo-400 font-mono">{{ metrics().totalClaims }}</span>
          <span class="text-[10px] text-slate-400 block">Claims in Thesis Graph</span>
        </div>

        <div class="p-4 bg-emerald-950/30 border border-emerald-800/80 rounded-xl space-y-1 text-center shadow-md">
          <span class="text-[11px] text-emerald-300 block font-serif">ئیدعای بەڵگەدار (Supported)</span>
          <span class="text-2xl font-extrabold text-emerald-400 font-mono">{{ metrics().supportedClaims }}</span>
          <span class="text-[10px] text-emerald-300/80 block">Verified Evidence Grounded</span>
        </div>

        <div class="p-4 bg-amber-950/30 border border-amber-800/80 rounded-xl space-y-1 text-center shadow-md">
          <span class="text-[11px] text-amber-300 block font-serif">کەموکوڕیی بەڵگە (Unsupported)</span>
          <span class="text-2xl font-extrabold text-amber-400 font-mono">{{ metrics().unsupportedClaims }}</span>
          <span class="text-[10px] text-amber-300/80 block">Gaps Needing Source</span>
        </div>

        <div class="p-4 bg-purple-950/30 border border-purple-800/80 rounded-xl space-y-1 text-center shadow-md">
          <span class="text-[11px] text-purple-300 block font-serif">نمرەی ڕەسەنایەتی (Integrity)</span>
          <span class="text-2xl font-extrabold text-purple-300 font-mono">{{ metrics().graphIntegrityScore }}%</span>
          <span class="text-[10px] text-purple-300/80 block">Graph Score Standard</span>
        </div>

      </div>

      <!-- Main Recharts / SVG Chart Visualization Area -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Chart 1: Evidence Coverage Donut / Bar Visualizer -->
        <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
              <mat-icon class="!text-base text-emerald-400">pie_chart</mat-icon>
              <span>داپۆشینی بەڵگەکان (Evidence Coverage %)</span>
            </h3>
            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded">
              {{ metrics().evidenceCoveragePercent }}% Grounded
            </span>
          </div>

          <!-- SVG Donut Chart -->
          <div class="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            <div class="relative w-40 h-40 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <!-- Background track -->
                <path
                  class="text-slate-800"
                  stroke-width="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <!-- Primary Progress ring -->
                <path
                  class="text-emerald-500 transition-all duration-1000 ease-out"
                  [attr.stroke-dasharray]="metrics().evidenceCoveragePercent + ', 100'"
                  stroke-width="3.8"
                  stroke-linecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="absolute flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold text-slate-100 font-mono">{{ metrics().evidenceCoveragePercent }}%</span>
                <span class="text-[9px] text-slate-400 font-serif">Coverage</span>
              </div>
            </div>

            <!-- Legend & Details -->
            <div class="space-y-2 text-xs font-serif w-full sm:w-auto">
              <div class="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span class="text-slate-300">ئیدعای بەڵگەدار:</span>
                <strong class="text-emerald-400 font-mono mr-auto">{{ metrics().supportedClaims }}</strong>
              </div>
              <div class="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span class="text-slate-300">ئیدعای بێ بەڵگە:</span>
                <strong class="text-amber-400 font-mono mr-auto">{{ metrics().unsupportedClaims }}</strong>
              </div>
              <div class="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span class="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                <span class="text-slate-300">سەرچاوەی بەشێکی (Partial):</span>
                <strong class="text-indigo-400 font-mono mr-auto">{{ metrics().partiallyVerifiedCount }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart 2: Source Trust Level Bar Chart -->
        <div class="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold text-slate-200 font-serif flex items-center gap-1.5">
              <mat-icon class="!text-base text-indigo-400">bar_chart</mat-icon>
              <span>دابەشبوونی باوڕپێکراوی سەرچاوەکان (Trust Level Breakdown)</span>
            </h3>
            <span class="text-[10px] text-slate-400 font-serif">Tiers Distribution</span>
          </div>

          <div class="space-y-3 font-serif text-xs pt-1">
            <!-- Tier A+ / A -->
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-emerald-300 font-bold flex items-center gap-1">
                  🟢 Tier A+ / A (کتێبی ئەکادیمی & ژورناڵی باوڕپێکراو)
                </span>
                <span class="text-emerald-400 font-mono font-bold">{{ metrics().trustLevelDistribution.tierA }}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  class="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                  [style.width.%]="getPercent(metrics().trustLevelDistribution.tierA)">
                </div>
              </div>
            </div>

            <!-- Tier B -->
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-indigo-300 font-bold flex items-center gap-1">
                  🔵 Tier B (ئەرشیفی دیجیتاڵی & کتێبخانە ڕەسمییەکان)
                </span>
                <span class="text-indigo-400 font-mono font-bold">{{ metrics().trustLevelDistribution.tierB }}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  class="bg-indigo-500 h-2.5 rounded-full transition-all duration-700"
                  [style.width.%]="getPercent(metrics().trustLevelDistribution.tierB)">
                </div>
              </div>
            </div>

            <!-- Tier C -->
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  🟡 Tier C (ماڵپەڕی گشتی - پێویستی بە بەڵگەی سەربار هەیە)
                </span>
                <span class="text-amber-400 font-mono font-bold">{{ metrics().trustLevelDistribution.tierC }}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  class="bg-amber-500 h-2.5 rounded-full transition-all duration-700"
                  [style.width.%]="getPercent(metrics().trustLevelDistribution.tierC)">
                </div>
              </div>
            </div>

            <!-- Tier F / Fabricated Blocked -->
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-rose-400 font-bold flex items-center gap-1">
                  🔴 Tier F (سەرچاوەی بێبەڵگە / Fabricated Synthetic Citation Blocked)
                </span>
                <span class="text-rose-400 font-mono font-bold">{{ metrics().syntheticCitationsBlockedCount }}</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  class="bg-rose-500 h-2.5 rounded-full transition-all duration-700"
                  [style.width.%]="getPercent(metrics().syntheticCitationsBlockedCount)">
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Provenance Audit Footer Banner -->
      <div class="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs font-serif">
        <div class="flex items-center gap-2">
          <mat-icon class="text-emerald-400">verified_user</mat-icon>
          <span class="text-slate-200">
            سیستەمی گەرەنتی ڕەسەنایەتی: هەموو سەرچاوەیەکی [VERIFIED] بە بەڵگەی لاپەڕە و تێکستی کتێب سەلمێنراوە.
          </span>
        </div>
        <div class="text-[10.5px] text-emerald-400 font-mono font-bold">
          Verified Citations: {{ metrics().verifiedCitationsCount }} | Synthetic Blocked: {{ metrics().syntheticCitationsBlockedCount }}
        </div>
      </div>

    </div>
  `
})
export class IntegrityDashboardComponent {
  metrics = signal<GraphMetricData>({
    totalClaims: 18,
    supportedClaims: 15,
    unsupportedClaims: 3,
    evidenceCoveragePercent: 83,
    graphIntegrityScore: 92,
    verifiedCitationsCount: 14,
    partiallyVerifiedCount: 3,
    syntheticCitationsBlockedCount: 2,
    trustLevelDistribution: {
      tierA: 10,
      tierB: 5,
      tierC: 3,
      tierF: 2
    }
  });

  refreshMetrics(): void {
    // Simulate updating metrics from current graph state
    this.metrics.update(m => ({
      ...m,
      evidenceCoveragePercent: Math.round((m.supportedClaims / m.totalClaims) * 100)
    }));
  }

  getPercent(val: number): number {
    const total = this.metrics().totalClaims || 1;
    return Math.min(100, Math.round((val / total) * 100));
  }
}
