import { Injectable } from '@angular/core';
import { ChapterItemModel, GlossaryEntry, SavedManuscriptModel, SearchResultItem } from '../domain/models';

export type DateRangeFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'older';
export type ProgressFilter = 'all' | 'completed' | 'in_progress' | 'not_started';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  executeSearch(
    query: string,
    chapters: ChapterItemModel[],
    history: SavedManuscriptModel[],
    glossary: GlossaryEntry[],
    dateRangeFilter: DateRangeFilter = 'all',
    progressFilter: ProgressFilter = 'all'
  ): SearchResultItem[] {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Search in chapters
    chapters.forEach(ch => {
      const matchText = !q || ch.title.toLowerCase().includes(q) || (ch.content && ch.content.toLowerCase().includes(q));
      
      // Calculate progress
      const target = ch.customTargetWords || 2500;
      const progressPercent = Math.min(100, Math.round(((ch.wordCount || 0) / target) * 100));
      let passesProgress = true;
      if (progressFilter === 'completed') passesProgress = progressPercent >= 100 || ch.status === 'completed';
      else if (progressFilter === 'in_progress') passesProgress = progressPercent > 0 && progressPercent < 100 && ch.status !== 'completed';
      else if (progressFilter === 'not_started') passesProgress = progressPercent === 0;

      if (matchText && passesProgress) {
        results.push({
          id: `chapter-${ch.id}`,
          type: 'chapter',
          typeLabel: 'بەشی تێز',
          title: ch.title,
          subtitle: `ئاستی بەڕێوەچوون: ${progressPercent}% (${ch.wordCount || 0} وشە)`,
          snippet: (ch.content || '').substring(0, 140) + '...',
          relevance: 0.95,
          originalItem: ch,
          wordCount: ch.wordCount,
          savedDateStr: 'نوێکراوەتەوە'
        });
      }
    });

    // Search in saved manuscripts history
    const nowSec = Math.floor(Date.now() / 1000);
    history.forEach(m => {
      const matchText = !q || m.title.toLowerCase().includes(q) || m.discipline.toLowerCase().includes(q);
      
      // Calculate date range
      const createdSec = m.createdAt?.seconds || (nowSec - 86400 * 3);
      const diffSec = nowSec - createdSec;
      let passesDate = true;
      if (dateRangeFilter === 'today') passesDate = diffSec <= 86400;
      else if (dateRangeFilter === 'this_week') passesDate = diffSec <= 86400 * 7;
      else if (dateRangeFilter === 'this_month') passesDate = diffSec <= 86400 * 30;
      else if (dateRangeFilter === 'older') passesDate = diffSec > 86400 * 30;

      // Calculate total progress across chapters in manuscript
      const totalCh = m.chapters?.length || 1;
      const completedCh = m.chapters?.filter(c => c.wordCount && c.wordCount >= 1000).length || 0;
      const progressPercent = Math.round((completedCh / totalCh) * 100);

      let passesProgress = true;
      if (progressFilter === 'completed') passesProgress = progressPercent >= 100;
      else if (progressFilter === 'in_progress') passesProgress = progressPercent > 0 && progressPercent < 100;
      else if (progressFilter === 'not_started') passesProgress = progressPercent === 0;

      if (matchText && passesDate && passesProgress) {
        const dateObj = new Date(createdSec * 1000);
        const formattedDate = dateObj.toLocaleDateString('fa-IR');

        results.push({
          id: `history-${m.id}`,
          type: 'history',
          typeLabel: 'مێژووی توێژینەوە',
          title: m.title,
          subtitle: `${m.discipline} (${m.academicLevel}) • تەواوبوون: ${progressPercent}%`,
          snippet: `قەبارە: ${m.pages} لاپەڕە • بەشەکان: ${totalCh} • ڕێککەوت: ${formattedDate}`,
          relevance: 0.88,
          originalItem: m,
          savedDateStr: formattedDate
        });
      }
    });

    // Search in glossary (if no strict date/progress filter or filter is 'all')
    if (dateRangeFilter === 'all' && progressFilter === 'all' && q) {
      glossary.forEach(g => {
        if (g.foreign.toLowerCase().includes(q) || g.translation.toLowerCase().includes(q)) {
          results.push({
            id: `glossary-${g.foreign}`,
            type: 'glossary',
            typeLabel: 'زاراوەی زانستی',
            title: `${g.translation} (${g.foreign})`,
            subtitle: g.category,
            snippet: g.definition,
            relevance: 0.8,
            originalItem: g
          });
        }
      });
    }

    return results;
  }
}
