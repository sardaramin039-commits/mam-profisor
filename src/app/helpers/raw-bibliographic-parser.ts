export interface ParsedBibliographicReference {
  id: string;
  rawInput: string;
  authors: string[];
  year: string;
  title: string;
  source: string; // Journal / Publisher
  volume?: string;
  issue?: string;
  pages?: string;
  city?: string;
  doi?: string;
  sourceType: 'book' | 'journal' | 'conference' | 'web';
  language: 'kurdish' | 'english' | 'other';
}

export interface FormattedReferenceResult {
  parsed: ParsedBibliographicReference;
  apa7: string;
  harvard: string;
  chicago: string;
  mla9: string;
  inTextApa: string;
  inTextHarvard: string;
  inTextKurdish: string;
}

/**
 * Intelligent parser that extracts bibliographic components from raw, unstructured user input text.
 */
export function parseRawBibliographicText(rawText: string): ParsedBibliographicReference {
  const cleaned = (rawText || '').trim().replace(/\r\n/g, ' ').replace(/\n/g, ' ');
  const id = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Detect language
  const isKurdish = /[\u0600-\u06FF]/.test(cleaned);

  // Extract DOI if present
  const doiMatch = cleaned.match(/(?:doi(?::|\.org\/)?\s*|(?:10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+))/i);
  const doi = doiMatch ? doiMatch[0].replace(/^doi:\s*/i, '') : undefined;

  // Extract Year (4 digits or Kurdish/Arabic numbers ٤ ژمارە)
  let year = '';
  const yearMatch = cleaned.match(/\b(19\d{2}|20\d{2}|١٩\d{2}|٢٠\d{2})\b/);
  if (yearMatch) {
    year = yearMatch[1];
  } else {
    year = 'n.d.';
  }

  // Extract Pages (pp. 12-34 or ل ٤٥-٥٠ or pages 10-20)
  let pages: string | undefined = undefined;
  const pageMatch = cleaned.match(/(?:pp?\.?|pages?|ل\.?|لاپەڕە|ص\.?)\s*([\d\-–—٠-٩]+)/i);
  if (pageMatch) {
    pages = pageMatch[1];
  }

  // Extract Volume & Issue (Vol. 4, Issue 2 or 4(2))
  let volume: string | undefined = undefined;
  let issue: string | undefined = undefined;
  const volMatch = cleaned.match(/(?:vol(?:ume|\.)?\s*|بەرگی\s*)([\d٠-٩]+)/i);
  if (volMatch) volume = volMatch[1];
  const issueMatch = cleaned.match(/(?:issue|no\.?|ژمارە|ژ\.)\s*([\d٠-٩]+)/i);
  if (issueMatch) issue = issueMatch[1];

  // Try extracting authors and title based on punctuation delimiters
  // Usually: Author (Year) Title, Source. OR Author, Year, Title, Source.
  let authors: string[] = [];
  let title = '';
  let source = '';

  const withoutYear = cleaned.replace(/\([1920١٩٢٠\d\s]{4,6}\)/, '—YEAR—').replace(/\b(19\d{2}|20\d{2}|١٩\d{2}|٢٠\d{2})\b/, '—YEAR—');
  const parts = withoutYear.split('—YEAR—');

  if (parts.length >= 2) {
    const authorPart = parts[0].trim().replace(/[,.:;]+$/, '');
    authors = authorPart ? [authorPart] : ['نووسەری نادیار'];

    const restPart = parts.slice(1).join(' ').trim().replace(/^[,.:;\s]+/, '');
    const subParts = restPart.split(/[,.;،]/).map(s => s.trim()).filter(Boolean);

    if (subParts.length >= 2) {
      title = subParts[0];
      source = subParts.slice(1).join(', ').replace(/(?:pp?\.?|ل\.?)\s*[\d\-–—٠-٩]+/i, '').trim();
    } else {
      title = restPart || 'ناونیشانی لێکۆڵینەوە';
      source = isKurdish ? 'زانکۆ / چاپخانە' : 'Publisher / University Press';
    }
  } else {
    // Delimited by commas or periods
    const tokens = cleaned.split(/[,.;،]/).map(t => t.trim()).filter(Boolean);
    if (tokens.length >= 3) {
      authors = [tokens[0]];
      title = tokens[1];
      source = tokens.slice(2).join(', ');
    } else if (tokens.length === 2) {
      authors = [tokens[0]];
      title = tokens[1];
      source = isKurdish ? 'چاپخانەی ناوخۆیی' : 'Academic Publisher';
    } else {
      authors = [isKurdish ? 'نووسەر' : 'Author'];
      title = cleaned;
      source = isKurdish ? 'سەرچاوەی ئەکادیمی' : 'Academic Source';
    }
  }

  // Determine Source Type
  let sourceType: 'book' | 'journal' | 'conference' | 'web' = 'book';
  if (volume || issue || /journal|گۆڤار|periodical|review/i.test(source)) {
    sourceType = 'journal';
  } else if (/conference|symposium|کۆنفرانس|کۆنگرە/i.test(source)) {
    sourceType = 'conference';
  } else if (/http|www|\.org|\.edu/i.test(cleaned)) {
    sourceType = 'web';
  }

  return {
    id,
    rawInput: cleaned,
    authors,
    year,
    title: cleanTitle(title),
    source: cleanSource(source),
    volume,
    issue,
    pages,
    doi,
    sourceType,
    language: isKurdish ? 'kurdish' : 'english'
  };
}

/**
 * Formats a parsed reference into Harvard, APA 7th, Chicago, and MLA 9th standards.
 */
export function formatBibliographicStandards(parsed: ParsedBibliographicReference): FormattedReferenceResult {
  const primaryAuthor = parsed.authors[0] || 'Unknown';
  const year = parsed.year || 'n.d.';
  const title = parsed.title;
  const source = parsed.source;
  const volPart = parsed.volume ? (parsed.issue ? `${parsed.volume}(${parsed.issue})` : parsed.volume) : '';
  const pagePart = parsed.pages ? `, pp. ${parsed.pages}` : '';
  const kurdishPagePart = parsed.pages ? `، ل. ${parsed.pages}` : '';
  const doiUrl = parsed.doi ? (parsed.doi.startsWith('http') ? parsed.doi : `https://doi.org/${parsed.doi}`) : '';

  // 1. APA 7th Edition:
  // Author, A. (Year). Title of work. Source, volume(issue), pages. https://doi.org/...
  let apa7 = '';
  if (parsed.sourceType === 'journal') {
    apa7 = `${primaryAuthor} (${year}). ${title}. *${source}*${volPart ? `, ${volPart}` : ''}${parsed.pages ? `, ${parsed.pages}` : ''}.${doiUrl ? ` ${doiUrl}` : ''}`;
  } else {
    apa7 = `${primaryAuthor} (${year}). *${title}*. ${source}.${doiUrl ? ` ${doiUrl}` : ''}`;
  }

  // 2. Harvard Standard:
  // Author, Initial., Year. Title of work. City: Publisher, pp. pages.
  let harvard = '';
  if (parsed.sourceType === 'journal') {
    harvard = `${primaryAuthor}, ${year}. ${title}. *${source}*, ${volPart || ''}${pagePart}.${doiUrl ? ` Available at: <${doiUrl}>.` : ''}`;
  } else {
    harvard = `${primaryAuthor}, ${year}. *${title}*. ${source}${pagePart}.`;
  }

  // 3. Chicago (Notes & Bibliography / Author-Date):
  const chicago = `${primaryAuthor}. ${year}. *${title}*. ${source}${volPart ? ` ${volPart}` : ''}${pagePart}.${doiUrl ? ` ${doiUrl}` : ''}`;

  // 4. MLA 9th:
  const mla9 = `${primaryAuthor}. *${title}*. ${source}, ${year}${parsed.pages ? `, pp. ${parsed.pages}` : ''}.`;

  // In-Text Citations
  const authorLastName = extractLastName(primaryAuthor);
  const inTextApa = `(${authorLastName}, ${year}${parsed.pages ? `, p. ${parsed.pages}` : ''})`;
  const inTextHarvard = `(${authorLastName} ${year}${parsed.pages ? `: ${parsed.pages}` : ''})`;
  const inTextKurdish = `(${authorLastName}، ${year}${kurdishPagePart})`;

  return {
    parsed,
    apa7: apa7.trim(),
    harvard: harvard.trim(),
    chicago: chicago.trim(),
    mla9: mla9.trim(),
    inTextApa,
    inTextHarvard,
    inTextKurdish
  };
}

function cleanTitle(t: string): string {
  return t.replace(/^["'«]+|["'»]+$/g, '').trim() || 'ناونیشانی لێکۆڵینەوە';
}

function cleanSource(s: string): string {
  return s.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim() || 'دەزگای چاپ و بڵاوکردنەوە';
}

function extractLastName(author: string): string {
  const parts = author.trim().replace(/^د\.\s*|پ\.\s*|Dr\.\s*|Prof\.\s*/i, '').split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || author;
}
