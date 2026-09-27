import { Injectable, inject } from '@angular/core';
import { AcademicSourceModel, CitationFormatResult } from '../../../domain/models';
import { AcademicStyle } from '../../../domain/enums';
import { CitationBuilder, CitationItem } from '../../../helpers/citation-builder';
import { AcademicStoreService } from '../../../services/academic-store.service';

@Injectable({
  providedIn: 'root'
})
export class CitationManagerService {
  private academicStore = inject(AcademicStoreService);

  /**
   * Adds an academic source to the project store.
   */
  addSource(source: Partial<AcademicSourceModel>): AcademicSourceModel {
    const newSource: AcademicSourceModel = {
      id: source.id || `source_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: source.userId || 'local_user',
      title: source.title || 'سەرچاوەی بێ ناو',
      author: source.author || 'نووسەری دیارینەکراو',
      year: typeof source.year === 'number' ? source.year : 2024,
      publisher: source.publisher || '',
      sourceType: (source.sourceType as any) || 'book',
      doi: source.doi,
      url: source.url,
      journal: source.journal,
      isVerified: source.isVerified ?? false,
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };

    this.academicStore.sources.update(prev => [...prev, newSource]);
    return newSource;
  }
  /**
   * Formats input source data dynamically across APA 7th, MLA 9th, Harvard, and other standards.
   */
  formatSource(source: AcademicSourceModel | Record<string, any>, style: AcademicStyle | string = AcademicStyle.APA): CitationFormatResult {
    const srcAny = (source || {}) as Record<string, any>;
    
    // Extract dynamic fields from raw or typed input source
    const citationItem: CitationItem = {
      id: srcAny['id'],
      authors: srcAny['author'] || srcAny['authors'] || 'نووسەری دیارینەکراو',
      year: srcAny['year'] || srcAny['publicationYear'] || new Date().getFullYear(),
      title: srcAny['title'] || srcAny['bookTitle'] || srcAny['articleTitle'] || 'سەرناوی بێ ناو',
      publisher: srcAny['publisher'],
      journal: srcAny['journal'] || srcAny['journalName'] || srcAny['periodical'],
      volume: srcAny['volume'] ? String(srcAny['volume']) : undefined,
      issue: srcAny['issue'] || srcAny['number'] ? String(srcAny['issue'] || srcAny['number']) : undefined,
      pages: srcAny['pages'] ? String(srcAny['pages']) : undefined,
      url: srcAny['url'] || srcAny['link'],
      doi: srcAny['doi'],
      edition: srcAny['edition'],
      place: srcAny['place'] || srcAny['city'],
      institution: srcAny['institution'] || srcAny['university'],
      accessedDate: srcAny['accessedDate'] || srcAny['retrievalDate'],
      type: srcAny['type'] || srcAny['sourceType'] || (srcAny['journal'] ? 'journal' : 'book')
    };

    let formattedText = '';
    const author = citationItem.authors;
    const year = citationItem.year;
    const firstAuthor = author.split(/[,;&]|\band\b/i)[0].trim() || 'Author';
    let inTextCitation = `(${author}, ${year})`;

    const normalizedStyle = String(style).toUpperCase();

    if (normalizedStyle.includes('HARVARD')) {
      formattedText = CitationBuilder.formatHarvard(citationItem);
      inTextCitation = `(${firstAuthor}, ${year})`;
    } else if (normalizedStyle.includes('MLA')) {
      formattedText = CitationBuilder.formatMLA(citationItem);
      const pageStr = citationItem.pages ? ` ${citationItem.pages.split('-')[0].trim()}` : '';
      inTextCitation = `(${firstAuthor}${pageStr})`;
    } else if (normalizedStyle.includes('CHICAGO')) {
      formattedText = `${author}. ${year}. "${citationItem.title}." ${citationItem.publisher ? `${citationItem.publisher}.` : ''}`;
      inTextCitation = `(${firstAuthor} ${year})`;
    } else if (normalizedStyle.includes('IEEE')) {
      formattedText = `[1] ${author}, "${citationItem.title}," ${citationItem.publisher ? `${citationItem.publisher}, ` : ''}${year}.`;
      inTextCitation = `[1]`;
    } else if (normalizedStyle.includes('KURDISH')) {
      formattedText = CitationBuilder.formatKurdishAcademic(citationItem);
      inTextCitation = `(${author}، ${year})`;
    } else {
      // Default to APA 7th
      formattedText = CitationBuilder.formatAPA(citationItem);
      inTextCitation = `(${firstAuthor}, ${year})`;
    }

    return {
      formattedText,
      style,
      inTextCitation
    };
  }

  /**
   * Bulk formats an array of sources according to the requested citation style.
   */
  formatAllSources(sources: AcademicSourceModel[], style: AcademicStyle | string = AcademicStyle.APA): CitationFormatResult[] {
    return (sources || []).map(src => this.formatSource(src, style));
  }
}

