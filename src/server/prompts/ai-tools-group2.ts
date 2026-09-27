export function buildGroup2Prompt(toolId: string, text: string, styleOption: string, targetLang: string, toneOption: string): string | null {
  switch (toolId) {
    case 'ocr_image_ai':
      return `[TOOL 61: AI IMAGE OCR]\nImage Text / Scanned Content: "${text}"\nInstructions:\n1. Convert raw image text to pristine academic Sorani Kurdish / English text, removing noise and misreads.`;

    case 'table_extractor_ai':
      return `[TOOL 62: AI TABLE EXTRACTOR]\nRaw Data / Unstructured Text: "${text}"\nInstructions:\n1. Extract numerical data into a structured Markdown table with calculated sums/means where applicable.`;

    case 'reference_finder_ai':
      return `[TOOL 63: AI REFERENCE FINDER]\nDraft Statement: "${text}"\nInstructions:\n1. Locate real peer-reviewed papers matching this statement and format citations.`;

    case 'auto_citation_fixer':
      return `[TOOL 64: AI AUTO CITATION FIXER]\nStyle: ${styleOption}\nCitations: "${text}"\nInstructions:\n1. Fix formatting, capitalization, punctuation, and DOIs according to ${styleOption} standards.`;

    case 'academic_translator':
      return `[TOOL 65: AI ACADEMIC TRANSLATOR]\nTarget Language: ${targetLang}\nInput: "${text}"\nInstructions:\n1. Translate to scholarly ${targetLang} preserving academic nuances, followed by key terminology glossary.`;

    case 'grammar_style_checker':
      return `[TOOL 66: AI GRAMMAR & STYLE CHECKER]\nText: "${text}"\nInstructions:\n1. Fix grammar, spelling, sentence flow, and passive voice overuse. Return corrected text and explanation of edits.`;

    case 'writing_tone_selector':
      return `[TOOL 67: AI WRITING TONE SELECTOR]\nTone: ${toneOption}\nText: "${text}"\nInstructions:\n1. Rewrite text to match requested tone (${toneOption}). Provide two variations.`;

    case 'abstract_generator':
      return `[TOOL 68: AI ABSTRACT GENERATOR]\nResearch Overview: "${text}"\nInstructions:\n1. Generate structured 250-word abstract: Background, Objective, Methodology, Results, Conclusion, Keywords.`;

    case 'keywords_generator':
      return `[TOOL 69: AI KEYWORDS GENERATOR]\nText: "${text}"\nInstructions:\n1. Extract 10 indexed keywords categorized by field, methodology, and thematic focus with English equivalents.`;

    case 'title_generator':
      return `[TOOL 70: AI TITLE GENERATOR]\nTopic: "${text}"\nInstructions:\n1. Generate 5 distinct academic title options (empirical, colon-separated, question-based, policy, conceptual).`;

    case 'research_question_generator':
      return `[TOOL 71: AI RESEARCH QUESTION GENERATOR]\nTopic: "${text}"\nInstructions:\n1. Formulate 1 Primary Research Question and 4 Sub-Questions matching SMART criteria.`;

    case 'hypothesis_generator':
      return `[TOOL 72: AI HYPOTHESIS GENERATOR]\nVariables: "${text}"\nInstructions:\n1. Formulate Null Hypothesis (H0) and Alternative Hypothesis (H1) with variable identification and test suggestions.`;

    case 'methodology_builder':
      return `[TOOL 73: AI METHODOLOGY BUILDER]\nResearch Objectives: "${text}"\nInstructions:\n1. Construct methodology outline: Design, Population, Sampling, Data Collection Instruments, Analysis Plan, Ethics.`;

    case 'literature_review_generator':
      return `[TOOL 74: AI LITERATURE REVIEW GENERATOR]\nTopic: "${text}"\nInstructions:\n1. Draft literature review section identifying themes, historical development, and literature gaps.`;

    case 'discussion_generator':
      return `[TOOL 75: AI DISCUSSION GENERATOR]\nResults: "${text}"\nInstructions:\n1. Draft Academic Discussion interpreting results, comparing with literature, and explaining theoretical impact.`;

    case 'conclusion_generator':
      return `[TOOL 76: AI CONCLUSION GENERATOR]\nResearch Summary: "${text}"\nInstructions:\n1. Draft Conclusion section synthesizing findings, implications, and scholarly closing.`;

    case 'limitation_detector':
      return `[TOOL 77: AI LIMITATION DETECTOR]\nMethodology / Text: "${text}"\nInstructions:\n1. Identify methodological, sampling, and scope limitations with constructive framing.`;

    case 'future_work_generator':
      return `[TOOL 78: AI FUTURE WORK GENERATOR]\nContext: "${text}"\nInstructions:\n1. Formulate 5 actionable future research recommendations across methodology, geography, and interdisciplinary scope.`;

    case 'book_outline_generator':
      return `[TOOL 79: AI BOOK OUTLINE GENERATOR]\nBook Subject: "${text}"\nInstructions:\n1. Generate multi-chapter Table of Contents with sub-headings and target word counts.`;

    case 'chapter_writer':
      return `[TOOL 80: AI CHAPTER WRITER]\nChapter Outline: "${text}"\nInstructions:\n1. Write complete academic draft chapter section (~700 words) with headings and in-text citation placeholders.`;

    case 'reference_cross_check':
      return `[TOOL 81: AI REFERENCE CROSS-CHECK]\nText & References: "${text}"\nInstructions:\n1. Cross-check in-text citations against reference list, identifying missing or orphaned citations.`;

    case 'duplicate_content_detector':
      return `[TOOL 82: AI DUPLICATE CONTENT DETECTOR]\nText: "${text}"\nInstructions:\n1. Detect redundant phrasing and self-plagiarism, providing a condensed, unique version.`;

    case 'research_dashboard':
      return `[TOOL 83: AI RESEARCH DASHBOARD]\nThesis Draft: "${text}"\nInstructions:\n1. Generate overall research scorecard: Rigor (0-100), Citation Density (0-100), Completeness (0-100), and top recommendations.`;

    case 'ai_research_planner':
      return `[TOOL 84: AI RESEARCH PLANNER]\nScope: "${text}"\nInstructions:\n1. Build a step-by-step execution roadmap with task breakdown, prerequisites, and deliverables.`;

    case 'ai_research_roadmap':
      return `[TOOL 85: AI RESEARCH ROADMAP]\nLong-term Goal: "${text}"\nInstructions:\n1. Outline 3-5 year academic publication and research trajectory map.`;

    case 'ai_source_comparison':
      return `[TOOL 86: AI SOURCE COMPARISON]\nSources / Perspectives: "${text}"\nInstructions:\n1. Compare two or more sources side-by-side: methodology, arguments, findings, and consensus points.`;

    case 'ai_evidence_ranking':
      return `[TOOL 87: AI EVIDENCE RANKING]\nArguments / Data: "${text}"\nInstructions:\n1. Rank evidence from strongest to weakest based on sample size, methodology, and peer-reviewed authority.`;

    case 'ai_citation_network':
      return `[TOOL 88: AI CITATION NETWORK]\nKey Papers: "${text}"\nInstructions:\n1. Map citation dependencies, seed papers, seminal works, and citation clusters.`;

    case 'ai_knowledge_graph':
      return `[TOOL 89: AI KNOWLEDGE GRAPH]\nDomain Concepts: "${text}"\nInstructions:\n1. Create entity-relationship knowledge graph representing core domain facts and relations.`;

    case 'ai_concept_map':
      return `[TOOL 90: AI CONCEPT MAP]\nTheories / Concepts: "${text}"\nInstructions:\n1. Build hierarchical concept map illustrating cause-and-effect relationships.`;

    case 'ai_timeline_generator':
      return `[TOOL 91: AI TIMELINE GENERATOR]\nHistorical / Research Events: "${text}"\nInstructions:\n1. Construct chronological timeline with dates, events, milestones, and historical significance.`;

    case 'ai_author_profile':
      return `[TOOL 92: AI AUTHOR PROFILE]\nAuthor Name / Body of Work: "${text}"\nInstructions:\n1. Generate comprehensive author academic profile: research focus, seminal works, citation impact, and key collaborators.`;

    case 'ai_journal_recommendation':
      return `[TOOL 93: AI JOURNAL RECOMMENDATION]\nPaper Summary: "${text}"\nInstructions:\n1. Recommend top journal matches with acceptance rate, turnaround time, and indexing status.`;

    case 'ai_conference_finder':
      return `[TOOL 94: AI CONFERENCE FINDER]\nTopic: "${text}"\nInstructions:\n1. List upcoming academic conferences, call for papers deadlines, and submission requirements.`;

    case 'ai_grant_proposal_writer':
      return `[TOOL 95: AI GRANT PROPOSAL WRITER]\nProject Idea: "${text}"\nInstructions:\n1. Write grant application: Executive Summary, Project Objectives, Methodology, Budget Justification, and Expected Impact.`;

    case 'ai_research_collaboration':
      return `[TOOL 96: AI RESEARCH COLLABORATION]\nResearch Profile: "${text}"\nInstructions:\n1. Identify complementary research fields, potential institutional partners, and joint project ideas.`;

    case 'ai_peer_review_simulator':
      return `[TOOL 97: AI PEER REVIEW SIMULATOR]\nReviewer Comments: "${text}"\nInstructions:\n1. Simulate author rebuttal response letter addressing reviewer criticisms point-by-point.`;

    case 'ai_supervisor_feedback':
      return `[TOOL 98: AI SUPERVISOR FEEDBACK]\nDraft Section: "${text}"\nInstructions:\n1. Provide actionable supervisor comments, highlighting missing citations, weak arguments, and structural edits.`;

    case 'ai_defense_preparation':
      return `[TOOL 99: AI DEFENSE PREPARATION]\nThesis Abstract / Key Claims: "${text}"\nInstructions:\n1. Formulate 10 challenging Viva Voce defense questions with ideal, high-scoring candidate responses.`;

    case 'ai_presentation_coach':
      return `[TOOL 100: AI PRESENTATION COACH]\nPresentation Script: "${text}"\nInstructions:\n1. Critique presentation script for pacing, clarity, audience engagement, and time management.`;

    case 'ai_voice_presentation':
      return `[TOOL 101: AI VOICE PRESENTATION]\nSlide Content: "${text}"\nInstructions:\n1. Convert slide bullets into a spoken presentation narrative with pronunciation tips for terminology.`;

    case 'ai_research_archive':
      return `[TOOL 102: AI RESEARCH ARCHIVE]\nDocuments / Notes: "${text}"\nInstructions:\n1. Catalog and tag research assets with metadata, keywords, and archive indexing numbers.`;

    case 'ai_academic_workspace':
      return `[TOOL 103: AI ACADEMIC WORKSPACE]\nWorkspace Setup: "${text}"\nInstructions:\n1. Organize research workspace layout, module prioritization, and workflow shortcuts.`;

    case 'performance_optimization':
      return `[TOOL 104: PERFORMANCE OPTIMIZATION]\nSystem / Text Data: "${text}"\nInstructions:\n1. Optimize text processing pipeline, token usage, and execution efficiency.`;

    case 'security_hardening':
      return `[TOOL 105: SECURITY HARDENING]\nData / Text: "${text}"\nInstructions:\n1. Audit data privacy, sanitize personal identifiers, and apply academic confidentiality guidelines.`;

    case 'cache_system':
      return `[TOOL 106: CACHE SYSTEM]\nData / Queries: "${text}"\nInstructions:\n1. Optimize cache key strategy and data persistence for instant retrieval.`;

    case 'offline_mode':
      return `[TOOL 107: OFFLINE MODE]\nData / Local Storage: "${text}"\nInstructions:\n1. Prepare offline data sync package for local-first storage.`;

    case 'backup_restore':
      return `[TOOL 108: BACKUP & RESTORE]\nDatabase State: "${text}"\nInstructions:\n1. Format JSON backup file payload and verify integrity checksums.`;

    case 'auto_update_system':
      return `[TOOL 109: AUTO UPDATE SYSTEM]\nSystem Version: "${text}"\nInstructions:\n1. Verify system version compatibility and feature updates.`;

    case 'error_reporting_monitoring':
      return `[TOOL 110: ERROR REPORTING & MONITORING]\nSystem Logs: "${text}"\nInstructions:\n1. Analyze error stack traces, diagnose root causes, and suggest immediate fixes.`;

    case 'unit_testing':
      return `[TOOL 111: UNIT TESTING]\nCode / Logic: "${text}"\nInstructions:\n1. Generate TypeScript / Jest unit tests for academic helper functions.`;

    case 'integration_testing':
      return `[TOOL 112: INTEGRATION TESTING]\nAPI Endpoints: "${text}"\nInstructions:\n1. Generate end-to-end integration test scenarios for research suite.`;

    case 'api_documentation':
      return `[TOOL 113: API DOCUMENTATION]\nAPI Route: "${text}"\nInstructions:\n1. Generate OpenAPI / Swagger compliant API documentation for endpoint.`;

    case 'code_refactoring':
      return `[TOOL 114: CODE REFACTORING]\nCode Snippet: "${text}"\nInstructions:\n1. Refactor code for clean architecture, type safety, and OnPush change detection.`;

    case 'plugin_system':
      return `[TOOL 115: PLUGIN SYSTEM]\nPlugin Specification: "${text}"\nInstructions:\n1. Define plugin architecture, lifecycle hooks, and interface declarations.`;

    case 'extension_marketplace':
      return `[TOOL 116: EXTENSION MARKETPLACE]\nExtension Name: "${text}"\nInstructions:\n1. Package extension manifest, feature permissions, and user documentation.`;

    case 'custom_ai_agents':
      return `[TOOL 117: CUSTOM AI AGENTS]\nAgent Prompt / Role: "${text}"\nInstructions:\n1. Construct custom AI agent persona with system prompt, temperature, and tool bindings.`;

    case 'custom_prompt_builder':
      return `[TOOL 118: CUSTOM PROMPT BUILDER]\nDesired Output: "${text}"\nInstructions:\n1. Build advanced, zero-shot / few-shot prompt template for optimal Gemini response.`;

    case 'workflow_automation':
      return `[TOOL 119: WORKFLOW AUTOMATION]\nPipeline Steps: "${text}"\nInstructions:\n1. Automate sequential research workflow steps from data collection to final manuscript.`;

    case 'team_workspace':
      return `[TOOL 120: TEAM WORKSPACE]\nTeam Setup: "${text}"\nInstructions:\n1. Define team roles, permissions, document sharing matrix, and peer review assignments.`;

    default:
      return null;
  }
}
