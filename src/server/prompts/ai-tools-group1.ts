export function buildGroup1Prompt(toolId: string, text: string, styleOption: string, targetLang: string, toneOption: string): string | null {
  switch (toolId) {
    case 'openalex_api':
      return `[TOOL 1: OPENALEX API INTEGRATION]\nSearch & Analysis Query: "${text}"\nInstructions:\n1. Perform an academic query synthesis based on OpenAlex scientific index.\n2. Structure output into: Key Publications, Indexed Field Topics, Citation Impact Overview, and Recommended Citations.`;

    case 'crossref_api':
      return `[TOOL 2: CROSSREF API INTEGRATION]\nDOI or Citation Metadata Query: "${text}"\nInstructions:\n1. Retrieve and format metadata from Crossref registry.\n2. Provide full standard citation (${styleOption}), DOI confirmation, publisher details, and publication history.`;

    case 'google_books_api':
      return `[TOOL 3: GOOGLE BOOKS API INTEGRATION]\nBook Query / ISBN: "${text}"\nInstructions:\n1. Search academic book databases.\n2. Format output with Book Title, Authors, Publisher, Year, Page Range, ISBN, and Key Thematic Summary.`;

    case 'research_agent':
      return `[TOOL 4: RESEARCH AGENT]\nResearch Goal / Question: "${text}"\nInstructions:\n1. Execute multi-step research synthesis as an autonomous academic agent.\n2. Provide background, current consensus, key arguments, literature gaps, and conclusion.`;

    case 'fact_checker':
      return `[TOOL 5: FACT CHECKER]\nClaim to Verify: "${text}"\nInstructions:\n1. Audit facts, numbers, dates, and claims against academic consensus.\n2. Output: Truth Rating (سەلمێنراو / بێ بەڵگە / هەڵە), Academic Context, Evidence Breakdown, and Verification Sources.`;

    case 'source_confidence_score':
      return `[TOOL 6: SOURCE CONFIDENCE SCORE]\nSource Details: "${text}"\nInstructions:\n1. Evaluate reliability and authority of the source.\n2. Return Confidence Score (0-100), Peer-Review Status, Impact Factor context, and Usage Recommendation.`;

    case 'citation_engine':
      return `[TOOL 7: CITATION ENGINE]\nStyle requested: ${styleOption}\nInput details: "${text}"\nInstructions:\n1. Generate accurate citation in ${styleOption} style.\n2. Provide both Inline Citation format and full Reference List entry.`;

    case 'semantic_scholar_api':
      return `[TOOL 8: SEMANTIC SCHOLAR INTEGRATION]\nTopic / Paper Query: "${text}"\nInstructions:\n1. Synthesize Semantic Scholar paper metrics, influential citation counts, and related research vectors.`;

    case 'pubmed_api':
      return `[TOOL 9: PUBMED API INTEGRATION]\nMedical / Biomedical Query: "${text}"\nInstructions:\n1. Extract and summarize PubMed index entries, MeSH headings, clinical trial data, or medical literature.`;

    case 'open_library_api':
      return `[TOOL 10: OPEN LIBRARY API INTEGRATION]\nQuery: "${text}"\nInstructions:\n1. Fetch and synthesize open access library book records, edition history, and author metadata.`;

    case 'internet_archive_api':
      return `[TOOL 11: INTERNET ARCHIVE API INTEGRATION]\nArchive Query: "${text}"\nInstructions:\n1. Locate historical archive items, manuscript references, and digital preservation records.`;

    case 'doaj_api':
      return `[TOOL 12: DOAJ API INTEGRATION]\nOpen Access Query: "${text}"\nInstructions:\n1. Search Directory of Open Access Journals (DOAJ) and extract peer-reviewed OA articles.`;

    case 'worldcat_api':
      return `[TOOL 13: WORLDCAT API INTEGRATION]\nLibrary Catalog Query: "${text}"\nInstructions:\n1. Search global library catalogs via WorldCat and provide holding library information.`;

    case 'europeana_api':
      return `[TOOL 14: EUROPEANA INTEGRATION]\nHeritage / Archive Query: "${text}"\nInstructions:\n1. Retrieve European digital cultural heritage, historic manuscripts, and museum archive metadata.`;

    case 'loc_api':
      return `[TOOL 15: LIBRARY OF CONGRESS API INTEGRATION]\nHistorical / Archival Query: "${text}"\nInstructions:\n1. Search US Library of Congress digital collections, primary source records, and historical manuscripts.`;

    case 'oai_pmh_integration':
      return `[TOOL 16: OAI-PMH HARVESTING]\nRepository Endpoint / Metadata Query: "${text}"\nInstructions:\n1. Parse OAI-PMH metadata records, Dublin Core attributes, and institutional repository assets.`;

    case 'ocr_pdf_images':
      return `[TOOL 17: OCR PDF & IMAGES]\nScanned Document Content: "${text}"\nInstructions:\n1. Clean OCR artifacts, restore missing punctuation, format headers, and output clean Kurd/Eng academic text.`;

    case 'export_latex':
      return `[TOOL 18: EXPORT TO LATEX]\nText to convert: "${text}"\nInstructions:\n1. Convert input text into clean, compiling LaTeX code block (\\\\begin{document}...\\\\end{document}) with proper sectioning, math syntax, and citation commands.`;

    case 'export_epub':
      return `[TOOL 19: EXPORT TO EPUB]\nText to format: "${text}"\nInstructions:\n1. Format text into EPUB-compatible XHTML structure with metadata tags, chapter division, and CSS styling.`;

    case 'export_markdown':
      return `[TOOL 20: EXPORT TO MARKDOWN]\nText to format: "${text}"\nInstructions:\n1. Convert raw text into clean, standardized Markdown (# H1, ## H2, tables, blockquotes, lists).`;

    case 'ai_peer_review':
      return `[TOOL 21: AI PEER REVIEW]\nDraft text: "${text}"\nInstructions:\n1. Perform rigorous double-blind peer review using Nature / Elsevier criteria.\n2. Sections: Originality, Methodological Rigor, Literature Depth, Clarity & Structure, Final Recommendation (Accept / Major Revision / Reject).`;

    case 'ai_plagiarism_analysis':
      return `[TOOL 22: AI PLAGIARISM ANALYSIS]\nDraft text: "${text}"\nInstructions:\n1. Analyze text for potential similarity, unreferenced phrasing, and self-plagiarism risks.\n2. Provide Similarity Index Estimate (%), Suspicious Phrases, and Rephrasing Suggestions.`;

    case 'citation_validator':
      return `[TOOL 23: CITATION VALIDATOR]\nText and Reference List: "${text}"\nInstructions:\n1. Audit inline citations against reference list.\n2. Flag missing references, orphaned references, and formatting mismatches.`;

    case 'zotero_integration':
      return `[TOOL 24: ZOTERO INTEGRATION]\nReferences / Text: "${text}"\nInstructions:\n1. Format references into clean Zotero-compatible BibTeX / RIS format.`;

    case 'mendeley_integration':
      return `[TOOL 25: MENDELEY INTEGRATION]\nReferences / Text: "${text}"\nInstructions:\n1. Format references into Mendeley-compatible JSON / BibTeX structure.`;

    case 'orcid_integration':
      return `[TOOL 26: ORCID INTEGRATION]\nAuthor iD / Name: "${text}"\nInstructions:\n1. Retrieve and analyze author academic profile, publication record, and h-index context via ORCID.`;

    case 'google_scholar_metadata':
      return `[TOOL 27: GOOGLE SCHOLAR METADATA SEARCH]\nQuery / Article Title: "${text}"\nInstructions:\n1. Extract citation counts, bibtex metadata, and related academic articles from Google Scholar.`;

    case 'doi_resolver':
      return `[TOOL 28: DOI RESOLVER]\nDOI String: "${text}"\nInstructions:\n1. Resolve DOI and format the authoritative returned metadata in APA, Harvard, and Chicago; never invent missing fields.`;

    case 'isbn_lookup':
      return `[TOOL 29: ISBN LOOKUP]\nISBN Number: "${text}"\nInstructions:\n1. Look up book metadata by ISBN and output full cataloging record.`;

    case 'issn_lookup':
      return `[TOOL 30: ISSN LOOKUP]\nISSN Number: "${text}"\nInstructions:\n1. Retrieve journal title, indexing databases (Scopus / WoS), publisher, and country of origin by ISSN.`;

    case 'research_timeline':
      return `[TOOL 31: RESEARCH TIMELINE GENERATOR]\nProject Context: "${text}"\nInstructions:\n1. Generate a structured Gantt timeline chart with milestones, tasks, and deadlines for thesis completion.`;

    case 'mind_map_generator':
      return `[TOOL 32: MIND MAP GENERATOR]\nCentral Concept: "${text}"\nInstructions:\n1. Build a text/Mermaid mind map breaking down central concept into primary branches and sub-nodes.`;

    case 'auto_outline_generator':
      return `[TOOL 33: AUTO OUTLINE GENERATOR]\nThesis Topic: "${text}"\nInstructions:\n1. Generate complete chapter outline from Introduction to Conclusion with sub-sections.`;

    case 'chapter_planner':
      return `[TOOL 34: CHAPTER PLANNER]\nChapter Title / Scope: "${text}"\nInstructions:\n1. Create detailed plan for this specific chapter: word count distribution, sub-headings, key arguments, and target citations.`;

    case 'table_generator':
      return `[TOOL 35: TABLE GENERATOR]\nData or Text: "${text}"\nInstructions:\n1. Transform input into clean APA-style markdown table with headers, summary metrics, and descriptive caption.`;

    case 'figure_generator':
      return `[TOOL 36: FIGURE GENERATOR]\nConcept / Process: "${text}"\nInstructions:\n1. Create a Mermaid / SVG diagram code representing the workflow or concept, accompanied by academic figure caption.`;

    case 'reference_recommendation':
      return `[TOOL 37: REFERENCE RECOMMENDATION]\nDraft Paragraph: "${text}"\nInstructions:\n1. Recommend 5 seminal and recent peer-reviewed articles to cite for this paragraph with inline placement guidance.`;

    case 'duplicate_reference_remover':
      return `[TOOL 38: DUPLICATE REFERENCE REMOVER]\nReference List: "${text}"\nInstructions:\n1. Identify and merge duplicate references, producing a clean deduplicated reference list.`;

    case 'journal_finder':
      return `[TOOL 39: JOURNAL FINDER]\nAbstract / Research Focus: "${text}"\nInstructions:\n1. Recommend top 5 indexed journals (Scopus / Web of Science) suitable for submitting this research.`;

    case 'journal_ranking':
      return `[TOOL 40: JOURNAL RANKING Q1-Q4]\nJournal Name / ISSN: "${text}"\nInstructions:\n1. Provide journal rank quartile (Q1, Q2, Q3, Q4), Scopus SJR score, Web of Science indexing status, and field percentile.`;

    case 'impact_factor_lookup':
      return `[TOOL 41: IMPACT FACTOR LOOKUP]\nJournal Name: "${text}"\nInstructions:\n1. Report official Journal Impact Factor (JIF), 5-year Impact Factor, and Journal Citation Indicator (JCI).`;

    case 'h_index_lookup':
      return `[TOOL 42: H-INDEX LOOKUP]\nAuthor Name / Subject: "${text}"\nInstructions:\n1. Calculate and analyze H-Index metrics, total citations, i10-index, and research trajectory.`;

    case 'academic_writing_templates':
      return `[TOOL 43: ACADEMIC WRITING TEMPLATES]\nTemplate Requested / Section: "${text}"\nInstructions:\n1. Provide a fill-in-the-blank academic writing template aligned with the requested citation style with transition phrases and sentence starters.`;

    case 'ai_debate':
      return `[TOOL 44: AI DEBATE]\nTopic / Thesis Statement: "${text}"\nInstructions:\n1. Conduct a structured academic debate presenting Thesis Argument (Pro), Antithesis Argument (Con), and Synthesis Conclusion.`;

    case 'fact_vs_opinion_detector':
      return `[TOOL 45: FACT VS OPINION DETECTOR]\nText: "${text}"\nInstructions:\n1. Classify every claim in the text as Fact (سەلمێنراو) or Opinion/Hypothesis (تێڕوانین) with rationale.`;

    case 'claim_verification':
      return `[TOOL 46: CLAIM VERIFICATION]\nStatement: "${text}"\nInstructions:\n1. Verify empirical claim against published literature, noting supporting evidence, counter-evidence, and certainty score.`;

    case 'citation_quality_score':
      return `[TOOL 47: CITATION QUALITY SCORE]\nReference List: "${text}"\nInstructions:\n1. Evaluate recency, peer-review weight, citation diversity, and overall citation score (0-100).`;

    case 'source_reliability_score':
      return `[TOOL 48: SOURCE RELIABILITY SCORE]\nSource Details: "${text}"\nInstructions:\n1. Score reliability based on publisher reputation, peer-review process, author credentials, and transparency.`;

    case 'ai_research_assistant':
      return `[TOOL 49: AI RESEARCH ASSISTANT]\nUser Query: "${text}"\nInstructions:\n1. Provide comprehensive scholarly assistance, answering questions with rigorous academic depth.`;

    case 'ai_book_writer':
      return `[TOOL 50: AI BOOK WRITER]\nBook Topic / Context: "${text}"\nInstructions:\n1. Draft academic book content with structured chapters, engaging exposition, and scholarly rigor.`;

    case 'ai_thesis_writer':
      return `[TOOL 51: AI THESIS WRITER]\nMaster's Thesis Topic / Section: "${text}"\nInstructions:\n1. Draft Master's thesis section in rigorous academic prose; citations must come only from verified supplied sources.`;

    case 'ai_dissertation_writer':
      return `[TOOL 52: AI DISSERTATION WRITER]\nPhD Dissertation Topic / Section: "${text}"\nInstructions:\n1. Draft PhD dissertation section with deep theoretical framework, original synthesis, and academic prose.`;

    case 'ai_professor_review':
      return `[TOOL 53: AI PROFESSOR REVIEW]\nDraft Content: "${text}"\nInstructions:\n1. Provide critique from perspective of a senior university professor: strengths, flaws, conceptual gaps, and required edits.`;

    case 'ai_exam_generator':
      return `[TOOL 54: AI EXAM GENERATOR]\nCourse Text / Subject: "${text}"\nInstructions:\n1. Generate university exam paper: Multiple Choice Questions (MCQs), Essay Questions, and Answer Key with marking rubric.`;

    case 'ai_presentation_generator':
      return `[TOOL 55: AI PRESENTATION GENERATOR]\nResearch Context: "${text}"\nInstructions:\n1. Generate slide deck content (Slide 1 to 10) with Slide Title, Bullet Points, Visual Suggestions, and Speaker Notes.`;

    case 'ai_flashcards':
      return `[TOOL 56: AI FLASHCARDS]\nTopic / Text: "${text}"\nInstructions:\n1. Create 10 Q&A study flashcards covering key definitions, theories, and empirical findings.`;

    case 'ai_quiz_generator':
      return `[TOOL 57: AI QUIZ GENERATOR]\nText: "${text}"\nInstructions:\n1. Create 5-question comprehension quiz with answer choices, correct answers, and explanations.`;

    case 'ai_study_planner':
      return `[TOOL 58: AI STUDY PLANNER]\nExam / Topic Deadline: "${text}"\nInstructions:\n1. Build personalized study timetable with daily goals, revision cycles, and self-assessment milestones.`;

    case 'ai_reading_assistant':
      return `[TOOL 59: AI READING ASSISTANT]\nArticle Text: "${text}"\nInstructions:\n1. Summarize paper into: Executive Summary, Key Findings, Methodology, Limitations, and Takeaways.`;

    case 'ai_pdf_chat':
      return `[TOOL 60: AI PDF CHAT]\nPDF Content / Context: "${text}"\nInstructions:\n1. Answer queries directly based on the provided document text with precise citations to section/paragraph.`;

    default:
      return null;
  }
}
