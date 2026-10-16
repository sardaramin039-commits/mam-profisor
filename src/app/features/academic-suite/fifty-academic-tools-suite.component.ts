import { Component, ChangeDetectionStrategy, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { KurdishAcademicDictationComponent } from './kurdish-academic-dictation.component';
import { KurdishTerminologyManagerComponent } from './kurdish-terminology-manager.component';
import { AcademicCitationHubComponent } from './academic-citation-hub.component';
import { CitationStandardsGuideComponent } from './citation-standards-guide.component';
import { ThesisStructureOrganizerComponent } from './thesis-structure-organizer.component';
import { DynamicBookOutlineDesignerComponent } from './dynamic-book-outline-designer.component';
import { BibliographicReferenceFormatterComponent } from './bibliographic-reference-formatter.component';
import { AcademicIndexSearchComponent } from './academic-index-search.component';
import { DialecticalThesisEngineComponent } from './dialectical-thesis-engine.component';
import { AcademicPlagiarismCheckerComponent } from './academic-plagiarism-checker.component';
import { AcademicResearchArchitectureComponent } from './academic-research-architecture.component';
import { InTextCitationPrompterComponent } from './in-text-citation-prompter.component';
import { ProjectCitationManagerComponent } from './project-citation-manager.component';
import { AdvancedAcademicSearchComponent } from './advanced-academic-search.component';
import { ThesisDefenseSimulatorComponent } from './thesis-defense-simulator.component';
import { ThesisAppendicesGeneratorComponent } from './thesis-appendices-generator.component';
import { UniversityLayoutFormatterComponent } from './university-layout-formatter.component';
import { AcademicToneAnalyzerComponent } from './academic-tone-analyzer.component';
import { ChapterItemModel as ChapterItem } from '../../domain/models';

export interface EssentialAcademicTool {
  id: number;
  nameKurdish: string;
  nameEnglish: string;
  category: 'methodology' | 'writing_voice' | 'citations' | 'language_orthography' | 'defense_publishing';
  icon: string;
  description: string;
  practicalValue: string;
}

const FIFTY_TOOLS_DATA: EssentialAcademicTool[] = [
  // 1-10: Methodology & Sampling
  { id: 1, nameKurdish: 'ژمێرەری قەبارەی نموونە', nameEnglish: 'Sample Size Calculator', category: 'methodology', icon: 'calculate', description: 'ئەژمارکردنی نموونە بە هاوکێشەی یامانی و کۆکران.', practicalValue: 'دیاریکردنی زانستیی نموونەی بەشداربووان لە بەشی ٣.' },
  { id: 2, nameKurdish: 'ڕێکخەری پێکهاتەی ٥ بەشی تێز', nameEnglish: 'Thesis Structure Organizer', category: 'methodology', icon: 'account_tree', description: 'داڕشتنی لۆژیکی سەرجەم تەوەر و بڕگەکانی نامە.', practicalValue: 'ڕێگری لە پەڕاندنی توخمە بنەڕەتییەکانی تێز.' },
  { id: 3, nameKurdish: 'پشکنەری گریمانەی زانستی', nameEnglish: 'Hypothesis Rigor Screener', category: 'methodology', icon: 'science', description: 'دارشتن و جیاکردنەوەی گریمانەی سفر (H0) و ئاراستەدار (H1).', practicalValue: 'دڵنیابوون لە پێوانەپێکراوی و سەلمێنەری گریمانە.' },
  { id: 4, nameKurdish: 'سێگۆشەسازیی بەڵگە و داتا', nameEnglish: 'Data Triangulation Matrix', category: 'methodology', icon: 'change_history', description: 'پشکنینی فرە-ئاراستەی نێوان ڕاپرسی و چاوپێکەوتن.', practicalValue: 'بەرزکردنەوەی باوەڕپێکراوی و هاوسەنگیی توێژینەوە.' },
  { id: 5, nameKurdish: 'دارێژەری پرسیارنامەی لیکەرت', nameEnglish: 'Likert Scale Questionnaire Builder', category: 'methodology', icon: 'quiz', description: 'دروستکردنی پرسیارنامەی ٥ خاڵی بۆ توێژینەوەی مەیدانی.', practicalValue: 'ئامادەکردنی پرسیارەکان بە پێوەری زانستی.' },
  { id: 6, nameKurdish: 'ئەژمارکەری جێگیریی کڕۆنباخ ئەلفا', nameEnglish: 'Cronbach Alpha Reliability Estimator', category: 'methodology', icon: 'straighten', description: 'خەمڵاندنی یەکگرتوویی ناوەکیی بڕگەکانی پێوانەکردن.', practicalValue: 'مسۆگەرکردنی ئاستی متمانەی کەرەستەی توێژینەوە.' },
  { id: 7, nameKurdish: 'ماتریکسی کاتیی گانتی توێژینەوە', nameEnglish: 'Gantt Research Scheduler', category: 'methodology', icon: 'date_range', description: 'خشتەی زەمەنیی قۆناغەکانی نووسین و بەرگری.', practicalValue: 'ڕێگری لە درەنگکەوتنی وادەی کۆتایی تێز.' },
  { id: 8, nameKurdish: 'پشکنەری تێربوونی بیردۆزی', nameEnglish: 'Theoretical Saturation Monitor', category: 'methodology', icon: 'donut_large', description: 'پێوانەی خاڵی وەستانی کۆکردنەوەی زانیاریی چۆنایەتی.', practicalValue: 'دیاریکردنی بەسیەتی چاوپێکەوتنەکان.' },
  { id: 9, nameKurdish: 'چێکلیستی ئەخلاقی توێژینەوە (IRB)', nameEnglish: 'Research Ethics Checklist', category: 'methodology', icon: 'gavel', description: 'بەڵگەنامەی ڕەزامەندیی بەشداربووان و پاراستنی نهێنی.', practicalValue: 'وەرگرتنی ڕەزامەندیی فەرمیی لێژنەی ئەخلاقی.' },
  { id: 10, nameKurdish: 'نەخشەی گۆڕاوە سەربەخۆ و پەیوەستەکان', nameEnglish: 'Variable Operationalization Map', category: 'methodology', icon: 'hub', description: 'پێناسەکردنی کارپێکراوی (Operational) گۆڕاوەکان.', practicalValue: 'گۆڕینی چەمکی تیۆری بۆ داتای پێوانەکراو.' },

  // 11-20: Voice, Dictation & Writing Acceleration
  { id: 11, nameKurdish: 'دەنگنووسی ئەکادیمی بە کوردی', nameEnglish: 'Kurdish Academic Voice Dictation', category: 'writing_voice', icon: 'mic', description: 'تۆمارکردنی دەنگیی تێبینی و دەق بەبێ دەست.', practicalValue: 'خێراکردنی نووسین و داڕشتنی ڕاستەوخۆ.' },
  { id: 12, nameKurdish: 'پارافڕەیزەری زانستیی کوردی', nameEnglish: 'Academic Paraphrasing Tool', category: 'writing_voice', icon: 'autorenew', description: 'داڕشتنەوەی دەق بە وشە و ڕستەسازیی پڕ لە سەنگینی.', practicalValue: 'نەهێشتنی دەربڕینی هەڵە و ڕۆژنامەنووسی.' },
  { id: 13, nameKurdish: 'کۆنکتەری پەیوەندیی دەقی ئەکادیمی', nameEnglish: 'Logical Transitions Connector', category: 'writing_voice', icon: 'link', description: 'پێشنیارکردنی ئامرازەکانی پەیوەستکردنی پاراگرافەکان.', practicalValue: 'ڕەوانکردنی تەوژمی خوێندنەوەی توێژینەوە.' },
  { id: 14, nameKurdish: 'کورتکەرەوەی پێداچوونەوەی ئەدەبیات', nameEnglish: 'Literature Review Synthesizer', category: 'writing_voice', icon: 'short_text', description: 'پوختەکردنی دەیان وتار لە یەک پاراگرافی بەراوردکاری.', practicalValue: 'پوختەکردنی سەرچاوە زۆرەکان لە بەشی ٢.' },
  { id: 15, nameKurdish: 'دیاریکەری دەنگی نادیار (Passive Voice)', nameEnglish: 'Scholarly Voice Calibrator', category: 'writing_voice', icon: 'record_voice_over', description: 'ڕێکخستنی دەربڕینی بێلایەن بەپێی نەریتی ئەکادیمی.', practicalValue: 'دوورکەوتنەوە لە دەستەواژەی تاکەکەسی (من پێم وایە).' },
  { id: 16, nameKurdish: 'دارێژەری پوختەی ستانداردی IMRAD', nameEnglish: 'IMRAD Abstract Structurer', category: 'writing_voice', icon: 'subject', description: 'پێکهێنانی پوختەی ٢٥٠ وشەیی چواربەشی.', practicalValue: 'ئامادەکردنی پوختە بۆ گۆڤارە نێودەوڵەتییەکان.' },
  { id: 17, nameKurdish: 'پوختەکردنی بۆشایی زانستی', nameEnglish: 'Research Gap Statement Formulator', category: 'writing_voice', icon: 'center_focus_strong', description: 'داڕشتنی ئەو خاڵەی کە توێژینەوەکەت پڕی دەکاتەوە.', practicalValue: 'سەلماندنی گرنگیی توێژینەوە بۆ سەرپەرشتیار.' },
  { id: 18, nameKurdish: 'خاوێنکەری پەیکەری پەرەگراف', nameEnglish: 'Paragraph Unity & Coherence Checker', category: 'writing_voice', icon: 'view_agenda', description: 'پشکنینی هەبوونی یەک بیرۆکە لە هەر پەرەگرافێکدا.', practicalValue: 'ڕێگری لە تێکەڵبوونی بابەتەکان.' },
  { id: 19, nameKurdish: 'دروستکەری ناونیشانی سێ-توخمی', nameEnglish: 'Tripartite Thesis Title Builder', category: 'writing_voice', icon: 'title', description: 'داڕشتنی ناونیشان بەپێی: بابەتی سەرەکی + سنوور + کەرەستە.', practicalValue: 'دەستکەوتنی ناونیشانی پەسەندکراو لە بەش.' },
  { id: 20, nameKurdish: 'پشکنەری درێژدادی و وڕێنەی دەق', nameEnglish: 'Verbosity & Fluff Eliminator', category: 'writing_voice', icon: 'content_cut', description: 'سڕینەوەی وشە زیادە و ناپێویستەکان لە دەقدا.', practicalValue: 'کەمکردنەوەی قەبارە و چڕکردنەوەی مانا.' },

  // 21-30: Citations & Source Verification
  { id: 21, nameKurdish: 'هاوردەکاری DOI و Crossref', nameEnglish: 'Crossref DOI Metadata Importer', category: 'citations', icon: 'format_quote', description: 'هاوردەکردنی زانیاریی سەرچاوە ڕاستەوخۆ بە DOI.', practicalValue: 'دڵنیابوون لە دروستیی زانیاریی پەڕتووک و وتار.' },
  { id: 22, nameKurdish: 'ڕێنوێنی و بنەماکانی ژێدەرەکان', nameEnglish: 'Citation Standards & Ethics Guide', category: 'citations', icon: 'verified', description: 'ڕێساکانی کەوانە، پەراوێز، و ڕێگری لە دزینی ئەدەبی.', practicalValue: 'بەرزکردنەوەی ڕەسەنایەتیی توێژینەوە.' },
  { id: 23, nameKurdish: 'داڕێژەری سەرچاوەی کوردی (APA 7th)', nameEnglish: 'Kurdish APA 7th Reference Engine', category: 'citations', icon: 'library_books', description: 'ڕێکخستنی پیتەکانی پێڕستی سەرچاوە بە ئەلفوبێی کوردی.', practicalValue: 'ئامادەکردنی فەرمیی پێڕستی کۆتایی نامە.' },
  { id: 24, nameKurdish: 'پشکنەری بەستەری ئەلیکترۆنی (URL/DOI)', nameEnglish: 'Live Link & DOI Health Checker', category: 'citations', icon: 'link_off', description: 'دڵنیابوون لە کارکردنی بەستەرەکانی ناو سەرچاوەکان.', practicalValue: 'ڕێگری لە بەستەری شکاو لە بەردەم لێژنە.' },
  { id: 25, nameKurdish: 'بەڕێوەبەری سەرچاوەی دەستنووس و ئەرشیڤ', nameEnglish: 'Archival & Manuscript Reference Tool', category: 'citations', icon: 'history_edu', description: 'تۆمارکردنی بەڵگەنامەی مێژوویی و دەستنووسە کوردییەکان.', practicalValue: 'بەڵگەسازیی مێژوویی لەسەر بنەمای زانستی.' },
  { id: 26, nameKurdish: 'سەرچاوەسازیی چاوپێکەوتنی زارەکی', nameEnglish: 'Oral History & Interview Citation Generator', category: 'citations', icon: 'record_voice_over', description: 'داڕشتنی ئاماژەی چاوپێکەوتن بە کۆدی تایبەت.', practicalValue: 'پاراستنی نهێنی و ڕەوایی وتووێژەکان.' },
  { id: 27, nameKurdish: 'هاوتاکەری ئاماژەی ناو دەق و پێڕست', nameEnglish: 'In-text to Bibliography Cross-Matcher', category: 'citations', icon: 'sync_alt', description: 'پشکنینی ئەوەی هەر سەرچاوەیەک لە دەقدا هەیە لە پێڕستیشدا هەبێت.', practicalValue: 'نەهێشتنی سەرچاوەی لەبیرچوو.' },
  { id: 28, nameKurdish: 'دابەشکەری سەرچاوە بەپێی زمان', nameEnglish: 'Multilingual Source Categorizer', category: 'citations', icon: 'language', description: 'جیاکردنەوەی سەرچاوەی کوردی، عەرەبی، و بیانی بە شێوازی یاسایی.', practicalValue: 'پەیڕەوکردنی شێوازی پەسەندکراوی زانکۆکان.' },
  { id: 29, nameKurdish: 'پشکنەری نوێبوونی سەرچاوەکان (یاسای ٥ ساڵ)', nameEnglish: 'Literature Recency Auditor', category: 'citations', icon: 'event_available', description: 'ئەژمارکردنی ڕێژەی سەدیی ئەو سەرچاوەی لە ٥ ساڵی ڕابردوودان.', practicalValue: 'بەدەستهێنانی نمرەی بەرزی نوێبوونی زانیاری.' },
  { id: 30, nameKurdish: 'هەناردەی فایلی BibTeX و RIS', nameEnglish: 'BibTeX & RIS Citation Exporter', category: 'citations', icon: 'file_download', description: 'هەناردەکردنی سەرچاوەکان بۆ بەرنامەکانی EndNote و Mendeley.', practicalValue: 'هاوبەشکردنی سەرچاوەکان لەگەڵ تیم و گۆڤار.' },

  // 31-40: Terminology & Orthography
  { id: 31, nameKurdish: 'بانکی زاراوەسازیی ئەکادیمی', nameEnglish: 'Academic Terminology Bank', category: 'language_orthography', icon: 'translate', description: 'کۆگای دەوڵەمەندی زاراوەی کوردی لەگەڵ هاوتای ئینگلیزی.', practicalValue: 'یەکگرتووکردنی بەکارهێنانی زاراوەکان.' },
  { id: 32, nameKurdish: 'ڕاستکەرەوەی هێڵی نیوە-بۆشایی (ZWNJ)', nameEnglish: 'Zero-Width Non-Joiner (ZWNJ) Normalizer', category: 'language_orthography', icon: 'space_bar', description: 'ڕێکخستنی پیتی «ەی، یان، یەوە، یەکە» بە نیوە-بۆشایی.', practicalValue: 'پاکی و جوانیی ڕێنووس بەپێی ستاندارد.' },
  { id: 33, nameKurdish: 'گۆڕەری ژمارەی کوردی-لاتینی', nameEnglish: 'Eastern-Western Arabic Numerals Unifier', category: 'language_orthography', icon: 'pin', description: 'یەکخستنی تەواوی ژمارە و ساڵەکان لە دەقدا بە یەک شێواز.', practicalValue: 'ڕێگری لە تێکەڵبوونی شێوازی نووسینی ژمارەکان.' },
  { id: 34, nameKurdish: 'پشکنەری پیتی کوردی بەرامبەر عەرەبی', nameEnglish: 'Kurdish Unicode Characters Validator', category: 'language_orthography', icon: 'spellcheck', description: 'گۆڕینی (ی، ك)ی عەرەبی بۆ (ی، ک)ی دروستی کوردی.', practicalValue: 'نەهێشتنی هەڵەی گەڕان و چاپ لە ناو توێژینەوە.' },
  { id: 35, nameKurdish: 'وشەنامەی دەستەواژە لاتینییەکان', nameEnglish: 'Latin Abbreviations in Kurdish Guide', category: 'language_orthography', icon: 'menu_book', description: 'ڕوونکردنەوەی et al.، ibid.، op. cit.، e.g.، i.e.', practicalValue: 'بەکارهێنانی دروستی کورتکراوە نێودەوڵەتییەکان.' },
  { id: 36, nameKurdish: 'ڕێنوێنی نووسینی ناوی کەسایەتی بیانی', nameEnglish: 'Foreign Names Kurdish Transliteration', category: 'language_orthography', icon: 'badge', description: 'ڕێساکانی نووسینی ناوی زانایان (وەک کانت، فۆکۆ، یامانی).', practicalValue: 'ڕێگری لە شێواندنی ناوی بیرمەندە بیانییەکان.' },
  { id: 37, nameKurdish: 'پشکنەری بەستەرە ڕێزمانییەکان (وە، دا، لەگەڵ)', nameEnglish: 'Kurdish Preposition & Clitic Screener', category: 'language_orthography', icon: 'rule', description: 'چاککردنی لکاندن و جیاکردنەوەی ئامرازەکانی پەیوەندی.', practicalValue: 'بەرزکردنەوەی نمرەی پشکنەری زمانەوانیی تێز.' },
  { id: 38, nameKurdish: 'دروستکەری پێڕستی هێما و کورتکراوەکان', nameEnglish: 'List of Abbreviations & Acronyms Builder', category: 'language_orthography', icon: 'sort_by_alpha', description: 'کۆکردنەوەی خۆکاری کورتکراوەکان لە سەرەتای تێزدا.', practicalValue: 'ئامادەکردنی لاپەڕەی فەرمیی کورتکراوەکان.' },
  { id: 39, nameKurdish: 'ڕێکخەری خاڵبەندیی دەقی ئەکادیمی', nameEnglish: 'Academic Punctuation Formatter', category: 'language_orthography', icon: 'format_clear', description: 'ڕێکخستنی شوێنی فاریزە، خاڵ، و دووخاڵ بە ڕێکی.', practicalValue: 'پێدانی سیمایەکی فەرمی بە لاپەڕەکانی پەڕتووک.' },
  { id: 40, nameKurdish: 'هاوتاکەری زاراوەی MeSH و ERIC', nameEnglish: 'Thesaurus Indexing & MeSH Keyword Matcher', category: 'language_orthography', icon: 'manage_search', description: 'پشکنینی کلیلەوشەکان لەگەڵ پێڕستە جیهانییەکان.', practicalValue: 'بەرزکردنەوەی خوێندنەوە و ئاماژەپێدان (Citations).' },

  // 41-50: Thesis Defense & Viva Simulation
  { id: 41, nameKurdish: 'سیمولەیتەری بەرگری و وتووێژی تێز (Viva)', nameEnglish: 'PhD / Master Viva Defense Simulator', category: 'defense_publishing', icon: 'psychology_alt', description: 'ڕووبەڕووبوونەوەی پرسیارە سەختەکانی لێژنەی تاوتوێکردن.', practicalValue: 'ئامادەکاریی تەواو و کەمکردنەوەی دڵەڕاوکێی بەرگری.' },
  { id: 42, nameKurdish: 'داڕێژەری سلایدەکانی پێشکەشکردن (PPT)', nameEnglish: '20-Minute Defense Slide Outline Architect', category: 'defense_publishing', icon: 'slideshow', description: 'نەخشەی دابەشکردنی سلایدەکان بۆ ٢٠ خولەکی بەرگری.', practicalValue: 'پێشکەشکردنی کورت و پڕ لە تەکنیک لە هۆڵدا.' },
  { id: 43, nameKurdish: 'بانکی پرسیارە تەقلیدییەکانی لێژنە', nameEnglish: 'Classic Viva Examiners Question Bank', category: 'defense_publishing', icon: 'live_help', description: '٥٠ باوترین پرسیاری لێژنەی زانستی لەسەر میتۆدۆلۆژیا.', practicalValue: 'ڕاهێنانی پێشوەختە لەسەر وەڵامدانەوەی لێزانانە.' },
  { id: 44, nameKurdish: 'داڕێژەری پێڕستی خشتە و وێنەکان', nameEnglish: 'List of Tables & Figures Generator', category: 'defense_publishing', icon: 'table_chart', description: 'ڕێکخستنی ژمارەی خشتەکان (وەک خشتەی ٤-١، ٤-٢).', practicalValue: 'داڕشتنی پەیڕەوی تەواوی بەرگە سەرەتاییەکان.' },
  { id: 45, nameKurdish: 'لاپەڕەی پێشەکی و سپاردنی فەرمی (ISBN)', nameEnglish: 'Preliminary Pages & Legal Deposit Template', category: 'defense_publishing', icon: 'local_library', description: 'پەڕەی بەناوی خوا، بڕیاری لێژنە، سوپاس و پێشکەشکردن.', practicalValue: 'ئامادەکردنی بەڵگەنامە فەرمییەکان بۆ چاپخانە.' },
  { id: 46, nameKurdish: 'ڕێکخەری پاشکۆ و نوسراوە فەرمییەکان', nameEnglish: 'Appendices & Official Permissions Organizer', category: 'defense_publishing', icon: 'attach_file', description: 'کۆکردنەوەی نووسراوی زانکۆ و وەزارەتەکان وەک پاشکۆ.', practicalValue: 'سەلماندنی مۆڵەتی فەرمیی ئەنجامدانی توێژینەوە.' },
  { id: 47, nameKurdish: 'پشکنەری ڕێژەی دزینی ئەدەبی (Similarity)', nameEnglish: 'Turnitin Similarity Safe-Zone Guide', category: 'defense_publishing', icon: 'policy', description: 'ڕێنمایی گەیشتن بە ڕێژەی خوار ١٥٪ی یاسایی.', practicalValue: 'ڕێگری لە ڕەتکرانەوەی تێز لە پشکنینی زانکۆ.' },
  { id: 48, nameKurdish: 'داڕێژەری وەڵامدانەوەی پێداچوونەوە (Reviewer)', nameEnglish: 'Response to Reviewers Matrix', category: 'defense_publishing', icon: 'feedback', description: 'خشتەی پۆلینکردنی تێبینییەکانی سەرپەرشتیار و وەڵامدانەوە.', practicalValue: 'جێبەجێکردنی خێرای هەموو ڕاستکردنەوەکان.' },
  { id: 49, nameKurdish: 'ماتریسی ڕۆڵی نووسەران (CRediT System)', nameEnglish: 'Contributor Roles Taxonomy (CRediT) Form', category: 'defense_publishing', icon: 'groups', description: 'دیاریکردنی پشکی هەر توێژەرێک لە نووسین و شیکاری.', practicalValue: 'پابەندبوون بە مەرجی گۆڤارە جیهانییەکان.' },
  { id: 50, nameKurdish: 'هەناردەی فایلی چاپی کۆتایی (Camera-Ready)', nameEnglish: 'Camera-Ready PDF & Print Formatter', category: 'defense_publishing', icon: 'print', description: 'ڕێکخستنی قەبارەی لاپەڕە (B5/A4)، مارجن و ڕێڕەوی لاپەڕەکان.', practicalValue: 'داگرتنی بەرهەمی ئامادە بۆ ڕێکخستنی چاپخانە.' }
];

@Component({
  selector: 'app-fifty-academic-tools-suite',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    KurdishAcademicDictationComponent,
    KurdishTerminologyManagerComponent,
    AcademicCitationHubComponent,
    CitationStandardsGuideComponent,
    ThesisStructureOrganizerComponent,
    DynamicBookOutlineDesignerComponent,
    BibliographicReferenceFormatterComponent,
    AcademicIndexSearchComponent,
    DialecticalThesisEngineComponent,
    AcademicPlagiarismCheckerComponent,
    AcademicResearchArchitectureComponent,
    InTextCitationPrompterComponent,
    ProjectCitationManagerComponent,
    AdvancedAcademicSearchComponent,
    ThesisDefenseSimulatorComponent,
    ThesisAppendicesGeneratorComponent,
    UniversityLayoutFormatterComponent,
    AcademicToneAnalyzerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 text-right font-sans" dir="rtl">
      <!-- Grand Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div class="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-bold font-mono">
                50 Academic Tools Suite
              </span>
              <span class="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-mono font-bold">
                تەواوی ٥٠ ئامرازەکە چالاکن
              </span>
            </div>
            <h2 class="text-xl md:text-2xl font-black text-white tracking-tight">
              ناوەندی گەورەی ٥٠ ئامرازی بنەڕەتیی ئەکادیمی (مام پڕۆفیسۆر)
            </h2>
            <p class="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تەواوی کەرەستە و پێداویستییە گرنگەکانی توێژینەوەی زانستی، میتۆدۆلۆژیا، دەنگنووس، سەرچاوەسازی و بەرگری لە یەک شوێندا
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-center px-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800">
              <div class="text-xl font-bold font-mono text-indigo-400">٥٠</div>
              <div class="text-[10px] text-slate-400">ئامرازی فەرمی</div>
            </div>
            <div class="text-center px-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800">
              <div class="text-xl font-bold font-mono text-emerald-400">٥</div>
              <div class="text-[10px] text-slate-400">بەشی سەرەکی</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Feature Modules (Prominently Interactive) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            <mat-icon class="text-indigo-400 !text-base !w-4 !h-4">bolt</mat-icon>
            <span>ئامرازە ئەکادیمییە ڕاستەوخۆ کاراکراوەکان:</span>
          </h3>

          <!-- Module View Switcher -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button (click)="activeToolTab.set('all')"
                    [class]="activeToolTab() === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              هەموو مۆدیوڵەکان
            </button>
            <button (click)="activeToolTab.set('dialectics')"
                    [class]="activeToolTab() === 'dialectics' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              تێز، دژەتێز و سێنتێز
            </button>
            <button (click)="activeToolTab.set('indexes')"
                    [class]="activeToolTab() === 'indexes' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              OpenAlex & Crossref
            </button>
            <button (click)="activeToolTab.set('plagiarism')"
                    [class]="activeToolTab() === 'plagiarism' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              پشکنەری ڕەسەنایەتی
            </button>
            <button (click)="activeToolTab.set('architecture')"
                    [class]="activeToolTab() === 'architecture' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              هاوتەریبیی لۆژیک & MEAL
            </button>
            <button (click)="activeToolTab.set('outline_designer')"
                    [class]="activeToolTab() === 'outline_designer' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              پێڕستی داینامیکی
            </button>
            <button (click)="activeToolTab.set('formatter')"
                    [class]="activeToolTab() === 'formatter' ? 'bg-teal-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              Harvard & APA
            </button>
            <button (click)="activeToolTab.set('refiner')"
                    [class]="activeToolTab() === 'refiner' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              بژارکەری زاراوەسازی
            </button>
            <button (click)="activeToolTab.set('citation_linker')"
                    [class]="activeToolTab() === 'citation_linker' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              هاوپێچی ژێدەر
            </button>
            <button (click)="activeToolTab.set('citation_manager')"
                    [class]="activeToolTab() === 'citation_manager' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              بەڕێوەبەری سەرچاوە و PDF
            </button>
            <button (click)="activeToolTab.set('advanced_search')"
                    [class]="activeToolTab() === 'advanced_search' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-xl border border-slate-800 transition cursor-pointer shrink-0">
              گەڕانی پێشکەوتوو
            </button>
          </div>
        </div>

        @if (activeToolTab() === 'all' || activeToolTab() === 'dialectics') {
          @defer (on viewport) {
            <app-dialectical-thesis-engine [activeChapter]="activeChapter()"></app-dialectical-thesis-engine>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">ئامرازی تێز و دژەتێز خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'indexes') {
          @defer (on viewport) {
            <app-academic-index-search [activeChapter]="activeChapter()"></app-academic-index-search>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">ئامرازی OpenAlex و Crossref خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'plagiarism') {
          @defer (on viewport) {
            <app-academic-plagiarism-checker [activeChapter]="activeChapter()"></app-academic-plagiarism-checker>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">پشکنەری ڕەسەنایەتی خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'architecture') {
          @defer (on viewport) {
            <app-academic-research-architecture [activeChapter]="activeChapter()"></app-academic-research-architecture>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">هاوتەریبیی لۆژیک و MEAL خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'outline_designer') {
          @defer (on viewport) {
            <app-dynamic-book-outline-designer></app-dynamic-book-outline-designer>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">پێڕستی داینامیکی خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'formatter') {
          @defer (on viewport) {
            <app-bibliographic-reference-formatter [activeChapter]="activeChapter()"></app-bibliographic-reference-formatter>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">ڕێکخەری سەرچاوە خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'refiner') {
          @defer (on viewport) {
            <app-kurdish-terminology-manager [activeChapter]="activeChapter()"></app-kurdish-terminology-manager>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">بژارکەری زاراوەسازی خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'citation_linker') {
          @defer (on viewport) {
            <app-in-text-citation-prompter [activeChapter]="activeChapter()"></app-in-text-citation-prompter>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">هاوپێچی ژێدەر خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'citation_manager') {
          @defer (on viewport) {
            <app-project-citation-manager [activeChapter]="activeChapter()"></app-project-citation-manager>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">بەڕێوەبەری سەرچاوەکان خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'advanced_search') {
          @defer (on viewport) {
            <app-advanced-academic-search [activeChapter]="activeChapter()"></app-advanced-academic-search>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">گەڕانی پێشکەوتوو خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'defense_simulator') {
          @defer (on viewport) {
            <app-thesis-defense-simulator [chapters]="activeChapter() ? [activeChapter()!] : []"></app-thesis-defense-simulator>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">سیمولەیتەری بەرگری خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'uni_layout') {
          @defer (on viewport) {
            <app-university-layout-formatter></app-university-layout-formatter>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">پێوەرەکانی زانکۆ خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'appendices') {
          @defer (on viewport) {
            <app-thesis-appendices-generator [chapters]="activeChapter() ? [activeChapter()!] : []"></app-thesis-appendices-generator>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">دروستکەری پاشکۆکان خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'tone_analyzer') {
          @defer (on viewport) {
            <app-academic-tone-analyzer [chapters]="activeChapter() ? [activeChapter()!] : []"></app-academic-tone-analyzer>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">شیکەرەوەی تۆنی زانستی خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'dictation') {
          @defer (on viewport) {
            <app-kurdish-academic-dictation [activeChapter]="activeChapter()"></app-kurdish-academic-dictation>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">دەنگنووسی کوردی خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'citation_hub') {
          @defer (on viewport) {
            <app-academic-citation-hub [activeChapter]="activeChapter()"></app-academic-citation-hub>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">ناوەندی ژێدەر خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'citation_guide') {
          @defer (on viewport) {
            <app-citation-standards-guide></app-citation-standards-guide>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">ڕێبەری سەرچاوە خەریکی ئامادەبوونە...</div>
          }
        }

        @if (activeToolTab() === 'all' || activeToolTab() === 'structure_organizer') {
          @defer (on viewport) {
            <app-thesis-structure-organizer></app-thesis-structure-organizer>
          } @placeholder {
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-serif">پەیکەرسازی تێز خەریکی ئامادەبوونە...</div>
          }
        }
      </div>

      <!-- Full 50 Tools Master Grid -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <mat-icon class="text-indigo-400">apps</mat-icon>
            <h3 class="text-sm font-bold text-slate-100">
              پێڕستی تەواوی ٥٠ ئامرازە ئەکادیمییەکە بەپێی پۆلێنکردن
            </h3>
          </div>

          <!-- Category filter -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              (click)="selectedCategory.set('all')"
              [class]="selectedCategory() === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
              هەموو (٥٠)
            </button>
            <button
              (click)="selectedCategory.set('methodology')"
              [class]="selectedCategory() === 'methodology' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
              میتۆدۆلۆژیا و نموونە (١-١٠)
            </button>
            <button
              (click)="selectedCategory.set('writing_voice')"
              [class]="selectedCategory() === 'writing_voice' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
              دەنگ و نووسین (١١-٢٠)
            </button>
            <button
              (click)="selectedCategory.set('citations')"
              [class]="selectedCategory() === 'citations' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
              سەرچاوە و ژێدەر (٢١-٣٠)
            </button>
            <button
              (click)="selectedCategory.set('language_orthography')"
              [class]="selectedCategory() === 'language_orthography' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
              زاراوە و ڕێنووس (٣١-٤٠)
            </button>
            <button
              (click)="selectedCategory.set('defense_publishing')"
              [class]="selectedCategory() === 'defense_publishing' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer">
              بەرگری و چاپ (٤١-٥٠)
            </button>
          </div>
        </div>

        <!-- 50 Tools Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          @for (tool of filteredTools(); track tool.id) {
            <div class="bg-slate-950/70 border border-slate-800/80 hover:border-indigo-600/60 p-3.5 rounded-xl transition space-y-2 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center justify-center text-xs font-mono font-bold">
                      {{ tool.id }}
                    </span>
                    <h4 class="text-xs font-bold text-slate-100">{{ tool.nameKurdish }}</h4>
                  </div>
                  <mat-icon class="!text-sm !w-4 !h-4 text-indigo-400">{{ tool.icon }}</mat-icon>
                </div>

                <div class="text-[10px] text-slate-500 font-mono mb-1.5" dir="ltr">
                  {{ tool.nameEnglish }}
                </div>

                <p class="text-xs text-slate-300 leading-relaxed font-serif">
                  {{ tool.description }}
                </p>
              </div>

              <div class="pt-2 border-t border-slate-800/60 text-[11px] text-emerald-400 flex items-center gap-1">
                <mat-icon class="!text-xs !w-3.5 !h-3.5">check_circle</mat-icon>
                <span>سوود: {{ tool.practicalValue }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class FiftyAcademicToolsSuiteComponent {
  activeChapter = input<ChapterItem | null>(null);

  activeToolTab = signal<string>('all');
  allTools = signal<EssentialAcademicTool[]>(FIFTY_TOOLS_DATA);
  selectedCategory = signal<string>('all');

  filteredTools = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.allTools();
    return this.allTools().filter(t => t.category === cat);
  });
}
