import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AcademicPlatformService } from '../../services/academic-platform.service';

@Component({
  selector: 'app-academic-platform',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-serif">
      
      <!-- Top Title Banner -->
      <div class="bg-gradient-to-r from-stone-900 via-harvard-crimson to-stone-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-harvard-gold flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="bg-harvard-gold text-black font-mono font-black text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">Academic Operating System</span>
            <span class="text-xs text-stone-300 font-mono">Veritas Engine 2.5</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold mt-2">🏛️ پلاتفۆرمی باڵای توێژینەوەی ئەکادیمی (Production Platform)</h1>
          <p class="text-xs sm:text-sm text-stone-200 mt-1 max-w-2xl">
            زنجیرەی 10 بەشی ژیریی دەستکرد: لە دۆزینەوەی سەرچاوەوە تا گرافی بەڵگە، پشکنینی پڕۆفیسۆر، QA Gate و مۆری ڕەسانەییی زمانی کوردی.
          </p>
        </div>
        <button (click)="loadTelemetry()" class="bg-black/40 hover:bg-black/70 border border-white/20 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all">
          <mat-icon class="!w-4 !h-4 text-harvard-gold">monitoring</mat-icon>
          <span>دۆخی سیستەم (Observability)</span>
        </button>
      </div>

      <!-- Main Input Form & Orchestrator Panel -->
      <div class="bg-white border-2 border-harvard-crimson/20 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 class="text-lg font-bold text-stone-900 flex items-center gap-2 border-b pb-3 border-stone-200">
          <mat-icon class="text-harvard-crimson">schema</mat-icon>
          <span>داڕشتنی پڕۆژەی ئەکادیمی و بەگەڕخستنی 10-Agent Pipeline</span>
        </h2>

        <form [formGroup]="researchForm" (ngSubmit)="onOrchestrate()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-xs font-bold text-stone-700">تەوەر یان پرسیاری سەرەکی توێژینەوە:</label>
            <input type="text" formControlName="topic" placeholder="مۆدێرنیتە و بونیادی گوتاری فکری لە ئەدەبی کوردی..." class="w-full text-xs p-3 border border-stone-300 rounded-xl focus:border-harvard-crimson focus:outline-none" />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-stone-700">بواری زانستی (Discipline):</label>
            <input type="text" formControlName="discipline" placeholder="ئەدەب و ڕەخنەی فکری / مێژوو / زمانەوانی" class="w-full text-xs p-3 border border-stone-300 rounded-xl focus:border-harvard-crimson focus:outline-none" />
          </div>

          <div class="md:col-span-2 space-y-1">
            <label class="block text-xs font-bold text-stone-700">دەقی ڕەشنووس یان پوختە (ئارەزوومەندانە):</label>
            <textarea formControlName="draftText" rows="3" placeholder="تێکست یان پەرەگرافی ڕەشنووسەکە لێرە بنووسە بۆ هەڵسەنگاندن..." class="w-full text-xs p-3 border border-stone-300 rounded-xl focus:border-harvard-crimson focus:outline-none"></textarea>
          </div>

          <div class="md:col-span-2 flex justify-end">
            <button type="submit" [disabled]="platformService.isOrchestrating() || researchForm.invalid" class="bg-harvard-crimson hover:bg-harvard-dark disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all">
              <mat-icon class="!w-4 !h-4 text-harvard-gold">psychology</mat-icon>
              <span>{{ platformService.isOrchestrating() ? 'ئێستا 10 بەشەکەی ژیریی دەستکرد لە کارداند...' : 'بەگەڕخستنی Multi-Agent Pipeline' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Execution Results -->
      @if (result(); as res) {
        <div class="space-y-8">
          
          <!-- Agent Pipeline Log -->
          <div class="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md space-y-4">
            <h3 class="text-sm font-bold text-harvard-gold flex items-center gap-2">
              <mat-icon class="!w-4 !h-4">reorder</mat-icon>
              <span>تۆماری ئاراستەی 10 Specialized AI Agents</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
              @for (log of res.executionPipelineLog; track log.step) {
                <div class="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
                  <div class="flex items-center justify-between font-mono text-[9.5px] text-stone-400">
                    <span>STEP {{ log.step }}</span>
                    <span class="text-emerald-400">✓ {{ log.status }}</span>
                  </div>
                  <p class="font-bold text-white mt-1.5">{{ log.agentName }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Claim-Evidence Graph & Integrity Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Claim-Evidence Graph -->
            <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b pb-3 border-stone-150">
                <h3 class="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <mat-icon class="text-indigo-600">hub</mat-icon>
                  <span>Claim–Evidence Graph</span>
                </h3>
                <span class="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200">
                  Integrity: {{ res.claimEvidenceGraphIntegrity }}/100
                </span>
              </div>
              <p class="text-xs text-stone-600">هەموو ئیدعایەک (Claim) دەبێت بە بەڵگەی ڕاستەقینەی (Verified Evidence) سەرچاوە زانستییەکانەوە ببەسترێتەوە:</p>
              
              <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
                @for (arg of res.thesisStructurePlan?.arguments; track arg.id) {
                  <div class="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div class="flex justify-between items-start">
                      <span class="font-bold text-harvard-crimson">{{ arg.id }}: {{ arg.claim }}</span>
                      <span class="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Verified</span>
                    </div>
                    <div class="text-stone-600 pl-2 border-r-2 border-harvard-crimson/30 space-y-1">
                      @for (quote of arg.evidenceQuotes; track quote) {
                        <p class="text-[11px] italic">« {{ quote }} »</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Reviewer Report & QA Gate -->
            <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b pb-3 border-stone-150">
                <h3 class="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <mat-icon class="text-harvard-crimson">verified</mat-icon>
                  <span>هەڵسەنگاندنی پڕۆفیسۆر & QA Gate</span>
                </h3>
                <span class="text-xs font-extrabold bg-harvard-crimson text-white px-2.5 py-1 rounded-md">
                  Overall: {{ res.reviewerReport?.overallScore }}/10
                </span>
              </div>

              <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <span class="font-bold">QA Gate Status:</span>
                <span class="font-mono font-black uppercase">{{ res.qaGateResult?.exportBlocked ? 'EXPORT BLOCKED' : '✓ PASSED & READY' }}</span>
              </div>

              <p class="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                {{ res.reviewerReport?.summaryCritiqueKurdish }}
              </p>
            </div>

          </div>

        </div>
      }

      <!-- Telemetry Dialog Overlay -->
      @if (telemetry(); as tel) {
        <div class="p-6 bg-stone-900 text-white rounded-2xl border-2 border-harvard-gold space-y-4">
          <div class="flex justify-between items-center border-b border-stone-700 pb-3">
            <h3 class="font-bold text-sm text-harvard-gold flex items-center gap-2">
              <mat-icon>speed</mat-icon>
              <span>Observability Telemetry Dashboard</span>
            </h3>
            <button (click)="telemetry.set(null)" class="text-stone-400 hover:text-white cursor-pointer">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
            <div class="bg-stone-800 p-3 rounded-xl">
              <span class="block text-stone-400 text-[10px]">Total Requests</span>
              <span class="font-mono font-bold text-lg text-emerald-400">{{ tel.totalRequests }}</span>
            </div>
            <div class="bg-stone-800 p-3 rounded-xl">
              <span class="block text-stone-400 text-[10px]">Avg Latency</span>
              <span class="font-mono font-bold text-lg text-cyan-400">{{ tel.averageLatencyMs }} ms</span>
            </div>
            <div class="bg-stone-800 p-3 rounded-xl">
              <span class="block text-stone-400 text-[10px]">Total Tokens</span>
              <span class="font-mono font-bold text-lg text-amber-400">{{ tel.totalTokensUsed }}</span>
            </div>
            <div class="bg-stone-800 p-3 rounded-xl">
              <span class="block text-stone-400 text-[10px]">Est Cost USD</span>
              <span class="font-mono font-bold text-lg text-pink-400"><span>$</span>{{ tel.estimatedTotalCostUsd }}</span>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class AcademicPlatformComponent {
  platformService = inject(AcademicPlatformService);
  fb = inject(FormBuilder);

  researchForm: FormGroup = this.fb.group({
    topic: ['مۆدێرنیتە و بونیادی گوتاری فکری لە ئەدەبی کوردی', [Validators.required]],
    discipline: ['ئەدەب و زاراوەسازی ئەکادیمی', [Validators.required]],
    draftText: ['']
  });

  result = signal<any | null>(null);
  telemetry = signal<any | null>(null);

  async onOrchestrate() {
    if (this.researchForm.invalid) return;
    const { topic, discipline, draftText } = this.researchForm.value;
    try {
      const res = await this.platformService.orchestratePipeline(topic, discipline, draftText);
      this.result.set(res);
    } catch (err) {
      console.error('Error orchestrating:', err);
    }
  }

  async loadTelemetry() {
    try {
      const tel = await this.platformService.getTelemetry();
      this.telemetry.set(tel);
    } catch (err) {
      console.error('Error loading telemetry:', err);
    }
  }
}
