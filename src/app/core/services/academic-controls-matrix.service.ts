import { Injectable, signal, computed } from '@angular/core';
import {
  getDomainSpecificDirectives,
  getSupremeDoctoralDirective,
  getUnified211AcademicDirectives
} from '../../../lib/gemini/SupremeAcademicEncyclopedia111';

export interface AcademicMatrixConfig {
  customSourcesEnabled: boolean;
  customSourcesList: string;
  customOutlineEnabled: boolean;
  customOutlineText: string;
  dialecticModeEnabled: boolean;
  writerCriticReviewerEnabled: boolean;
  activeAgentStage: 'idle' | 'writer' | 'critic' | 'reviewer';
  styleMimicryEnabled: boolean;
  styleReferenceSample: string;
  comparativeModeEnabled: boolean;
  comparativeSourceOne: string;
  comparativeSourceTwo: string;
  comparativeAxis: string;
}

const STORAGE_KEY = 'mam_academic_controls_matrix_v1';

@Injectable({ providedIn: 'root' })
export class AcademicControlsMatrixService {
  readonly state = signal<AcademicMatrixConfig>(this.loadInitialState());

  readonly activeBadgesCount = computed(() => {
    const s = this.state();
    return [
      s.customSourcesEnabled,
      s.customOutlineEnabled,
      s.dialecticModeEnabled,
      s.writerCriticReviewerEnabled,
      s.styleMimicryEnabled,
      s.comparativeModeEnabled
    ].filter(Boolean).length;
  });

  constructor() {
    this.syncToWindow(this.state());
  }

  update<K extends keyof AcademicMatrixConfig>(key: K, value: AcademicMatrixConfig[K]): void {
    const next = { ...this.state(), [key]: value };
    this.state.set(next);
    this.syncToWindow(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  }

  toggle(
    key:
      | 'customSourcesEnabled'
      | 'customOutlineEnabled'
      | 'dialecticModeEnabled'
      | 'writerCriticReviewerEnabled'
      | 'styleMimicryEnabled'
      | 'comparativeModeEnabled'
  ): void {
    this.update(key, !this.state()[key]);
  }

  buildPromptDirectives(topic: string = '', discipline: string = ''): string {
    const s = this.state();
    const blocks: string[] = [];

    if (s.customSourcesEnabled && s.customSourcesList.trim()) {
      blocks.push(
        `[١. قوفڵی سەرچاوەی تایبەت (STRICT CUSTOM SOURCES ONLY)]:\n` +
        `تەنها ئەم سەرچاوانەی خوارەوە بەکاربهێنە و هیچ سەرچاوەیەکی تر لە خۆتەوە زیاد مەکە:\n${s.customSourcesList.trim()}`
      );
    }

    if (s.customOutlineEnabled && s.customOutlineText.trim()) {
      blocks.push(
        `[٢. قوفڵی پێڕستی تایبەت (STRICT USER-DEFINED OUTLINE)]:\n` +
        `پێڕست لە خۆتەوە دروست مەکە؛ دەقاودەق پابەندی ئەم پێڕستەی توێژەر بە:\n${s.customOutlineText.trim()}`
      );
    }

    if (s.dialecticModeEnabled) {
      blocks.push(
        `[٣. میتۆدی دیالێکتیک (تێز ➔ دژەتێز ➔ سێنتێز)]:\n` +
        `هەموو تەوەرێک بە سێ قۆناغی دیالێکتیکی (تێز، دژەتێز، سێنتێز) دابڕێژە.`
      );
    }

    if (s.writerCriticReviewerEnabled) {
      blocks.push(
        `[٤. بازنەی سێ-ئەجێنتی (نووسەر ➔ ڕەخنەگر ➔ پێداچوونەوە)]:\n` +
        `هەموو بەشێک بە فلتەری نووسەری ئەکادیمی، ڕەخنەگری میتۆدی، و پێداچوونەوەی زمانەوانیدا تێپەڕێنە.`
      );
    }

    if (s.styleMimicryEnabled && s.styleReferenceSample.trim()) {
      blocks.push(
        `[٥. هاوشێوەسازیی ستایل (STYLE MIMICRY)]:\n` +
        `تەواوی توێژینەوەکە بە هەمان شێواز، ڕستەسازی و قەڵەمی زانستیی ئەم دەقە نموونەییە دابڕێژە:\n${s.styleReferenceSample.trim()}`
      );
    }

    if (
      s.comparativeModeEnabled &&
      (s.comparativeSourceOne.trim() || s.comparativeSourceTwo.trim() || s.comparativeAxis.trim())
    ) {
      blocks.push(
        `[٦. توێژینەوەی بەراوردکاری (COMPARATIVE STUDY MATRIX)]:\n` +
        `- کتێب / دەقی یەکەم: ${s.comparativeSourceOne.trim() || 'دیاری نەکراوە'}\n` +
        `- کتێب / دەقی دووەم: ${s.comparativeSourceTwo.trim() || 'دیاری نەکراوە'}\n` +
        `- ڕووی بەراوردکاری: ${s.comparativeAxis.trim() || 'بەراوردی گشتگیر'}`
      );
    }

    if (topic) {
      blocks.push(getDomainSpecificDirectives(topic, discipline));
    }

    return blocks.length > 0 ? '\n\n' + blocks.join('\n\n') : '';
  }

  private syncToWindow(cfg: AcademicMatrixConfig): void {
    if (typeof window !== 'undefined') {
      (window as any).__MAM_ACADEMIC_MATRIX__ = {
        config: cfg,
        getDirectives: (topic?: string, disc?: string) => this.buildPromptDirectives(topic, disc),
        getDomainSpecificDirectives,
        getSupremeDoctoralDirective,
        getUnified211AcademicDirectives
      };
    }
  }

  private loadInitialState(): AcademicMatrixConfig {
    const fallback: AcademicMatrixConfig = {
      customSourcesEnabled: false,
      customSourcesList: '',
      customOutlineEnabled: false,
      customOutlineText: '',
      dialecticModeEnabled: false,
      writerCriticReviewerEnabled: true,
      activeAgentStage: 'idle',
      styleMimicryEnabled: false,
      styleReferenceSample: '',
      comparativeModeEnabled: false,
      comparativeSourceOne: '',
      comparativeSourceTwo: '',
      comparativeAxis: ''
    };
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...fallback, ...JSON.parse(raw) };
      }
    } catch {}
    return fallback;
  }
}
