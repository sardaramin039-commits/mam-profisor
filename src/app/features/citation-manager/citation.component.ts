import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AcademicSourceModel } from '../../domain/models';
import { SourceVerificationComponent } from './source-verification.component';
import { AutomatedBibliographyGeneratorComponent } from './components/automated-bibliography-generator.component';
import { D3CitationGraphComponent } from '../d3-charts/d3-citation-graph.component';
import { ApiBibliographySearchComponent } from './components/api-bibliography-search.component';
import { ChatGptSourcesHubComponent } from './components/chatgpt-sources-hub.component';
import { VerifiedSourceCardsComponent } from './components/verified-source-cards.component';

@Component({
  selector: 'app-citation-feature',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    SourceVerificationComponent,
    AutomatedBibliographyGeneratorComponent,
    D3CitationGraphComponent,
    ApiBibliographySearchComponent,
    ChatGptSourcesHubComponent,
    VerifiedSourceCardsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-2">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl backdrop-blur-md flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-purple-500/10">
            <mat-icon class="text-xl">format_quote</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100">بەڕێوەبەری سەرچاوە زانستییەکان و دروستکەری خۆکاری بیبلیۆگرافی</h3>
            <p class="text-xs text-slate-400">فۆرماتکردنی فەرمی APA, MLA, Harvard, Kurdish و پشکنینی ڕاستییەتی دەق</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="exportToBibTeX()"
            class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm">
            <mat-icon class="text-sm">download</mat-icon>
            Export to BibTeX (.bib)
          </button>
          <button 
            (click)="addSourceRequested.emit()"
            class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
            <mat-icon class="text-sm">add</mat-icon>
            زیادکردن
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 px-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          (click)="activeSubTab.set('auto_bib')"
          [class]="activeSubTab() === 'auto_bib'
            ? 'bg-purple-600 text-white font-bold'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
          <mat-icon class="text-sm">auto_stories</mat-icon>
          <span>دروستکەری خۆکاری پێڕستی سەرچاوەکان</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab.set('citation_graph')"
          [class]="activeSubTab() === 'citation_graph'
            ? 'bg-purple-600 text-white font-bold'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
          <mat-icon class="text-sm">bubble_chart</mat-icon>
          <span>نەخشەی سەرچاوەکان (Citation Graph)</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab.set('api_search')"
          [class]="activeSubTab() === 'api_search'
            ? 'bg-purple-600 text-white font-bold'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
          <mat-icon class="text-sm">public</mat-icon>
          <span>گەڕانی API و فۆرمات (Crossref/Google Books)</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab.set('sources_list')"
          [class]="activeSubTab() === 'sources_list'
            ? 'bg-purple-600 text-white font-bold'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
          <mat-icon class="text-sm">list_alt</mat-icon>
          <span>سەرچاوە تۆمارکراوەکان ({{ sources().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab.set('chatgpt_sources')"
          [class]="activeSubTab() === 'chatgpt_sources'
            ? 'bg-emerald-600 text-white font-bold'
            : 'bg-slate-800/80 text-emerald-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-emerald-500/30">
          <mat-icon class="text-sm text-emerald-400">psychology</mat-icon>
          <span>دۆزینەوە و ڕێکخستن بە ChatGPT</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab.set('verify')"
          [class]="activeSubTab() === 'verify'
            ? 'bg-purple-600 text-white font-bold'
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'"
          class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
          <mat-icon class="text-sm">verified</mat-icon>
          <span>پشتڕاستکردنەوەی سەرچاوەکان</span>
        </button>
      </div>

      <!-- Tab 1: Automated Bibliography Generator -->
      @if (activeSubTab() === 'auto_bib') {
        <app-automated-bibliography-generator></app-automated-bibliography-generator>
      }

      <!-- Tab 2: D3 Citation Graph -->
      @if (activeSubTab() === 'citation_graph') {
        <app-d3-citation-graph [sources]="sources()"></app-d3-citation-graph>
      }

      <!-- Tab 3: API Bibliography Search (Crossref & Google Books) -->
      @if (activeSubTab() === 'api_search') {
        <app-api-bibliography-search></app-api-bibliography-search>
      }

      <!-- Tab 4: Searchable Verified Source Cards (Crossref & OpenAlex) -->
      @if (activeSubTab() === 'sources_list') {
        <app-verified-source-cards></app-verified-source-cards>
      }

      <!-- Tab 5: Strict Source Verification System Sub-Module -->
      @if (activeSubTab() === 'verify') {
        <app-source-verification></app-source-verification>
      }

      <!-- Tab 6: ChatGPT Academic Sources Hub -->
      @if (activeSubTab() === 'chatgpt_sources') {
        <app-chatgpt-sources-hub></app-chatgpt-sources-hub>
      }
    </div>
  `
})
export class CitationFeatureComponent {
  sources = input<AcademicSourceModel[]>([]);
  addSourceRequested = output<void>();
  activeSubTab = signal<'auto_bib' | 'citation_graph' | 'api_search' | 'sources_list' | 'verify' | 'chatgpt_sources'>('chatgpt_sources');

  exportToBibTeX(): void {
    const eligibleSources = this.sources().filter(source => {
      const sourceAny = source as AcademicSourceModel & {
        evidenceType?: 'abstract' | 'snippet' | 'full-text';
        evidenceProvenance?: 'server-verified-fulltext' | 'user-supplied-content' | 'unknown';
        volume?: string | number;
        issue?: string | number;
        pages?: string;
      };
      return (
        source.identityStatus === 'verified' &&
        source.evidenceStatus === 'verified' &&
        source.citationEligible === true &&
        sourceAny.evidenceType === 'full-text' &&
        sourceAny.evidenceProvenance === 'server-verified-fulltext' &&
        Boolean(source.evidenceText?.trim())
      );
    });

    if (eligibleSources.length === 0) return;

    const escapeBibtex = (value: unknown): string =>
      String(value ?? '')
        .replace(/([\\{}])/g, '\\$1')
        .replace(/([%&#_])/g, '\\$1')
        .trim();

    const entries = eligibleSources.map((source, index) => {
      const sourceAny = source as AcademicSourceModel & {
        journal?: string;
        volume?: string | number;
        issue?: string | number;
        pages?: string;
      };
      const authors = Array.isArray(source.authors) && source.authors.length
        ? source.authors.join(' and ')
        : source.author;
      const authorKey = (authors || 'ref').split(/[\s,]+/)[0].toLowerCase();
      const year = Number(source.year);
      const citeKey = `${authorKey}${Number.isFinite(year) && year > 0 ? year : 'nd'}_${index + 1}`;
      const type = source.sourceType === 'book'
        ? 'book'
        : source.sourceType === 'thesis'
          ? 'phdthesis'
          : source.sourceType === 'manuscript'
            ? 'unpublished'
            : 'article';
      const fields = [
        `  author = {${escapeBibtex(authors)}}`,
        `  title = {${escapeBibtex(source.title)}}`,
        ...((type === 'article' && sourceAny.journal) ? [`  journal = {${escapeBibtex(sourceAny.journal)}}`] : []),
        ...((type === 'book' && source.publisher) ? [`  publisher = {${escapeBibtex(source.publisher)}}`] : []),
        ...((type === 'phdthesis' && source.publisher) ? [`  school = {${escapeBibtex(source.publisher)}}`] : []),
        ...(sourceAny.volume ? [`  volume = {${escapeBibtex(sourceAny.volume)}}`] : []),
        ...(sourceAny.issue ? [`  number = {${escapeBibtex(sourceAny.issue)}}`] : []),
        ...(sourceAny.pages ? [`  pages = {${escapeBibtex(sourceAny.pages)}}`] : []),
        ...(Number.isFinite(year) && year > 0 ? [`  year = {${year}}`] : []),
        ...(source.doi ? [`  doi = {${escapeBibtex(source.doi)}}`] : []),
        ...(source.url ? [`  url = {${escapeBibtex(source.url)}}`] : [])
      ];
      return `@${type}{${citeKey},\\n${fields.join(',\\n')}\\n}\\n`;
    });

    const bibtexStr = '% BibTeX Export generated by Academic Research Suite\\n\\n' +
      entries.join('\\n');
    const blob = new Blob([bibtexStr], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bibliography_references.bib';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
