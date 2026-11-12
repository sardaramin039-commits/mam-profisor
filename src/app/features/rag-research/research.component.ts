import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RetrievedChunkModel } from '../../domain/models';
import { RagResearchService } from './services/rag-research';

@Component({
  selector: 'app-research-feature',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700/60 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/10">
            <mat-icon class="text-xl">psychology</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100">Research Agent & RAG</h3>
            <p class="text-xs text-slate-400">ئەجێنتی لێکۆڵینەوەی قووڵی ئەکادیمی (Deep Research Agent)</p>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80">
          <button
            (click)="activeMode.set('rag')"
            [class.bg-cyan-600]="activeMode() === 'rag'"
            [class.text-white]="activeMode() === 'rag'"
            [class.text-slate-400]="activeMode() !== 'rag'"
            class="px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1"
          >
            <mat-icon class="text-sm">find_in_page</mat-icon>
            گەڕانی RAG
          </button>
          <button
            (click)="activeMode.set('agent')"
            [class.bg-gradient-to-r]="activeMode() === 'agent'"
            [class.from-cyan-600]="activeMode() === 'agent'"
            [class.to-blue-600]="activeMode() === 'agent'"
            [class.text-white]="activeMode() === 'agent'"
            [class.text-slate-400]="activeMode() !== 'agent'"
            class="px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1"
          >
            <mat-icon class="text-sm">auto_awesome</mat-icon>
            Research Agent
          </button>
        </div>
      </div>

      <!-- Mode 1: Standard RAG Vector Search -->
      @if (activeMode() === 'rag') {
        <!-- Search Input -->
        <div class="p-4 border-b border-slate-800 bg-slate-800/40">
          <div class="relative flex items-center">
            <mat-icon class="absolute right-3 text-slate-400 text-lg">search</mat-icon>
            <input
              #searchInput
              type="text"
              placeholder="لێگەڕین بۆ بیرۆکە یان زاراوەی زانستی..."
              (keyup.enter)="search(searchInput.value)"
              class="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl pr-10 pl-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <!-- Results List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          @if (chunks().length === 0) {
            <div class="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 space-y-2">
              <mat-icon class="text-3xl text-cyan-400">find_in_page</mat-icon>
              <p class="text-xs">پێشنیارە زانستییەکان و پارچە دەقە پەیوەندیدارەکان لێرەدا دەردەکەون.</p>
            </div>
          } @else {
            @for (chunk of chunks(); track chunk.id) {
              <div class="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2 hover:border-cyan-500/50 transition-colors">
                <div class="flex items-center justify-between text-xs text-cyan-400 font-medium">
                  <span>{{ chunk.bookTitle }} - {{ chunk.bookAuthor }}</span>
                  <span class="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full text-[10px]">
                    پلەی پەیوەندی: {{ (chunk.relevanceScore * 100).toFixed(0) }}%
                  </span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">{{ chunk.content }}</p>
              </div>
            }
          }
        </div>
      }

      <!-- Mode 2: Deep Research Agent -->
      @if (activeMode() === 'agent') {
        <div class="p-4 border-b border-slate-800 bg-slate-800/40 space-y-3">
          <div class="flex gap-2">
            <input
              #topicInput
              type="text"
              placeholder="تەوەرەی توێژینەوەی قووڵ بنووسە (نموونە: کاریگەری ژیری دەستکرد لەسەر زانستە مرۆڤایەتییەکان)..."
              (keyup.enter)="runAgent(topicInput.value)"
              class="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              (click)="runAgent(topicInput.value)"
              [disabled]="ragService.isResearching()"
              class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              @if (ragService.isResearching()) {
                <mat-icon class="animate-spin text-sm">sync</mat-icon>
                لە توێژینەوەدایە...
              } @else {
                <mat-icon class="text-sm">auto_awesome</mat-icon>
                لێکۆڵینەوەی Research Agent
              }
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          @if (ragService.isResearching()) {
            <div class="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div class="relative w-12 h-12 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <mat-icon class="text-cyan-400 text-xl">psychology</mat-icon>
              </div>
              <p class="text-xs text-cyan-300 font-medium animate-pulse">Research Agent لە قووڵایی بنکەدراوە ئەکادیمییەکاندا دەگەڕێت...</p>
              <p class="text-[11px] text-slate-500">پۆلێنکردنی دۆزینەوە زانستییەکان، چوارچێوەی تیۆری و داڕشتنی پەرەگراف بە سۆرانی</p>
            </div>
          } @else {
            @if (ragService.researchAgentResult(); as res) {
            <div class="space-y-4">
              <!-- Executive Summary -->
              <div class="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
                <h4 class="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <mat-icon class="text-base">summarize</mat-icon>
                  پوختەی لێکۆڵینەوەی ڕیسرچ ئەجێنت
                </h4>
                <p class="text-xs text-slate-200 leading-relaxed">{{ res.executiveSummary }}</p>
              </div>

              <!-- Key Findings -->
              @if (res.keyFindings && res.keyFindings.length > 0) {
                <div class="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                  <h4 class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <mat-icon class="text-base">verified</mat-icon>
                    دۆزینەوە زانستییە سەرەکییەکان (Key Findings)
                  </h4>
                  <ul class="space-y-1.5 text-xs text-slate-300">
                    @for (finding of res.keyFindings; track $index) {
                      <li class="flex items-start gap-2">
                        <span class="text-emerald-400 mt-0.5">•</span>
                        <span>{{ finding }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }

              <!-- Kurdish Academic Synthesis -->
              @if (res.kurdishAcademicSynthesis) {
                <div class="p-4 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/50 rounded-xl space-y-2">
                  <h4 class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <mat-icon class="text-base">auto_awesome</mat-icon>
                    داڕشتنی ڕەسەنی ئەکادیمی بە سۆرانی (Synthesis)
                  </h4>
                  <p class="text-xs text-slate-200 leading-relaxed select-all italic bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    {{ res.kurdishAcademicSynthesis }}
                  </p>
                </div>
              }

              <!-- Academic Sources -->
              @if (res.academicSources && res.academicSources.length > 0) {
                <div class="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                  <h4 class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <mat-icon class="text-base">menu_book</mat-icon>
                    سەرچاوە پێشنیارکراوەکان
                  </h4>
                  <div class="space-y-2">
                    @for (src of res.academicSources; track $index) {
                      <div class="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                        <div class="font-semibold text-slate-200">{{ src.title }} ({{ src.year }})</div>
                        <div class="text-[11px] text-slate-400">نووسەران: {{ src.authors }} | {{ src.journal }}</div>
                        <div class="text-[11px] text-amber-300/80">{{ src.relevance }}</div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
            } @else {
              <div class="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 space-y-2">
                <mat-icon class="text-3xl text-cyan-400">psychology</mat-icon>
                <p class="text-xs">تەوەرەیەک بنووسە بۆ ئەوەی Research Agent توێژینەوەیەک لەسەر بابەتەکەت ئەنجام بدات.</p>
              </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class ResearchFeatureComponent {
  ragService = inject(RagResearchService);

  chunks = input<RetrievedChunkModel[]>([]);
  searchRequested = output<string>();

  activeMode = signal<'rag' | 'agent'>('agent');

  search(term: string) {
    if (term.trim()) {
      this.searchRequested.emit(term.trim());
    }
  }

  runAgent(topic: string) {
    if (topic.trim()) {
      this.ragService.runDeepResearchAgent(topic.trim());
    }
  }
}

