export function buildGroup3Prompt(toolId: string, text: string, styleOption: string, targetLang: string, toneOption: string): string {
  switch (toolId) {
    case 'realtime_collaboration':
      return `[TOOL 121: REAL-TIME COLLABORATION]\nSession Data: "${text}"\nInstructions:\n1. Process concurrent edit delta, resolve conflict markers, and sync document state.`;

    case 'comment_system':
      return `[TOOL 122: COMMENT SYSTEM]\nParagraph & Comment: "${text}"\nInstructions:\n1. Format scholarly inline marginalia comments, suggestions, and resolution status.`;

    case 'version_history':
      return `[TOOL 123: VERSION HISTORY]\nRevisions: "${text}"\nInstructions:\n1. Compare revision snapshots, highlight structural additions/deletions, and summarize change log.`;

    case 'ai_change_tracking':
      return `[TOOL 124: AI CHANGE TRACKING]\nOriginal vs Modified: "${text}"\nInstructions:\n1. Generate Track Changes markup highlighting insertion, deletion, and formatting edits.`;

    case 'voice_commands':
      return `[TOOL 125: VOICE COMMANDS]\nVoice Dictation: "${text}"\nInstructions:\n1. Convert raw spoken dictation into polished academic prose with proper punctuation.`;

    case 'handwriting_recognition':
      return `[TOOL 126: HANDWRITING RECOGNITION]\nHandwritten Note Transcript: "${text}"\nInstructions:\n1. Transcribe handwritten notes into clean digital academic text with structure.`;

    case 'whiteboard':
      return `[TOOL 127: WHITEBOARD CONCEPTUALIZER]\nWhiteboard Notes / Sketches: "${text}"\nInstructions:\n1. Synthesize visual whiteboard ideas into structured research proposal sections.`;

    case 'research_calendar':
      return `[TOOL 128: RESEARCH CALENDAR]\nEvents / Deadlines: "${text}"\nInstructions:\n1. Organize academic calendar with conference deadlines, submission dates, and Viva milestones.`;

    case 'task_manager':
      return `[TOOL 129: TASK MANAGER]\nTasks: "${text}"\nInstructions:\n1. Organize research tasks into Kanban columns (To Do, In Progress, Review, Done) with priority tags.`;

    case 'ai_personal_assistant':
      return `[TOOL 130: AI PERSONAL ASSISTANT]\nUser Request: "${text}"\nInstructions:\n1. Serve as dedicated 24/7 senior academic advisor, guiding research, thesis writing, and scholarly publications.`;

    case 'ai_prompt_library':
      return `[TOOL 131: AI PROMPT LIBRARY & OPTIMIZER]\nPrompt Concept: "${text}"\nInstructions:\n1. Optimize the user prompt into a high-rigor academic zero-shot / few-shot structure without claiming institutional endorsement.`;

    case 'citation_auto_repair':
      return `[TOOL 132: CITATION AUTO-REPAIR MATRIX]\nStyle: ${styleOption}\nCitations: "${text}"\nInstructions:\n1. Detect and repair missing punctuation, year formatting, journal capitalization, and DOI links strictly in ${styleOption} format.`;

    case 'advanced_plagiarism_detector':
      return `[TOOL 133: ADVANCED PLAGIARISM & AI DETECTOR]\nDraft Text: "${text}"\nInstructions:\n1. Analyze draft for potential AI generation markers, sentence entropy, and similarity index estimates.`;

    case 'multilingual_voice_synthesizer':
      return `[TOOL 134: MULTILINGUAL VOICE SYNTHESIZER]\nScript: "${text}"\nTarget Language: ${targetLang}\nInstructions:\n1. Prepare phonetic narration transcript with emotional pauses, emphasis tags, and pronunciation guides for term delivery.`;

    case 'smart_research_notetaker':
      return `[TOOL 135: SMART RESEARCH NOTE-TAKER]\nArticle Text: "${text}"\nInstructions:\n1. Extract executive bullet points, main thesis, key arguments, empirical methodology, and critical limitations.`;

    case 'institutional_compliance_auditor':
      return `[TOOL 136: INSTITUTIONAL COMPLIANCE AUDITOR]\nThesis Text: "${text}"\nInstructions:\n1. Audit thesis text against formal university dissertation guidelines (fonts, margins, header structure, ethics clearance).`;

    case 'viva_voce_simulator_pro':
      return `[TOOL 137: VIVA VOCE DEFENSE SIMULATOR PRO]\nThesis Abstract: "${text}"\nInstructions:\n1. Conduct high-stakes doctoral Viva Voce simulation with 5 rigorous examiner questions and candidate ideal answers.`;

    case 'interactive_knowledge_graph':
      return `[TOOL 138: INTERACTIVE KNOWLEDGE GRAPH BUILDER]\nConcepts / Authors: "${text}"\nInstructions:\n1. Generate Mermaid graph syntax visualizing node relationships, theoretical vectors, and citation linkages.`;

    case 'automatic_bibliography_synthesizer':
      return `[TOOL 139: AUTOMATIC BIBLIOGRAPHY SYNTHESIZER]\nRaw References: "${text}"\nInstructions:\n1. Deduplicate, alphabetize, and format raw reference list into publication-ready bibliography.`;

    case 'academic_journal_impact_estimator':
      return `[TOOL 140: ACADEMIC JOURNAL IMPACT ESTIMATOR]\nAbstract / Journal Name: "${text}"\nInstructions:\n1. Estimate acceptance probability, review turnaround window, impact metrics, and indexing credentials.`;

    case 'ai_marketplace':
      return `[TOOL 141: AI MARKETPLACE]\nMarketplace Query / Agent Need: "${text}"\nInstructions:\n1. Search and list specialized research agents, model cards, prompt workflows, and integration manifests.`;

    case 'plugin_store':
      return `[TOOL 142: PLUGIN STORE]\nPlugin Need / Category: "${text}"\nInstructions:\n1. Generate plugin specification, feature permissions, API hooks, and installation guide.`;

    case 'public_api':
      return `[TOOL 143: PUBLIC API DOCUMENTATION & BUILDER]\nAPI Query / Route: "${text}"\nInstructions:\n1. Output OpenAPI / Swagger 3.0 REST spec with endpoint definitions, headers, and payload schemas.`;

    case 'developer_sdk':
      return `[TOOL 144: DEVELOPER SDK SUITE]\nSDK Request: "${text}"\nInstructions:\n1. Generate complete code boilerplate in TypeScript, Python, and cURL for integrating the Kurdish Library API.`;

    case 'cloud_sync':
      return `[TOOL 145: CLOUD SYNC ENGINE]\nSync State / Documents: "${text}"\nInstructions:\n1. Process real-time cloud document sync delta, conflict resolution state, and storage checksums.`;

    case 'enterprise_version':
      return `[TOOL 146: ENTERPRISE SUITE]\nOrganization Name / Scope: "${text}"\nInstructions:\n1. Generate Enterprise deployment plan, custom domain configuration, SSO/SAML setup, and SLA metrics.`;

    case 'multi_tenant_system':
      return `[TOOL 147: MULTI-TENANT WORKSPACE ARCHITECTURE]\nTenant / Department Name: "${text}"\nInstructions:\n1. Configure tenant data isolation policy, role hierarchies, workspace quotas, and storage buckets.`;

    case 'team_admin_dashboard':
      return `[TOOL 148: TEAM ADMIN DASHBOARD]\nTeam Setup / Email: "${text}"\nInstructions:\n1. Generate team administration matrix: user roles (Owner, Admin, Member, Reviewer), activity logs, and quota limits.`;

    case 'ai_model_manager':
      return `[TOOL 149: MULTI-MODEL MANAGER]\nModel Preference: "${text}"\nInstructions:\n1. Configure model routing strategy between Gemini 1.5 Pro/Flash, GPT-4o, and Claude 3.5 Sonnet based on task complexity.`;

    case 'local_ai_support':
      return `[TOOL 150: LOCAL AI INTEGRATION (OLLAMA & LM STUDIO)]\nLocal Model Setup: "${text}"\nInstructions:\n1. Generate Ollama / LM Studio local API configuration (localhost:11434), context parameters, and offline fallback strategy.`;

    case 'mcp_support':
      return `[TOOL 151: MCP PROTOCOL SUPPORT]\nMCP Context Query: "${text}"\nInstructions:\n1. Format Model Context Protocol (MCP) server integration JSON-RPC request and resource schema.`;

    case 'vector_database':
      return `[TOOL 152: VECTOR DATABASE & SEMANTIC EMBEDDINGS]\nSemantic Search Query: "${text}"\nInstructions:\n1. Perform vector embedding similarity analysis, returning top matching document chunks with cosine distance scores.`;

    case 'finetuning_system':
      return `[TOOL 153: FINE-TUNING MANAGEMENT SUITE]\nDomain / Language Target: "${text}"\nInstructions:\n1. Generate fine-tuning hyperparameters, epoch configurations, and JSONL training sample validation metrics.`;

    case 'ai_dataset_manager':
      return `[TOOL 154: AI DATASET MANAGER & ANNOTATOR]\nDataset Context: "${text}"\nInstructions:\n1. Format JSONL instruction-tuning pair dataset with system, user, and assistant turns for model training.`;

    case 'usage_analytics':
      return `[TOOL 155: REAL-TIME USAGE ANALYTICS]\nTime Range / Metrics: "${text}"\nInstructions:\n1. Generate analytical usage breakdown: API requests, token consumption graphs, average latency, and error rates.`;

    case 'cost_management':
      return `[TOOL 156: COST & TOKEN BUDGET MANAGEMENT]\nBudget Limit: "${text}"\nInstructions:\n1. Calculate token expenditure across models, forecast monthly API costs, and define hard/soft budget alerts.`;

    case 'auto_backup_cloud':
      return `[TOOL 157: AUTOMATED CLOUD BACKUP & RECOVERY]\nBackup Request: "${text}"\nInstructions:\n1. Generate automated Cloud Storage backup manifest with encryption keys, checksums, and point-in-time recovery steps.`;

    case 'multilingual_ui':
      return `[TOOL 158: MULTILINGUAL UI LOCALIZATION MATRIX]\nLocalization Request: "${text}"\nInstructions:\n1. Provide translation matrix across Kurdish Sorani, English, Arabic, and Persian with RTL/LTR layout directions.`;

    case 'accessibility_wcag':
      return `[TOOL 159: ACCESSIBILITY & WCAG COMPLIANCE AUDITOR]\nUI Element / Screen: "${text}"\nInstructions:\n1. Audit interface element against WCAG 2.1 AA standards: color contrast, ARIA labels, keyboard focus, and screen reader compatibility.`;

    case 'long_term_maintenance':
      return `[TOOL 160: LONG-TERM MAINTENANCE & SYSTEM HEALTH INSPECTOR]\nSystem Component: "${text}"\nInstructions:\n1. Perform comprehensive system health audit: API uptime status, database index health, security vulnerability scan, and memory footprint.`;

    default:
      return `[TOOL ${toolId.toUpperCase()}]\nInput text: "${text}"\nRequested Style: ${styleOption} | Language: ${targetLang} | Tone: ${toneOption}\nInstructions:\n1. Perform high-rigor academic analysis and processing on the input without claiming institutional standards.\n2. Output clean, structured Markdown in Sorani Kurdish / English as requested.`;
  }
}
