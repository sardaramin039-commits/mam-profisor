import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface TextLineageNode {
  id: string;
  sequenceIndex: number;
  title: string;
  excerpt: string;
  parentSequenceId?: string;
  createdAt: string;
}

@Component({
  selector: 'app-text-lineage-connector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-right shadow-lg" dir="rtl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <mat-icon class="!text-lg !w-5 !h-5 leading-none">account_tree</mat-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-100 font-serif">پەیوەستکردنی بەردەوامی زەنجیرەی دەقەکان (Text Lineage Thread)</h4>
            <p class="text-[10px] text-slate-400">بەستنەوەی دەقی نوێ بە دەقە پێشووەکان بۆ دروستکردنی گفتوگۆیەکی یەکپارچە و زنجیرەیی</p>
          </div>
        </div>

        <span class="text-[9.5px] bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-mono">
          Evolving Manuscript Chain
        </span>
      </div>

      <!-- Parent Text Selector -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-semibold text-slate-300 font-serif">
          ئاماژەپێدان و بەستنەوە بە دەقی پێشووتر (Parent Text Reference):
        </label>
        <select
          [ngModel]="selectedParentId()"
          (ngModelChange)="onParentSelected($event)"
          class="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-2.5 font-serif text-xs focus:outline-none focus:border-purple-500 cursor-pointer">
          <option [value]="''">-- بێ ئاماژەپێدان (دروستکردنی دەقی سەربەخۆ) --</option>
          @for (node of availableNodes(); track node.id) {
            <option [value]="node.id">
              🔗 زنجیرەی #{{ node.sequenceIndex }}: {{ node.title }} ({{ node.excerpt }})
            </option>
          }
        </select>
      </div>

      <!-- Active Lineage Sequence Breadcrumb Visualizer -->
      @if (selectedParentNode(); as parent) {
        <div class="p-3 bg-purple-950/30 border border-purple-800/60 rounded-xl space-y-2 text-xs">
          <div class="flex items-center justify-between text-[10.5px] text-purple-300 font-mono">
            <span class="flex items-center gap-1">
              <mat-icon class="!text-xs text-purple-400">link</mat-icon>
              پەیوەستکراوە بە زنجیرەی #{{ parent.sequenceIndex }}
            </span>
            <span>کاتی دروستبوون: {{ parent.createdAt }}</span>
          </div>

          <blockquote class="p-2 bg-slate-950 border-r-2 border-purple-500 text-[11px] text-slate-300 italic font-serif leading-relaxed">
            "{{ parent.excerpt }}..."
          </blockquote>

          <p class="text-[10px] text-purple-200 font-serif">
            💡 دەقی نوێ لەسەر بونیادی ئەم دەقەی پێشووتر گەشەی پێدەدرێت تا گوتارەکە بەردەوام و نەپچڕاو بێت.
          </p>
        </div>
      }
    </div>
  `
})
export class TextLineageConnectorComponent {
  availableNodes = input<TextLineageNode[]>([
    {
      id: 'seq-1',
      sequenceIndex: 1,
      title: 'بەشی پێشەکی و کێشەی توێژینەوە',
      excerpt: 'دەستنیشانکردنی کێشەی سەرەکی و هۆکارەکانی خستنەڕووی گریمانەی زانستی',
      createdAt: '10:15 AM'
    },
    {
      id: 'seq-2',
      sequenceIndex: 2,
      title: 'پێڕست و شیکاریی تیۆری',
      excerpt: 'بەراوردکاری لە نێوان توێژینەوەکانی ڕابردوو و ئامانجە نوێیەکان',
      parentSequenceId: 'seq-1',
      createdAt: '10:30 AM'
    }
  ]);

  selectedParentId = signal<string>('');
  parentSelected = output<TextLineageNode | null>();

  selectedParentNode = signal<TextLineageNode | null>(null);

  onParentSelected(id: string): void {
    this.selectedParentId.set(id);
    const found = this.availableNodes().find(n => n.id === id) || null;
    this.selectedParentNode.set(found);
    this.parentSelected.emit(found);
  }
}
