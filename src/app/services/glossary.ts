import { Injectable } from '@angular/core';
import { GlossaryEntry } from '../domain/models';

@Injectable({
  providedIn: 'root'
})
export class GlossaryService {
  filterGlossary(entries: GlossaryEntry[], query: string): GlossaryEntry[] {
    if (!query || !query.trim()) return entries;
    const q = query.trim().toLowerCase();
    return entries.filter(e =>
      e.foreign.toLowerCase().includes(q) ||
      e.translation.toLowerCase().includes(q) ||
      e.definition.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  getEntriesByCategory(entries: GlossaryEntry[], category: string): GlossaryEntry[] {
    if (!category || category === 'هەمووی') return entries;
    return entries.filter(e => e.category === category);
  }
}
