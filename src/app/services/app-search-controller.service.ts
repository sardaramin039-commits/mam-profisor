import { Injectable, signal, computed } from '@angular/core';
import { SearchResultItem, SavedManuscriptModel as SavedManuscript } from '../domain/models';

@Injectable({ providedIn: 'root' })
export class AppSearchControllerService {
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');
  recentSearches = signal<string[]>(['مێتۆدۆلۆژی', 'سەرچاوەی هارڤارد', 'ڕێنووسی سۆرانی']);
  feedbackMessage = signal<string | null>(null);

  filterHistoryList(
    list: SavedManuscript[], 
    discipline: string, 
    level: string, 
    status: string
  ): SavedManuscript[] {
    let filtered = list;
    if (discipline !== 'all') {
      filtered = filtered.filter(item => item.discipline === discipline);
    }
    if (level !== 'all') {
      filtered = filtered.filter(item => item.academicLevel === level);
    }
    if (status !== 'all') {
      filtered = filtered.filter(item => {
        const isCompleted = item.chapters && item.chapters.length > 0 && item.chapters.every(c => c.content && c.content.trim().length > 100);
        if (status === 'completed') return isCompleted;
        if (status === 'draft') return !isCompleted;
        return true;
      });
    }
    return filtered;
  }

  showFeedback(msg: string, durationMs = 4000) {
    this.feedbackMessage.set(msg);
    setTimeout(() => this.feedbackMessage.set(null), durationMs);
  }
}
