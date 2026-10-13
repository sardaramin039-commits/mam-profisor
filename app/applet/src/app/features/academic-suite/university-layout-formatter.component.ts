import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppNotificationsService } from '../../core/app.notifications';

export interface UniversityFormatPreset {
  id: string;
  nameKurdish: string;
  city: string;
  innerGutterMarginCm: number;
  outerMarginCm: number;
  topMarginCm: number;
  bottomMarginCm: number;
  preferredFont: string;
  recommendedCoverColor: string;
}

const UNIVERSITIES: UniversityFormatPreset[] = [
  {
    id: 'salahaddin',
    nameKurdish: 'زانکۆی سەلاحەدین - هەولێر (Salahaddin University)',
    city: 'هەولێر',
    innerGutterMarginCm: 3.5,
    outerMarginCm: 2.5,
    topMarginCm: 2.5,
    bottomMarginCm: 2.5,
    preferredFont: 'Unikurd Goran / Arial Unicode',
    recommendedCoverColor: 'شین یان ڕەشی ئەکادیمی'
  },
  {
    id: 'sulaimani',
    nameKurdish: 'زانکۆی سلێمانی (University of Sulaimani)',
    city: 'سلێمانی',
    innerGutterMarginCm: 3.8,
    outerMarginCm: 2.5,
    topMarginCm: 2.5,
    bottomMarginCm: 2.5,
    preferredFont: 'Kurdish Ali / Times New Roman',
    recommendedCoverColor: 'سەوزی تۆخ یان شینی زانکۆیی'
  },
  {
    id: 'duhok',
    nameKurdish: 'زانکۆی دهۆک (University of Duhok)',
    city: 'دهۆک',
    innerGutterMarginCm: 3.5,
    outerMarginCm: 2.5,
    topMarginCm: 3.0,
    bottomMarginCm: 2.5,
    preferredFont: 'Unikurd Web / Calibri',
    recommendedCoverColor: 'بۆر یان شینی تۆخ'
  },
  {
    id: 'soran',
    nameKurdish: 'زانکۆی سۆران (Soran University)',
    city: 'سۆران',
    innerGutterMarginCm: 3.5,
    outerMarginCm: 2.5,
    topMarginCm: 2.5,
    bottomMarginCm: 2.5,
    preferredFont: 'Tahoma / Unikurd',
    recommendedCoverColor: 'ڕەش یان قاوەیی ئەکادیمی'
  },
  {
    id: 'polytechnic',
    nameKurdish: 'زانکۆ پۆلیتەکنیکییەکان (هەولێر، سلێمانی، دهۆک)',
    city: 'کوردستان',
    innerGutterMarginCm: 3.5,
    outerMarginCm: 2.5,
    topMarginCm: 2.5,
    bottomMarginCm: 2.5,
    preferredFont: 'Arial / Kurdish Font',
    recommendedCoverColor: 'شینی دەریایی'
  }
];

@Component({
  selector: 'app-university-layout-formatter',
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6 text-right font-sans" dir="rtl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <mat-icon>menu_book</mat-icon>
            </span>
            <h3 class="text-xl font-bold text-stone-900">داڕێژەری پێوەرەکانی بەرگ و چاپی زانکۆکانی کوردستان</h3>
          </div>
          <p class="text-xs md:text-sm text-stone-600 mt-1">
            ڕێکخستنی مارجنی بەرگگرتن (Gutter Margin) و ئەژمارکردنی ئەستوورایی پشتەوانەی بەرگی ڕەق (Spine Width Calculator).
          </p>
        </div>
      </div>

      <!-- University Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-bold text-stone-700">زانکۆی مەبەست هەڵبژێرە:</label>
        <select
          [ngModel]="selectedUniId()"
          (ngModelChange)="selectedUniId.set($event)"
          class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition">
          @for (u of universities; track u.id) {
            <option [value]="u.id">{{ u.nameKurdish }} ({{ u.city }})</option>
          }
        </select>
      </div>

      <!-- University Specs Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">مارجنی بەستنەوە (ناوخۆ)</span>
          <p class="text-base font-bold text-stone-900 mt-0.5">{{ currentUni().innerGutterMarginCm }} سم (cm)</p>
        </div>
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">مارجنی دەرەوە</span>
          <p class="text-base font-bold text-stone-900 mt-0.5">{{ currentUni().outerMarginCm }} سم (cm)</p>
        </div>
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">فۆنتی پێشنیارکراو</span>
          <p class="text-xs font-bold text-stone-900 mt-1 truncate">{{ currentUni().preferredFont }}</p>
        </div>
        <div class="p-3 bg-stone-50 rounded-xl border border-stone-200">
          <span class="text-[11px] text-stone-500">ڕەنگی بەرگی ڕەق</span>
          <p class="text-xs font-bold text-stone-900 mt-1 truncate">{{ currentUni().recommendedCoverColor }}</p>
        </div>
      </div>

      <!-- Spine Calculator Section -->
      <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
        <div class="flex items-center gap-2">
          <mat-icon class="text-amber-700 text-sm">straighten</mat-icon>
          <h4 class="text-xs font-bold text-amber-950">ژمێرەری ئەستوورایی پشتەوانەی تێز (Book Spine Width Calculator)</h4>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-stone-700 mb-1">ژمارەی لاپەڕەکانی نامە:</label>
            <input
              type="number"
              [ngModel]="pageCount()"
              (ngModelChange)="pageCount.set($event)"
              min="20"
              max="600"
              class="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-stone-700 mb-1">کێشی کاغەز (Paper Weight):</label>
            <select
              [ngModel]="paperGsm()"
              (ngModelChange)="paperGsm.set($event)"
              class="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs">
              <option [value]="80">کاغەزی ئاسایی (80 GSM)</option>
              <option [value]="100">کاغەزی ئەستووری ئەکادیمی (100 GSM)</option>
            </select>
          </div>

          <div class="flex flex-col justify-end">
            <div class="p-2 bg-white border border-amber-300 rounded-lg text-center">
              <span class="text-[10px] text-stone-500">ئەستوورایی پشتەوانە:</span>
              <p class="text-sm font-bold text-amber-900 font-mono">{{ spineThicknessMm() }} ملیمەتر (mm)</p>
            </div>
          </div>
        </div>

        <p class="text-[11px] text-stone-600 leading-relaxed">
          تێبینی: بۆ بەرگی ڕەق (Hardcover)، نزیکەی ٣ بۆ ٤ ملم ئەستوورایی کارتۆنەکە بە ئۆتۆماتیکی بۆ ئەژمارکراوەکە زیاد کراوە تا لە چاپخانە ڕێک بێت.
        </p>
      </div>

      <!-- Action Button -->
      <div class="flex items-center justify-end pt-2 border-t border-stone-100">
        <button
          type="button"
          (click)="applySettings()"
          class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs">
          جێگیرکردنی پێوەرەکانی ئەم زانکۆیە
        </button>
      </div>
    </div>
  `
})
export class UniversityLayoutFormatterComponent {
  private notifications = inject(AppNotificationsService);

  universities = UNIVERSITIES;
  selectedUniId = signal<string>('salahaddin');
  pageCount = signal<number>(140);
  paperGsm = signal<number>(80);

  currentUni = computed(() => {
    return this.universities.find(u => u.id === this.selectedUniId()) || this.universities[0];
  });

  spineThicknessMm = computed(() => {
    const pages = Number(this.pageCount()) || 100;
    const gsm = Number(this.paperGsm()) || 80;
    const sheetFactor = gsm === 100 ? 0.065 : 0.052;
    const boardThickness = 3.5;
    const total = pages * sheetFactor + boardThickness;
    return total.toFixed(1);
  });

  applySettings() {
    const uni = this.currentUni();
    this.notifications.showSuccess(
      'پێوەرەکان جێگیرکران',
      `پێوەرەکانی «${uni.nameKurdish}» بۆ چاپ و بەرگ پەسەند کران.`
    );
  }
}
