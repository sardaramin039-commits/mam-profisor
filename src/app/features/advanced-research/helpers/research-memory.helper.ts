import { ResearchMemoryState } from '../models/multi-agent.types';

export function getDefaultResearchMemory(): ResearchMemoryState {
  return {
    projectTitle: 'تێزی توێژینەوەی ئەکادیمی',
    discipline: 'زانستە ئەکادیمییەکان',
    hypotheses: ['ژیری دەستکرد کوالێتی و ڕەسەنایەتیی توێژینەوە لە کوردستان بەرز دەکاتەوە.'],
    keyTerms: ['ژیرى دەستكرد', 'مێتۆدۆلۆژی', 'شیکاری ڕەخنەیی'],
    notes: [],
    lastUpdated: new Date().toISOString()
  };
}

export function loadResearchMemoryFromStorage(): ResearchMemoryState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getDefaultResearchMemory();
  }
  try {
    const saved = localStorage.getItem('academic_research_memory');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Could not load research memory:', e);
  }
  return getDefaultResearchMemory();
}

export function saveResearchMemoryToStorage(memory: ResearchMemoryState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem('academic_research_memory', JSON.stringify(memory));
  } catch (e) {
    console.warn('Could not save research memory:', e);
  }
}
