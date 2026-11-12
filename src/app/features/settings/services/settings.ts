import { Injectable, signal } from '@angular/core';

export interface ManuscriptSettings {
  title: string;
  discipline: string;
  academicLevel: string;
  targetPages: number;
  citationStyle: string;
  selectedLanguage: 'ckb' | 'en' | 'ar';
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly settings = signal<ManuscriptSettings>({
    title: 'تێزی دکتۆرا - ڕوانگەی ڕەخنەیی لە ئەدەبی هاوچەرخی کوردیدا',
    discipline: 'ئەدەب و زمانەوانیی کوردی',
    academicLevel: 'دکتۆرا (PhD)',
    targetPages: 180,
    citationStyle: 'APA',
    selectedLanguage: 'ckb'
  });

  updateSettings(partial: Partial<ManuscriptSettings>) {
    this.settings.update(s => ({ ...s, ...partial }));
  }
}
