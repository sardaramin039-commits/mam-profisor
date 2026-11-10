/**
 * THE 100-POINT ACADEMIC & TECHNICAL REVOLUTION FOR "MAM PROFESSOR"
 * 10 Columns of Scholarly, Linguistic, Computational, Methodological, and System Excellence.
 */

export interface AcademicPointDefinition {
  id: number;
  column: "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII" | "IX" | "X";
  columnTitleKurdish: string;
  columnTitleEnglish: string;
  titleKurdish: string;
  titleEnglish: string;
  systemDirective: string;
}

export const HUNDRED_ACADEMIC_POINTS: AcademicPointDefinition[] = [
  // COLUMN I: NARRATOLOGY & TRAVELOGUE LITERATURE (Points 1-10)
  {
    id: 1,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "ماتریکسی کاتشوێن (Chronotope)ی باختین",
    titleEnglish: "Bakhtinian Chronotope Mapping",
    systemDirective: "شیکردنەوەی چۆنیەتیی ئاوێتەبوونی کات و شوێن لە دەقە ئەدەبی و مێژووییەکاندا بەپێی تیۆریی کرۆنۆتۆپی باختین."
  },
  {
    id: 2,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "نەخشەسازیی جوگرافی-ئەدەبی (GIS Literary Mapping)",
    titleEnglish: "GIS Literary & Geographic Mapping",
    systemDirective: "بەستنەوەی ڕێڕەوی گەشتنامەکان بە خاڵە جوگرافییەکان و ئامادەکردنی داتای پێکهاتەیی بۆ گرافە بینراوەکانی D3."
  },
  {
    id: 3,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "شیکاریی گوتار و پەیوەندیی دەسەڵات (فوکۆ)",
    titleEnglish: "Foucault-inspired Discourse & Power Analysis",
    systemDirective: "دەرهێنانی تۆڕی دەسەڵات، زانین و هەژموون لە دەقە مێژوویی، گەشتنامەیی و کولتوورییەکاندا."
  },
  {
    id: 4,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "شیکاریی گۆشەنیگا و ڕوانین (Focalization)ی ژێنێت",
    titleEnglish: "Genette's Focalization Analyzer",
    systemDirective: "جیاکردنەوەی گۆشەنیگای ناوەکی، دەرەکی، و گێڕەرەوەی هەمووشتزان (Zero/Internal/External Focalization)."
  },
  {
    id: 5,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "پێوانەکردنی خێرایی و ماوەی گێڕانەوە (Narrative Speed)",
    titleEnglish: "Narrative Speed & Duration Calculus",
    systemDirective: "پۆلێنکردنی دیمەن (Scene)، پوختە (Summary)، بازدان (Ellipsis)، و وەستان (Pause) لە گێڕانەوەی ڕووداوەکاندا."
  },
  {
    id: 6,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "تۆڕی پەیوەندیی کەسایەتییە مێژووییەکان",
    titleEnglish: "Character & Historical Figure Network Graph",
    systemDirective: "دروستکردنی تۆڕی کارلێکی کەسایەتییەکان، کاریگەری و بەرکەوتنە مێژووییە تۆمارکراوەکان."
  },
  {
    id: 7,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "بزوێنەری وێناناسی (Imagology Engine)",
    titleEnglish: "Imagology & Representation of the Other",
    systemDirective: "هەڵسەنگاندنی نوێنەرایەتیکردنی «ئەوی تر»، ستریۆتایپە ڕۆژهەڵاتناسییەکان و دیدگای گەشتیاران بۆ کۆمەڵگەی کوردی."
  },
  {
    id: 8,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "دەرهێنەری کۆمەڵناسیی ژیانی ڕۆژانە و ئابووری",
    titleEnglish: "Daily Life & Economic Sociology Extractor",
    systemDirective: "شیکردنەوەی دۆخی پیشە، بازاڕ، دابونەریت و پێکهاتەی کۆمەڵایەتی لە دەقە کلاسیک و دۆکیۆمێنتارییەکاندا."
  },
  {
    id: 9,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "دۆزەرەوەی دەقئاوێزانی (Intertextuality Detector)",
    titleEnglish: "Intertextuality & Folkloric Influence Detector",
    systemDirective: "ئاشکراکردنی کاریگەریی دەقە پیرۆزەکان، چیرۆکە فۆلکلۆرییەکان و شاکارە ئەدەبییەکان لەناو دەقی توێژینەوەدا."
  },
  {
    id: 10,
    column: "I",
    columnTitleKurdish: "گێڕانەوەناسی و ئەدەبیاتی گەشتنامەیی",
    columnTitleEnglish: "Narratology & Travelogue Literature",
    titleKurdish: "ماتریکسی بەراوردکاریی فرە-دەق (Multi-Text Comparative Matrix)",
    titleEnglish: "Simultaneous Multi-Text Comparative Matrix",
    systemDirective: "بەراوردکردنی هاوکاتی سێ دەق یان زیاتر لەسەر تەوەرە میتۆدی، چەمکسازی و ئایدۆلۆژییەکان."
  },

  // COLUMN II: KURDISH COMPUTATIONAL LINGUISTICS & STYLOMETRICS (Points 11-20)
  {
    id: 11,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "شیکارکەری مۆرفۆ-سینتاکسی کوردی",
    titleEnglish: "Kurdish Morpho-Syntax & Clitic Pronoun Analyzer",
    systemDirective: "وردبینی لە ڕەگی لێکردنەوە، پاشگر، پێشگر و جێناوە لکاوە نادیار و فاعیلییەکان."
  },
  {
    id: 12,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "نەخشەی زاراوەسازی و جیاوازیی شێوەزارەکان",
    titleEnglish: "Dialectal Variant Mapping (Sorani, Kurmanji, Hawrami)",
    systemDirective: "هاوتاکردنی هاوکاتی وشە و دەستەواژەکان لە نێوان زارەکانی سۆرانی، کرمانجیی سەروو و هەورامیدا."
  },
  {
    id: 13,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "ستایلۆمێتریکی چەندایەتی (Quantitative Stylometrics)",
    titleEnglish: "Stylometric Density & Lexical Richness Calculus",
    systemDirective: "پێوانەی درێژیی مامناوەندی ڕستە، چڕیی فەرهەنگی (Lexical Density) و نەهێشتنی دووبارەبوونەوەی نائاسایی وشە."
  },
  {
    id: 14,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "شیکاریی بەراوردکاریی کات و لایەنی کردار (Tense & Aspect)",
    titleEnglish: "Comparative Aspect & Tense Analysis",
    systemDirective: "بەراوردکاریی ڕێزمانیی کات و لایەنی کردار لە کوردی، فارسی و ئینگلیزیدا."
  },
  {
    id: 15,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "ستانداردسازەری خودکاری ڕێنووسی ئەکادیمیی کوردی",
    titleEnglish: "Automated Kurdish Academic Orthography Standardization",
    systemDirective: "یەکخستنی بزوێنەکان (ک/ك، ی/ي، ە/ه)، فاریزە، خاڵبەندی، و یەکگرتوویی نیمچەبۆشایی بەپێی ئەکادیمیای کوردی."
  },
  {
    id: 16,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "فلتەری تۆماری ئەکادیمی (Academic Register QA)",
    titleEnglish: "Academic Register QA & Tone Elevator",
    systemDirective: "گۆڕینی ڕەوانبێژیی ڕۆژنامەوانی، سۆزداری یان خیتابی بۆ دەقی سەنگینی زانکۆیی."
  },
  {
    id: 17,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "دروستکەری دارە ڕستەسازییەکان (Syntactic Tree Generator)",
    titleEnglish: "Syntactic Tree & Constituency Parser",
    systemDirective: "شیکردنەوەی پێکهاتەی بکەر، بەرکار، کار و تەواوکەرەکان لە ڕستە ئاڵۆزە زانستییەکاندا."
  },
  {
    id: 18,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "فەرهەنگی هاوواتا و دژواتا ئەکادیمییەکان",
    titleEnglish: "Academic Thesaurus & Contextual Synonyms",
    systemDirective: "پێشنیارکردنی هاوواتای فەرمی و دەوڵەمەند بۆ بەرزکردنەوەی ئاستی زمانەوانیی تێز."
  },
  {
    id: 19,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "پشکنەری کێشی عەرووزی و بڕگەیی شیعری کوردی",
    titleEnglish: "Prosody & Metric Verification (Aruz & Syllabic)",
    systemDirective: "پشکنینی بەحری عەرووزی شیعری کلاسیک (نالی، مەحوی، خانی) و کێشی بڕگەیی فۆلکلۆری."
  },
  {
    id: 20,
    column: "II",
    columnTitleKurdish: "زمانەوانیی کۆمپیوتەریی کوردی و ستایلۆمێتریک",
    columnTitleEnglish: "Kurdish Computational Linguistics & Stylometrics",
    titleKurdish: "تۆماری چوار-زمانیی زاراوە زانستییەکان",
    titleEnglish: "Quadrilingual Terminology Registry",
    systemDirective: "تۆمارکردن و هاوتاکردنی زاراوەکان بە کوردی، ئینگلیزی، عەرەبی و فارسی بە پێناسەی وردەوە."
  },

  // COLUMN III: PROVENANCE, CITATION & ANTI-HALLUCINATION GATES (Points 21-30)
  {
    id: 21,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "بەستنەوەی توندوتۆڵی بانگەشە بە لاپەڕەی دیاریکراو",
    titleEnglish: "Strict Claim-to-Page & Paragraph Binding",
    systemDirective: "قەدەغەکردنی هەر بانگەشەیەکی زانستی بێ دیاریکردنی ژمارەی لاپەڕە و بڕگەی ڕاستەقینە."
  },
  {
    id: 22,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "قوفڵی داخراوی کۆرپسی بنەڕەتی (Primary Corpus Locking)",
    titleEnglish: "Fail-Closed Primary Corpus Locking",
    systemDirective: "ڕێگریکردنی ڕەها لە دەستێوەردانی سەرچاوەی دەرەکی لە کاتی لێکۆڵینەوە لەسەر دەقە تایبەتەکانی توێژەر."
  },
  {
    id: 23,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "پشکنەری دەقاودەقی وتەزای دەق (Verbatim Quote Verifier)",
    titleEnglish: "Exact-Match Verbatim Quote Verifier",
    systemDirective: "هاوتاکردنی دەقاودەقی وتەزا وەرگیراوەکان لەگەڵ دەقی ئەسڵیی پەڕتووکەکان بێ کەموزییاد."
  },
  {
    id: 24,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "ڕاداری دژبەریی سەرچاوە مێژووییەکان",
    titleEnglish: "Source Contradiction Radar",
    systemDirective: "دەستنیشانکردنی دژیەکی لە نێوان سەرچاوەکان لەسەر ڕێکەوت، شوێن و ڕووداوە مێژووییەکان."
  },
  {
    id: 25,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "پێوەری متمانەی بەڵگە (Evidence Confidence Score 0-100)",
    titleEnglish: "Evidence Confidence Scoring",
    systemDirective: "نمرەدان بە بەهێزیی بەڵگەی بەکارهاتوو بەپێی ئاستی متمانەی سەرچاوە و بەستەرەکەی."
  },
  {
    id: 26,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "پۆلێندەری سێ-قۆناغیی بەڵگەنامە",
    titleEnglish: "Direct Quote vs Methodology vs Hypothesis Classification",
    systemDirective: "جیاکردنەوەی ڕوونی: (١) دەقی دەقاودەق، (٢) ڕاڤەی میتۆدی، و (٣) گریمانەی خودی توێژەر."
  },
  {
    id: 27,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "ئینداکسی تێکەڵاوی ڕاگ (Hybrid RAG Indexing 768-dim)",
    titleEnglish: "Hybrid RAG (768-dim Embeddings + BM25 Lexical)",
    systemDirective: "تێکەڵکردنی گەڕانی مانایی لە ڕێی ڤێکتەری ٧٦٨-ڕەهەندی لەگەڵ گەڕانی دەقاودەقی وشەسازی."
  },
  {
    id: 28,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "پارێزەری توخمە پارێزراوەکان (Protected Tokens Guard)",
    titleEnglish: "Protected Tokens Guard (Dates, Percentages, Pages)",
    systemDirective: "ڕێگریکردن لە هەر گۆڕانکارییەک لە ژمارە، بەروار، ڕێژەی سەدی، و ژمارەی لاپەڕەکان لە کاتی داڕشتنەوەدا."
  },
  {
    id: 29,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "تۆماری نەگۆڕی ڕەچەڵەکی بەڵگەکان (Provenance Ledger)",
    titleEnglish: "Immutable Evidence Provenance Ledger",
    systemDirective: "تۆمارکردنی زنجیرەی سەرچاوەی هەموو ئاماژەیەک لەگەڵ بەڵگەی شیکاریکراو."
  },
  {
    id: 30,
    column: "III",
    columnTitleKurdish: "ڕەسەنایەتی، بەڵگەسازی و دەروازەی دژە-خەیاڵکردن",
    columnTitleEnglish: "Provenance, Citation & Anti-Hallucination Gates",
    titleKurdish: "ئاگاداریی دەستبەجێی بۆشایی بەڵگە (Unverified Claim Alert)",
    titleEnglish: "Unverified Claim Warning System",
    systemDirective: "دەرخستنی هۆشداریی ڕوون کاتێک ڕستەیەک بەڵگەی پێویستی لە پشتەوە نییە."
  },

  // COLUMN IV: MULTI-AGENT ORCHESTRATION & DIALECTICAL REASONING (Points 31-40)
  {
    id: 31,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "چوارچێوەی بەڵگەهێنانەوەی تولمین (Toulmin Argument Model)",
    titleEnglish: "Toulmin Argument Structurer (Claim, Data, Warrant)",
    systemDirective: "داڕشتنی پەرەگرافەکان لەسەر پایەکانی: داوا (Claim)، بەڵگە (Data)، ڕێگەپێدان (Warrant)، و پشتگیری (Backing)."
  },
  {
    id: 32,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "دیبەیتە دیالێکتیکییە فرە-ئەجێنتییەکان",
    titleEnglish: "Multi-Agent Dialectical Debate Simulator",
    systemDirective: "دروستکردنی وتووێژی ڕەخنەگرانە لە نێوان قوتابخانە فکرییە جیاوازەکان پێش گەیشتن بە ئەنجام."
  },
  {
    id: 33,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "پارێزەری دەنگی توێژەر (Authorial Voice Guardian)",
    titleEnglish: "Authorial Voice Dominance Guardian",
    systemDirective: "دڵنیابوون لەوەی شیکردنەوە و دیدگای خودی توێژەر باڵادەستە بەسەر کۆتکردن و سەرچاوەکاندا."
  },
  {
    id: 34,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "دۆزەرەوەی بۆشایی زانستی لە ئەدەبیاتدا",
    titleEnglish: "Automated Research Gap Finder",
    systemDirective: "شیکردنەوەی پێشینەی توێژینەوە و دۆزینەوەی ئەو خاڵانەی کە تا ئێستا توێژینەوەی پێویستیان لەسەر نەکراوە."
  },
  {
    id: 35,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "داڕێژەری گریمانەی سەلمێنراو",
    titleEnglish: "Testable Hypothesis Generator",
    systemDirective: "بەستنەوەی گریمانەکان بە پرسیاری سەرەکیی توێژینەوە و کەرەستە میتۆدییەکان."
  },
  {
    id: 36,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "ئەجێنتی ڕەخنەگری میتۆدی (Methodological Critic)",
    titleEnglish: "Methodological Critic & Bias Auditor",
    systemDirective: "پشکنینی هەڵەی لۆژیکی، پێشداوەری و لاوازی لە شێوازی کۆکردنەوە و شیکردنەوەی زانیاری."
  },
  {
    id: 37,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "بزوێنەری پێکەوەبەستنی لۆژیکیی پەرەگرافەکان",
    titleEnglish: "Idea Cohesion & Transitional Logic Engine",
    systemDirective: "مسۆگەرکردنی پەیوەندیی دەق و تێپەڕینی نەرم و مەعریفی لە نێوان پەرەگرافە یەک لە دوای یەکەکان."
  },
  {
    id: 38,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "ئەجێنتی تاقیکردنەوەی سەرپەرشتیار (Supervisor Challenge)",
    titleEnglish: "Supervisor Defense Question Simulator",
    systemDirective: "خستنەڕووی توندترین پرسیار و تێبینییە ئەگەرییەکانی سەرپەرشتیار پێش بەدەستهێنانی پەسەندکردن."
  },
  {
    id: 39,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "هاوتەریبکەری لۆژیکیی سەردێڕ و دەق",
    titleEnglish: "Heading-to-Content Logical Alignment Enforcer",
    systemDirective: "پابەندکردنی ناوەڕۆکی هەر لقێک بەوەی تەنها باسی ناونیشانی دیاریکراو بکات بێ لادان."
  },
  {
    id: 40,
    column: "IV",
    columnTitleKurdish: "ئۆرکێسترای فرە-ئەجێنت و لۆژیکی دیالێکتیکی",
    columnTitleEnglish: "Multi-Agent Orchestration & Dialectical Reasoning",
    titleKurdish: "تۆماری بڕیارە میتۆدییەکانی توێژینەوە (Decision Ledger)",
    titleEnglish: "Durable Research Decision Ledger",
    systemDirective: "تۆمارکردنی هۆکاری هەڵبژاردنی نموونە، تیۆری و میتۆد لە پێناو داکۆکیی زانستی."
  },

  // COLUMN V: CITATION STYLES & BIBLIOGRAPHY FORMATTING (Points 41-50)
  {
    id: 41,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "پشتیوانیی دەستبەجێ بۆ شەش ستانداردی جیهانی",
    titleEnglish: "APA 7, MLA 9, Chicago AD/Notes, Harvard, IEEE Support",
    systemDirective: "گۆڕینی خودکاری شێوازی ئاماژەدان لە نێوان ستانداردە نێودەوڵەتییەکان بە پێوەری دروست."
  },
  {
    id: 42,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "پەراوێزی ژیرانەی کوردی (Ibid / Op.cit)",
    titleEnglish: "Intelligent Spatial Kurdish Footnotes",
    systemDirective: "ڕێکخستنی خودکاری «هەمان سەرچاوە» و «سەرچاوەی پێشوو» بەپێی نزیکیی شوێنی ئاماژەکان."
  },
  {
    id: 43,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "پشکنەری دروستیی ناسێنەرەکانی DOI، ISBN، و ISSN",
    titleEnglish: "DOI, ISBN, ISSN Crossref & OpenAlex Validator",
    systemDirective: "سەلماندنی بوونی ڕاستەقینەی سەرچاوەکان لە بنکەدراوە جیهانییەکان."
  },
  {
    id: 44,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "هاوردە و هەناردەی فۆرماتی BibTeX و RIS",
    titleEnglish: "BibTeX & RIS Import/Export for Zotero/Mendeley",
    systemDirective: "بەستنەوەی ڕاستەوخۆ بە بەرنامەکانی Zotero، Mendeley، و EndNote."
  },
  {
    id: 45,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "ڕیزبەندیی ئەکادیمیی فرە-زمانی سەرچاوەکان",
    titleEnglish: "Multilingual Categorized Bibliography Sorter",
    systemDirective: "جیاکردنەوەی دەقی بنەڕەتی، کتێب، وتار و نامەی زانکۆیی بە کوردی، فارسی، عەرەبی، و زمانی بیانی."
  },
  {
    id: 46,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "چارەسەرکەری ئاماژە هەتیوەکان (Orphan Citation Resolver)",
    titleEnglish: "Automated Orphan Citation Resolver",
    systemDirective: "دۆزینەوە و چارەسەرکردنی ئەو سەرچاوانەی لە دەقدا ناویان هاتووە بەڵام لە پێڕستدا نین یان بە پێچەوانەوە."
  },
  {
    id: 47,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "خشتەی ئەلفبێی ڕۆمانی (ISO Romanization Transliteration)",
    titleEnglish: "ISO Romanization Transliteration Tables",
    systemDirective: "ستانداردسازکردنی ناوی نووسەرانی کوردی و ڕۆژهەڵاتی بە پیتی لاتینی بەپێی ستانداردی ISO."
  },
  {
    id: 48,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "کورتکراوەی فەرمیی گۆڤارەکان (ISO 4 Abbreviations)",
    titleEnglish: "ISO 4 Journal Title Abbreviation Rules",
    systemDirective: "جێبەجێکردنی کورتکراوەی ستانداردی ناوی گۆڤارەکان لە ستایلەکانی IEEE و پزیشکی."
  },
  {
    id: 49,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "شیکاریی تەمەن و تازەیی سەرچاوەکان (Source Recency Analytics)",
    titleEnglish: "Source Age & Recency Distribution Analytics",
    systemDirective: "پیشاندانی نەخشەی تەمەنی سەرچاوەکان بۆ دڵنیابوون لە هەبوونی سەرچاوەی نوێی ٥ ساڵی ڕابردوو."
  },
  {
    id: 50,
    column: "V",
    columnTitleKurdish: "شێوازەکانی پەراوێز و داڕشتنی بیبلۆگرافیا",
    columnTitleEnglish: "Citation Styles & Bibliography Formatting",
    titleKurdish: "سیستەمی دوولایەنەی پەراوێز (Dual Footnotes)",
    titleEnglish: "Dual Footnotes (Explanatory Commentary + Citation)",
    systemDirective: "جیاکردنەوەی تێبینی و ڕوونکردنەوەی فکری لە ناونیشانی پەتیی سەرچاوە لە خوارەوەی لاپەڕە."
  },

  // COLUMN VI: QUANTITATIVE & QUALITATIVE METHODOLOGY LAB (Points 51-60)
  {
    id: 51,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "دەروازەی پشکنینی ڕاستێتیی ئاماری (Statistical Rigor)",
    titleEnglish: "Statistical Integrity Verification Gates",
    systemDirective: "پشکنینی گونجاویی تاقیکردنەوەی ئاماری، قەبارەی نموونە و بەهای p-value لەگەڵ ڕاگەیاندنی گریمانەکان."
  },
  {
    id: 52,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "تاقیگەی کۆدکردنی تەوەریی چۆنایەتی (NVivo-Style Coding)",
    titleEnglish: "Qualitative Thematic Excerpt Coding Lab",
    systemDirective: "تاگکردنی بڕگەکانی چاوپێکەوتن و پێکهێنانی کاتیگۆرییە سەرەکی و لاوەکییەکان."
  },
  {
    id: 53,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "ئەژمارکەری هێزی ئاماری و پێویستیی نموونە",
    titleEnglish: "Statistical Power & Sample Size Thresholds",
    systemDirective: "دیاریکردنی کەمترین ژمارەی نموونە بەپێی هاوکێشەی یامانی، کۆکران و هێزی 0.80."
  },
  {
    id: 54,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "پێوانی جێگیریی نێوان هەڵسەنگێنەران (Cohen's Kappa)",
    titleEnglish: "Inter-Rater Reliability Metrics (Cohen's Kappa)",
    systemDirective: "ئەژمارکردنی ئاستی هاوڕایی لە نێوان چەند دادوەر یان توێژەرێکی جیاواز لە کۆدکردندا."
  },
  {
    id: 55,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "تاقیکردنەوەی فریکوێنسیی زمانەوانی (Chi-Square & T-Test)",
    titleEnglish: "Linguistic Frequency Testing (Chi-Square & T-Test)",
    systemDirective: "پشکنینی ئاماریی جیاوازیی بەکارهێنانی وشە و زاراوەکان لە دەقی جیاوازدا."
  },
  {
    id: 56,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "داڕێژەری پرسیارنامەی پێوەری لیکەرت",
    titleEnglish: "Survey Instrument & Likert Scale Evaluation Builder",
    systemDirective: "پێکهێنانی پرسیارنامەی توێژینەوەی مەیدانی بە ڕەچاوکردنی ئاراستەی ئەرێنی و نەرێنی."
  },
  {
    id: 57,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "ماتریکسی خشتەیی پێداچوونەوەی ئەدەبیات",
    titleEnglish: "Structured Literature Review Comparison Matrix",
    systemDirective: "ڕێکخستنی وتارە پێشووەکان لە خشتەیەک بەپێی: توێژەر، ئامانج، میتۆد، نموونە و دۆزینەوەکان."
  },
  {
    id: 58,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "دروستکەری خشتەی ستانداردی APA",
    titleEnglish: "Raw Tabular Data to APA-Compliant Academic Tables",
    systemDirective: "گۆڕینی داتای خاو بۆ خشتەی ستاندارد بێ هێڵی ستوونی و بە ناونیشان و سەردێڕی فەرمی."
  },
  {
    id: 59,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "ئاشکراکەری گریمانە و سنووردارییە ئامارییەکان",
    titleEnglish: "Statistical Assumptions & Limitations Discloser",
    systemDirective: "نووسینی دەقی فەرمی دەربارەی سنووردارییەکانی کەرەستە و پێشگریمانەکانی ئامار لە تێزدا."
  },
  {
    id: 60,
    column: "VI",
    columnTitleKurdish: "تاقیگەی میتۆدۆلۆجیای چەندایەتی و چۆنایەتی",
    columnTitleEnglish: "Quantitative & Qualitative Methodology Lab",
    titleKurdish: "مۆدێلسازیی تەوەرەیی کوردی (Topic Modeling)",
    titleEnglish: "Unstructured Kurdish Corpus Topic Modeling",
    systemDirective: "دەستنیشانکردنی گرنگترین تەوەرە شاراوەکان لەناو دەقی فراوانی بەڵگەنامە و ئەدەبیاتدا."
  },

  // COLUMN VII: MANUSCRIPT DIGITIZATION, OCR & MULTI-ARCHIVAL SEARCH (Points 61-70)
  {
    id: 61,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "خوێنەرەوەی دەستنووسی مێژوویی (Gemini Multimodal OCR)",
    titleEnglish: "Historical Kurdish OCR via Gemini Multimodal Vision",
    systemDirective: "خوێندنەوەی لاپەڕە سکانکراوەکانی دەستنووسی کوردی و عوسمانی و گۆڕینی بۆ تێکستی ئەکادیمی."
  },
  {
    id: 62,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "ئامرازی لێکۆڵینەوە و بەراوردی دەستنووسەکان (Critical Apparatus)",
    titleEnglish: "Critical Apparatus Collation & Variant Engine",
    systemDirective: "تۆمارکردنی جیاوازیی نێوان نوسخەکانی دەستنووس بە شێوازی پەراوێزی تایبەتی تەحقیق."
  },
  {
    id: 63,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "پاراستنی نیشانەی لاپەڕەی ئەسڵیی دەق",
    titleEnglish: "Original Pagination Marker Preservation",
    systemDirective: "هێشتنەوەی نیشانەی [ل ١٥] لەناو دەقی دیجیتاڵیدا بۆ پاراستنی ئاسانیی گەڕانەوە بۆ لاپەڕەی کتێبەکە."
  },
  {
    id: 64,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "گەڕانی مانایی لەناو ٤٠ ئەرشیڤی زانستیی کوردی",
    titleEnglish: "Semantic Vector Search Across 40 Kurdish Scholarly Archives",
    systemDirective: "بەستنەوە بە گەنجینە ئەکادیمییەکانی زانکۆکان، گۆڤارە مێژووییەکان و دەزگاکانی چاپ."
  },
  {
    id: 65,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "فلتەری پاشماوە و ژاوەژاوی پەڕتووکی سکانکراو",
    titleEnglish: "Artifact & Scanning Noise Filter",
    systemDirective: "پاککردنەوەی ژمارەی لاپەڕەی دووبارە، سەرپەڕە، ژێرپەڕە و خاڵە ناڕوونەکانی سکان."
  },
  {
    id: 66,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "گۆڕینی ڕۆژژمێرە مێژووییەکان (کۆچی، هەتاوی، زایینی)",
    titleEnglish: "Historical Calendar Converter (Hijri, Solar, Gregorian, Kurdish)",
    systemDirective: "گۆڕینی خودکاری بەرواری کۆچی مانگی و هەتاوی بۆ زایینی و ڕۆژژمێری فەرمیی کوردی."
  },
  {
    id: 67,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "هاوتاکردنی ناوی شوێنە کۆن و عوسمانییەکان بە ناوی ئەمڕۆ",
    titleEnglish: "Historical & Ottoman Toponym Modernizer",
    systemDirective: "ڕوونکردنەوەی ناوی شوێنە مێژووییەکان لە پەراوێز بە ناوی جوگرافیی هاوچەرخ."
  },
  {
    id: 68,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "وەرگێڕی ئەکادیمی بە هێشتنەوەی دەقی ئەسڵیی بیانی",
    titleEnglish: "Academic Translation Helper with Source Text Retention",
    systemDirective: "وەرگێڕانی تێروتەسەلی وتەزا بیانییەکان هاوکات لەگەڵ دانانی دەقی ئەسڵی لە پەراوێزدا."
  },
  {
    id: 69,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "ستانداردسازەری یونی کۆد (Unicode NFKC Normalization)",
    titleEnglish: "Strict Unicode NFKC Normalization & Search Bounding",
    systemDirective: "ڕێگری لە کێشەی فۆنت و کۆدەکانی یوونیکۆد لە گەڕان و هێنانەوەی سەرچاوەکاندا."
  },
  {
    id: 70,
    column: "VII",
    columnTitleKurdish: "بەدیجیتاڵکردنی دەستنووس، OCR و گەڕانی فرە-ئەرشیڤ",
    columnTitleEnglish: "Manuscript Digitization, OCR & Multi-Archival Search",
    titleKurdish: "هاوکاتکردنی دوولایەنە لەگەڵ گووگڵ درایڤ (Google Drive Sync)",
    titleEnglish: "Bi-directional Google Drive Cloud Storage & Sync",
    systemDirective: "پاراستنی هەموو ڕەشنووس، سەرچاوە و بەڵگەکان لە کڵاودی پارێزراودا."
  },

  // COLUMN VIII: VIVA DEFENSE SIMULATION & ACADEMIC EVALUATION (Points 71-80)
  {
    id: 71,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "هاوشێوەکەری ٤ ئەندامەکەی لێژنەی تاوتوێکردن",
    titleEnglish: "4-Member Viva Committee Simulation (Chair, Methodologist, Linguist, Expert)",
    systemDirective: "بەشداریکردنی سەرۆکی لێژنە، شارەزای میتۆد، پسپۆڕی زمان و زانای بابەتەکە لە تاقیکردنەوەی توێژەردا."
  },
  {
    id: 72,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "دیبەیت و گفتوگۆی دەنگیی ڕاستەوخۆ (Gemini Live API WebSocket)",
    titleEnglish: "Real-time Voice Discussions via WebSocket Live API",
    systemDirective: "ئەنجامدانی پرسیار و وەڵامی دەنگیی زیندوو بە زمانی کوردی لە کاتی ئامادەکاری بۆ تاوتوێکردن."
  },
  {
    id: 73,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "دۆزەرەوەی کەلێن و لاوازییە پەلاماردراوەکانی تێز",
    titleEnglish: "Structural Vulnerability Detector for Defense",
    systemDirective: "ئاگادارکردنەوەی پێشوەختە لەو خاڵانەی کە لێژنە ڕەخنەی توندیان لێ دەگرێت."
  },
  {
    id: 74,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "خشتەی فەرمیی وەڵامدانەوەی تێبینییەکانی هەڵسەنگێنەر",
    titleEnglish: "Official Reviewer Response Matrix (Comment -> Action -> Page)",
    systemDirective: "ئامادەکردنی خشتەی فەرمیی چاکسازییەکان بۆ پێشکەشکردن بە لێژنەی زانستی."
  },
  {
    id: 75,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "پشکنەری سەرپێچی و لێکچوونی دەق (Similarity & Plagiarism Check)",
    titleEnglish: "Plagiarism & Semantic Similarity Analysis",
    systemDirective: "پشکنینی لێکچوونی دەق و دڵنیابوون لە دەرچوونی تێز لە پێوەرەکانی زانکۆ (کەمتر لە ٢٠٪)."
  },
  {
    id: 76,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "هەڵسەنگاندنی تێز بە ڕوبەریکی پێنج-خاڵی (5-Point Rubric)",
    titleEnglish: "Manuscript 5-Point Rubric Evaluation",
    systemDirective: "نمرەدان بە تێز لەسەر: ڕوونی، گرنگی، ڕەسەنایەتی میتۆد، گونجاویی سەرچاوە و زمانی ئەکادیمی."
  },
  {
    id: 77,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "داڕێژەری خیتابی ٢٠ خولەکیی خوێندکار لە بەرگریدا",
    titleEnglish: "Structured 20-minute Student Viva Presentation Script",
    systemDirective: "ئامادەکردنی دەقی فەرمیی پێشکەشکردنی تێز بۆ دەستپێکی دانیشتنی بەرگری."
  },
  {
    id: 78,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "گۆڕینی بەشەکانی تێز بۆ سلایدەکانی پرێزێنتەیشن",
    titleEnglish: "Thesis Chapters to Academic Slide Deck Structure",
    systemDirective: "پوختەکردنی تێز بۆ خاڵە سەرەکییە کورتەکانی سلاید بە پێوەری ئەکادیمی."
  },
  {
    id: 79,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "چێکلیستی تەواوکاریی پێش پێشکەشکردنی کۆتایی",
    titleEnglish: "Pre-submission Completeness Checklist",
    systemDirective: "دڵنیابوون لە نەبوونی هیچ بەش، پەراوێز، فەرهەنگۆک یان سوپاسنامەیەکی کەم لە نامەکەدا."
  },
  {
    id: 80,
    column: "VIII",
    columnTitleKurdish: "هاوشێوەکردنی دانیشتنی بەرگری (Viva) و هەڵسەنگاندن",
    columnTitleEnglish: "Viva Defense Simulation & Academic Evaluation",
    titleKurdish: "ڕاپۆرتی بێلایەنیی ئەکادیمی و پێداچوونەوەی ڕەخنەیی",
    titleEnglish: "Academic Neutrality & Unbiased Evaluation Report",
    systemDirective: "پشکنینی نەهێشتنی سۆز، بیروڕای شەخسی یان قسەی پێشوەختە سەلمێنراو لە دەقدا."
  },

  // COLUMN IX: PUBLICATION, TYPESETTING & EXPORT SUITE (Points 81-90)
  {
    id: 81,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "کۆمپایلەری پاکیزەی XeLaTeX بە فۆنتی ڕەسەنی کوردی",
    titleEnglish: "Clean XeLaTeX Manuscripts with RTL & Kurdish Fonts",
    systemDirective: "ئامادەکردنی کۆدی تەواوی LaTeX بە پاکێجی bidi و xepersian و فۆنتە کوردییەکان."
  },
  {
    id: 82,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "هەناردەی فەرمیی پەڕگەی DOCX بە پێڕست و پەراوێزەوە",
    titleEnglish: "Professional DOCX Export via docx Engine",
    systemDirective: "هەناردەکردنی ڕاستەوخۆ بە فۆرماتی Word بە هەموو ستایلی ناونیشان و لاپەڕە و پەراوێزەکانەوە."
  },
  {
    id: 83,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "ستانداردی زانکۆ گەورەکانی کوردستان (سەلاحەدین، سلێمانی، دهۆک، سۆران)",
    titleEnglish: "Kurdish Universities Styleguides (Salahaddin, Sulaimani, Duhok, Soran)",
    systemDirective: "جێبەجێکردنی حەجم، حاشیە، شێوازی فۆنت و دابەشکاری بەپێی ڕێنمایی فەرمیی هەر زانکۆیەک."
  },
  {
    id: 84,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "پێڕستی خودکاری ناوەڕۆک، خشتەکان و وێنەکان",
    titleEnglish: "Automated TOC, Figures, and Tables Lists with Page Markers",
    systemDirective: "دروستکردنی خشتەی پێڕستی تەواو بە ژمارەی لاپەڕەی ڕاستەقینەوە."
  },
  {
    id: 85,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "پوختەی سێ-زمانی (کوردی، عەرەبی، ئینگلیزی) لەگەڵ وشەی کلیل",
    titleEnglish: "Trilingual Abstract Package (Kurdish, Arabic, English)",
    systemDirective: "داڕشتنی پوختەی ئەکادیمیی هاوسەنگ بە ٣ زمانی فەرمی لەگەڵ کلیلەوشەکانی پێوانەکراو."
  },
  {
    id: 86,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "پاکێجی پێشکەشکردن بۆ گۆڤارە نێودەوڵەتییەکان (Scopus / Clarivate)",
    titleEnglish: "International Journal Submission Package & Cover Letter",
    systemDirective: "داڕشتنی نامەی هاوپێچ (Cover Letter) و ئامادەکردنی وتار بەپێی ستانداردەکانی سکۆپەس."
  },
  {
    id: 87,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "ئیندێکسی ئەلفبێیی چەمک، شوێن و ناوی تایبەت",
    titleEnglish: "Alphabetical Index of Terms, Proper Names, and Places",
    systemDirective: "پێڕستکردنی سەرجەم ناو و زاراوە بەکارهاتووەکان لە کۆتایی نامەکە بەپێی ئەلفوبێ."
  },
  {
    id: 88,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "مۆری کریپتۆگرافیی SHA-256 بۆ پاراستنی مافی دەق",
    titleEnglish: "Cryptographic SHA-256 Manuscript Fingerprint",
    systemDirective: "تۆمارکردنی مۆری دیجیتاڵی بۆ مسۆگەرکردنی ئەوەی دەقەکە دەستکاری نەکراوە."
  },
  {
    id: 89,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "بینەری بەراوردکاریی گۆڕانکاریی نێوان ڕەشنووسەکان (Version Diff)",
    titleEnglish: "Visual Version Diff Viewer",
    systemDirective: "پیشاندانی خاڵە زیادکراو و سڕاوەکان لە نێوان پێداچوونەوە یەک لە دوای یەکەکاندا."
  },
  {
    id: 90,
    column: "IX",
    columnTitleKurdish: "بڵاوکردنەوە، پەیجکردن و هەناردەکردن",
    columnTitleEnglish: "Publication, Typesetting & Export Suite",
    titleKurdish: "مۆدی خوێندنەوەی بێ دەنگەدەنگ و پەڕتووکیی تێز",
    titleEnglish: "Distraction-Free Book-Style Reading Mode",
    systemDirective: "پیشاندانی پەڕتووک لە قاڵبی چاپی فەرمی بە ڕووناکی و تاریکیی ئەکادیمی."
  },

  // COLUMN X: ENTERPRISE INFRASTRUCTURE & SELF-EVOLUTION (Points 91-100)
  {
    id: 91,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "سێرڤەری گەیتکیپەری خێرا و جیاکردنەوەی کاشی /tmp",
    titleEnglish: "Sub-50ms Instant Gatekeeper & /tmp Cache Isolation",
    systemDirective: "پاراستنی تەواوەتی لە کێشەکانی هاوبەشکردن بە گواستنەوەی هەموو کاشەکان بۆ /tmp/mam-ng-cache."
  },
  {
    id: 92,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "هەڵگرتنی سێ-ئاستی (IndexedDB + Firestore + PostgreSQL)",
    titleEnglish: "Hybrid Triple-Tier Storage Resilience",
    systemDirective: "مسۆگەرکردنی پاراستنی دەقەکان هەم لەسەر براوسەر و هەم لە داتابەیسی هەور بەبێ وەستان."
  },
  {
    id: 93,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "سوڕانەوەی ژیرانەی کلیلی API و ڕزگاربوون لە ڕیت-لیمیت",
    titleEnglish: "Intelligent API Key Rotation & Rate-Limit Failover",
    systemDirective: "چارەسەری خودکاری کێشەی 429 و پاراستنی بەردەوامیی پەیوەندی بە جیمینی."
  },
  {
    id: 94,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "دابەشکردنی داینامیکی بودجەی بیرکردنەوە (Gemini 2.5 Pro vs Flash)",
    titleEnglish: "Dynamic Reasoning Budget Allocation",
    systemDirective: "تەرخانکردنی مۆدێلی قووڵبیری (Deep Thinking) بۆ بەشە سەختەکان و Flash بۆ کەرەستە خێراکان."
  },
  {
    id: 95,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "میدڵوێری پاراستن لە هێرشی پڕۆمپت ئینجێکشن",
    titleEnglish: "Robust Prompt Injection Sanitization Middleware",
    systemDirective: "پشکنینی هەموو سەرچاوە و فۆرمەکان بۆ ڕێگری لە دەستکاریی فەرمانە سەرەکییەکان."
  },
  {
    id: 96,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "پاراستنی دەرەوە لە هێرشەکانی SSRF و IPی تایبەت",
    titleEnglish: "Strict SSRF-Aware Outbound Fetching & Loopback Blocking",
    systemDirective: "بلۆککردنی پەیوەندی بە 127.0.0.1 و ڕایەڵە ناوخۆییەکان لە داواکارییە دەرەکییەکاندا."
  },
  {
    id: 97,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "پاراستنی ئاستی دەسەڵات بە ڕۆڵ (RBAC) لە Firestore",
    titleEnglish: "Precise Role-Based Access Control (RBAC) in Firestore Rules",
    systemDirective: "جیاکردنەوەی مافی خوێندکار، سەرپەرشتیار، هەڵسەنگێنەر و بەڕێوەبەری سیستەم."
  },
  {
    id: 98,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "نیشاندەری کاتی ڕاستەقینەی پێشکەوتن و تێلێمێتری",
    titleEnglish: "Real-time Telemetry & Live Progress Reporting",
    systemDirective: "پیشاندانی کات، خێرایی، وشەکانی نووسراو و ڕێژەی سەدی بە زیندوویی بۆ بەکارهێنەر."
  },
  {
    id: 99,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "تۆماری خۆ-پەرەپێدەر و وەرگری توانستە نوێیەکان",
    titleEnglish: "Live Auto-Evolution Capability Registry",
    systemDirective: "وەرگرتنی خودکاری هەموو نوێکارییە فەرمییەکانی مۆدێلەکان و ڕێساکانی AI Studio."
  },
  {
    id: 100,
    column: "X",
    columnTitleKurdish: "ژێرخانی پێشکەوتوو و خۆ-پەرەپێدانی بەردەوام",
    columnTitleEnglish: "Enterprise Infrastructure & Self-Evolution",
    titleKurdish: "دەروازەی پاراستنی تەلارسازی و یەکپارچەیی پڕۆژە",
    titleEnglish: "Architectural Preservation & Zero-Regression Verification Gate",
    systemDirective: "دڵنیابوون لەوەی ٦٣٦ پەڕگەی پڕۆژەکە بە تەواوەتی دەپارێزرێن و بەبێ هیچ هەڵەیەکی کۆمپایلەر دەمێننەوە."
  }
];

/**
 * Returns a high-density, authoritative academic prompt directive containing all 100 capabilities
 * formatted to guide WriterAgent, BlueprintAgent, and citation synthesis.
 */
export function getHundredPointsAcademicDirective(): string {
  const groups: Record<string, AcademicPointDefinition[]> = {};
  for (const pt of HUNDRED_ACADEMIC_POINTS) {
    if (!groups[pt.column]) groups[pt.column] = [];
    groups[pt.column].push(pt);
  }

  let text = "\n[شۆڕشی ١٠٠ خاڵیی ئەکادیمی و پێوەرە زانستییەکانی مام پڕۆفیسۆر - THE 100-POINT ACADEMIC CONSTITUTION]:\n";
  for (const [col, pts] of Object.entries(groups)) {
    const colName = pts[0]?.columnTitleKurdish || col;
    text += `\n### تەوەرەی ${col}: ${colName}\n`;
    for (const p of pts) {
      text += `* خاڵی ${p.id}. ${p.titleKurdish} (${p.titleEnglish}): ${p.systemDirective}\n`;
    }
  }
  return text;
}
