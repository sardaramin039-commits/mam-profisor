import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BookPart {
  lastFootnoteNum?: number;
  sourcesLedger?: string;
  id: number;
  title: string;
  targetPages: number;
  targetWords: number;
  content: string;
  summary: string;
  wordCount: number;
  status: 'pending' | 'writing' | 'completed' | 'humanizing' | 'humanized' | 'error';
  errorMsg?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html'
})
export class App implements OnInit {historyList:any=signal([]);isReadingModeOpen:any=signal(false);toastService:any={showSuccess:function(){},showError:function(){},showInfo:function(){}};refineForm:any={get:function(){return{value:String()};}};addChapter:any=function(){};renameChapter:any=function(){};deleteChapter:any=function(){};moveChapterUp:any=function(){};moveChapterDown:any=function(){};addAxis:any=function(){};renameAxis:any=function(){};deleteAxis:any=function(){};addBranch:any=function(){};renameBranch:any=function(){};deleteBranch:any=function(){};aiGenerateStructure:any=function(){};writeSingleBranch:any=function(){};applyTextFormatting:any=function(){};injectAcademicSourceCitation:any=function(){};updateChapterContent:any=function(){};forceManualSyncNow:any=function(){};exportWordOrPdf:any=function(){};backupProject:any=function(){};onBackupFileSelected:any=function(){};
  // Single Unified UI State (No old components)
  viewMode = signal<'preview' | 'writing'>('preview');
  activeWindow = signal<'window1' | 'window2'>('window1');
  isSettingsOpen = signal<boolean>(false);
  activeToolModal = signal<'library' | 'viva' | 'plagiarism' | 'glossary' | 'reader' | null>(null);
  inspectedPart = signal<BookPart | null>(null);

  // API Key Pool & Live Diagnostics
  rawKeysInput = signal<string>("");
  apiKeysList = signal<string[]>([]);
  currentKeyIndex = signal<number>(0);
  selectedModel = signal<string>('gemini-2.5-flash');
  keyTestStatus = signal<string>('');
  isTestingKey = signal<boolean>(false);
  darkMode = signal<boolean>(true);

  // Window 1 Controls
  projectTitle = signal<string>('');
  subject = signal<string>('ئەدەبی');
  subjectsList=['جوگرافیا و ژینگەناسی','پزیشکی و زانستە تەندروستییەکان','یاسا و زانستە سیاسییەکان','ئابووری و کارگێڕی','مێژوو و شوێنەوارناسی','زانستە پەتییەکان (فیزیا، کیمیا، زیندەزانی)','ئەندازیاری و تەکنەلۆژیا','کۆمەڵناسی و دەروونناسی','پەروەردە و فێرکردن','فەلسەفە و هزر','زمانەوانی و ڕێزمان','ئەدەب و ڕەخنەی ئەدەبی','ئایینناسی و شەریعەت','هتد'];researchMethod=signal<string>('میتۆدی شیکاری و ڕەخنەیی');methodsList=['میتۆدی شیکاری و ڕەخنەیی','میتۆدی وەسفی و مەیدانی','میتۆدی ئەزموونی و داتایی (Quantitative)','میتۆدی مێژوویی و بەڵگەنامەیی','میتۆدی بەراوردکاریی زانستی','میتۆدی تێکەڵ (Mixed-Methods)'];empiricalMode=signal<boolean>(true);
  customSubject = signal<string>('');
  writingType = signal<string>('کتێب');
  writingTypesList = ['داڕشتن', 'ڕاپۆرت', 'لێکۆڵینەوەی دەرچوون', 'ماستەرنامە', 'دکتۆرانامە', 'کتێب'];
  academicLevel = signal<string>('دکتۆرا');
  levelsList = ['قوتابخانە', 'زانکۆ', 'ماستەر', 'دکتۆرا', 'پڕۆفیسۆر'];

  targetPages = signal<number>(30);
  totalWords = computed(() => Math.max(1, Number(this.targetPages() || 1)) * 300);
  calculatedPartsCount = computed(() => {
    const p = Math.max(1, Number(this.targetPages() || 1));
    if (p <= 5) return Math.max(1, p); return Math.max(2, Math.ceil(p / 5));
  });

  // Professor Feature Icons (ON/OFF)
  roleTriAgent = signal<boolean>(true);
  dialecticMode = signal<boolean>(true);
  copyStyleMode = signal<boolean>(false);
  styleSampleText = signal<string>('');
  styleFileName = signal<string>('');

  comparisonMode = signal<boolean>(false);
  compareText1 = signal<string>('');
  compareFile1Name = signal<string>('');
  compareText2 = signal<string>('');
  compareFile2Name = signal<string>('');
  comparisonAxis = signal<string>('');

  temperature = signal<number>(0.5);
  thinkingTokens = signal<number>(1024);
  outputTokens = signal<number>(8192);

  coverPageMode = signal<boolean>(true);
  universityName = signal<string>('زانکۆی کوردستان — خوێندنی باڵا');
  researcherName = signal<string>('');
  supervisorName = signal<string>('');
  publishYear = signal<string>('٢٠٢٦');

  customSourcesMode = signal<boolean>(false);
  customSourcesText = signal<string>('');
  customOutlineMode = signal<boolean>(false);
  customOutlineText = signal<string>('');
  citationStyle = signal<string>('پەراوێزی ژمارەیی کوردی (شیکاگۆ)');
  citationStylesList = ['پەراوێزی ژمارەیی کوردی (شیکاگۆ)', 'APA 7', 'Harvard', 'MLA 9', 'IEEE'];

  // Window 2 State
  parts = signal<BookPart[]>([]);
  isAutoWriting = signal<boolean>(false);
  isAutoHumanizing = signal<boolean>(false);
  isReviewingStructure = signal<boolean>(false);
  statusMessage = signal<string>('ئامادەیە بۆ کارکردن');
  toolOutputText = signal<string>('');
  isToolRunning = signal<boolean>(false);
  librarySources = signal<string[]>([]);

  savedBooksArchive=signal<any[]>([]);isArchiveOpen=signal<boolean>(false);currentProjectId=signal<string>('proj_'+Date.now());openIdb():Promise<IDBDatabase>{return new Promise((res,rej)=>{const r=indexedDB.open('MamLibraryDB',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('books'))r.result.createObjectStore('books',{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}async saveBookToIdb(){try{const db=await this.openIdb();const tx=db.transaction('books','readwrite');tx.objectStore('books').put({id:this.currentProjectId(),title:this.projectTitle()||'کتێبی بێ ناونیشان',subject:this.subject(),writingType:this.writingType(),academicLevel:this.academicLevel(),targetPages:this.targetPages(),parts:this.parts(),updatedAt:new Date().toLocaleString('ku-IQ')});await this.loadArchiveList();}catch(e){}}async loadArchiveList(){try{const db=await this.openIdb();const tx=db.transaction('books','readonly');const req=tx.objectStore('books').getAll();req.onsuccess=()=>{this.savedBooksArchive.set(req.result||[]);};}catch(e){}}openBookFromArchive(b:any){this.currentProjectId.set(b.id);this.projectTitle.set(b.title||'');this.subject.set(b.subject||'ئەدەبی');this.writingType.set(b.writingType||'کتێب');this.academicLevel.set(b.academicLevel||'دکتۆرا');this.targetPages.set(b.targetPages||30);this.parts.set(b.parts||[]);this.isArchiveOpen.set(false);this.activeWindow.set('window2');this.statusMessage.set('کتێبی ('+b.title+') لە بیرگەی IndexedDB کرایەوە.');}async deleteBookFromArchive(id:string){try{const db=await this.openIdb();const tx=db.transaction('books','readwrite');tx.objectStore('books').delete(id);await this.loadArchiveList();}catch(e){}}startNewBookProject(){this.currentProjectId.set('proj_'+Date.now());this.projectTitle.set('');this.parts.set([]);this.isArchiveOpen.set(false);this.activeWindow.set('window1');this.statusMessage.set('پڕۆژەی کتێبی نوێ ئامادەیە.');}
  addNewPartManual(){const list=[...this.parts()];const nextId=list.length+1;list.push({id:nextId,title:'بەشی '+nextId+': تەوەری نوێی شیکاری',targetPages:10,targetWords:3000,content:'',summary:'',lastFootnoteNum:0,sourcesLedger:'',wordCount:0,status:'pending'});this.parts.set(list);}movePartOrder(i:number,dir:number){const list=[...this.parts()];const j=i+dir;if(j<0||j>=list.length)return;const tmp=list[i];list[i]=list[j];list[j]=tmp;list.forEach((p,idx)=>p.id=idx+1);this.parts.set(list);}removePartManual(i:number){const list=this.parts().filter((_,idx)=>idx!==i);list.forEach((p,idx)=>p.id=idx+1);this.parts.set(list);}
  downloadBackupJson(){try{const d=JSON.stringify({projectTitle:this.projectTitle(),parts:this.parts()},null,2);const b=new Blob([d],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=(this.projectTitle()||"mam-book")+"-backup.json";a.click();URL.revokeObjectURL(u);}catch(e){}}
  ngOnInit() {
    this.loadArchiveList();
    try {
      const saved = localStorage.getItem('MAM_DIRECT_KEYS');
      if (saved && saved.trim()) {
        this.rawKeysInput.set(saved);
      }
    } catch (e) {}
    this.parseAndStoreKeys(this.rawKeysInput());
  }

  parseAndStoreKeys(raw: string) {
    const list = (raw || '')
      .split(/[\s,،٫;|\r\n]+/)
      .map(k => k.trim().replace(/^["']|["']$/g, ''))
      .filter(k => k.startsWith('AIza') && k.length >= 30);
    this.apiKeysList.set(Array.from(new Set(list)));
    this.currentKeyIndex.set(0);
    try {
      localStorage.setItem('MAM_DIRECT_KEYS', this.apiKeysList().join(','));
    } catch (e) {}
  }

  saveSettings() {
    this.parseAndStoreKeys(this.rawKeysInput());
    this.statusMessage.set(this.apiKeysList().length + ' کلیلی جیمینی بە سەرکەوتوویی پاشەکەوت کرا.');
    this.isSettingsOpen.set(false);
  }

  async testApiKeyNow() {
    this.parseAndStoreKeys(this.rawKeysInput());
    if (this.apiKeysList().length === 0) {
      this.keyTestStatus.set('❌ هیچ کلیلێکی دروست نەدۆزرایەوە (دەبێت بە AIza دەست پێ بکات).');
      return;
    }
    this.isTestingKey.set(true);
    this.keyTestStatus.set('⏳ خەریکی تاقیکردنەوەی پەیوەندیی ڕاستەوخۆیە لەگەڵ گووگڵ...');
    try {
      const reply = await this.callGeminiDirect('بە کوردی بنووسە: پەیوەندیی کتێبخانەی مام چالاکە.');
      this.keyTestStatus.set('✅ سەرکەوتوو بوو! وەڵامی گووگڵ: ' + reply);
    } catch (err: any) {
      this.keyTestStatus.set('❌ هەڵە: ' + (err?.message || 'پەیوەندی سەرکەوتوو نەبوو'));
    } finally {
      this.isTestingKey.set(false);
    }
  }

  async callGeminiDirect(prompt: string): Promise<string> {
    const keys = this.apiKeysList();
    if (!keys || keys.length === 0) {
      this.isSettingsOpen.set(true);
      throw new Error('تکایە سەرەتا کلیلی نوێی Gemini لە پەنجەرەی سێتینگ دابنێ.');
    }

    const modelsToTry = [this.selectedModel(), 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    const uniqueModels = Array.from(new Set(modelsToTry));
    let lastError = '';

    const maxKeyTries = Math.min(keys.length, 15);
    for (let kAttempt = 0; kAttempt < maxKeyTries; kAttempt++) {
      const idx = (this.currentKeyIndex() + kAttempt) % keys.length;
      const apiKey = keys[idx];

      for (const modelName of uniqueModels) {
        try {
          const payload: any = {
            systemInstruction: { parts: [{ text: "تۆ پڕۆفیسۆر و توێژەرێکی باڵای ئەکادیمیی کوردیت. یاسای بنەڕەتیی نەگۆڕ: ١. لە یەک گەڕدا هەر چوار قۆناغی (نووسینی زانستی، ڕەخنەی میتۆدی، پێداچوونەوەی زمانەوانی، و هیومانیزی ١٠٠٪ مرۆیی) جێبەجێ بکە بە پەرەگرافی تێروتەسەل و بەبێ خاڵبەندیی ڕۆبۆتی. ٢. هەرگیز وشەکانی (تێز، دژەتێز، سێنتێز) مەنووسە، بەڵکو بیرۆکەکان بە نەرمی لەناو پەرەگرافەکاندا بتوێنەرەوە. ٣. تەنها زاراوە و میتۆدی زانستیی ئەو بوارە بەکاربهێنە کە هەڵبژێردراوە و هیچ بوارێکی تر تێکەڵ مەکە. ٤. هەرگیز ناوی سەرچاوە یان ژمارەی لاپەڕەی خەیاڵی دامەتاشە." }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: Number(this.temperature()) || 0.5,
              maxOutputTokens: Number(this.outputTokens()) || 8192
            }
          };

          if (Number(this.thinkingTokens()) > 0 && modelName.includes('2.5')) {
            payload.generationConfig.maxOutputTokens = Math.max(16384, Number(this.thinkingTokens()) + 4096);
            payload.generationConfig.thinkingConfig = { thinkingBudget: Number(this.thinkingTokens()) };
          }

          const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + apiKey;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            const msg = data?.error?.message || ('HTTP ' + res.status);
            lastError = msg;
            if (msg.toLowerCase().includes('location is not supported')) {
              throw new Error('گووگڵ دەڵێت شوێنی جوگرافی ڕێگەپێدراو نییە (تکایە VPN بگۆڕە).');
            }
            if (res.status === 503 || res.status === 429 || res.status === 404 || msg.toLowerCase().includes('high demand') || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('quota')) {
              await new Promise(r => setTimeout(r, 1500));
              continue;
            }
            break;
          }

          const parts = data?.candidates?.[0]?.content?.parts || [];
          const text = parts
            .filter((p: any) => !p.thought && typeof p.text === 'string')
            .map((p: any) => p.text)
            .join('\n')
            .trim() || parts.map((p: any) => p.text || '').join('\n').trim();

          if (text.length > 0) {
            this.currentKeyIndex.set(idx);
            return this.normalizeKurdish(text);
          }
          lastError = 'مۆدێلەکە دەقی بەتاڵی گەڕاندەوە';
        } catch (err: any) {
          lastError = err?.message || 'Network error';
          if (lastError.includes('VPN')) throw err;
        }
      }
    }
    throw new Error(lastError || 'هەموو کلیلەکان تاقی کرانەوە و وەڵام نەبوو.');
  }

  normalizeKurdish(text: string): string {
    return text.replace(/ك/g,'ک').replace(/ي/g,'ی').replace(/ى/g,'ی').replace(/ة/g,'ە').replace(/(?:تێز|دژەتێز|دژە تێز|سێنتێز)\s*[:\-–—]/g,'').replace(/\((?:تێز|دژەتێز|سێنتێز)\)/g,'').replace(/\*\*/g,'');
  }

  async handleFileUpload(event: Event, target: 'style' | 'comp1' | 'comp2' | 'library') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const extracted = await this.extractTextFromFile(file);
    if (target === 'style') {
      this.styleFileName.set(file.name);
      this.styleSampleText.set(extracted);
    } else if (target === 'comp1') {
      this.compareFile1Name.set(file.name);
      this.compareText1.set(extracted);
    } else if (target === 'comp2') {
      this.compareFile2Name.set(file.name);
      this.compareText2.set(extracted);
    } else if (target === 'library') {
      this.librarySources.set([...this.librarySources(), file.name + ': ' + extracted.slice(0, 600)]);
    }
  }

  async extractTextFromFile(file: File): Promise<string> {
    try {
      const buf = await file.arrayBuffer();
      const raw = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(buf));
      if (file.name.endsWith('.docx')) {
        const matches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (matches && matches.length > 0) {
          return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
        }
      }
      return raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20000) || file.name;
    } catch {
      return file.name;
    }
  }

  sendToWindow2() {
    const title = this.projectTitle().trim() || 'لێکۆڵینەوەی زانستیی نوێ';
    this.projectTitle.set(title);
    const totalP = Math.max(1, Number(this.targetPages() || 1));
    const count = this.calculatedPartsCount();
    const pagesPerPart = Math.max(1, Math.round(totalP / count));
    const wordsPerPart = pagesPerPart * 300;

    const customLines = this.customOutlineMode()
      ? this.customOutlineText().split('\n').map(l => l.trim()).filter(Boolean)
      : [];

    const list: BookPart[] = [];
    for (let i = 1; i <= count; i++) {
      let pt = customLines[i - 1] || '';
      if (!pt) {
        if (i === 1) pt = 'بەشی ١: دەروازەی تیۆری، پێشەکی و چوارچێوەی میتۆدیی (' + title + ')';
        else if (i === count) pt = 'بەشی ' + i + ' (کۆتایی): ئەنجامگیریی گشتی، دەرەنجامەکان و لیستی سەرچاوەکان';
        else pt = 'بەشی ' + i + ': شیکاریی زنجیرەیی تەوەری (#' + i + ') لەسەر ' + title;
      }
      list.push({
        id: i,
        title: pt,
        targetPages: pagesPerPart,
        targetWords: wordsPerPart,
        content: '',
        summary: '',
        wordCount: 0,
        status: 'pending'
      });
    }
    this.parts.set(list);
    this.activeWindow.set('window2');
    this.statusMessage.set('کتێبەکە دابەش کرا بۆ ' + count + ' بەشی زنجیرەیی پێکەوەبەستراو.');
  }

  async reviewStructureAndTitles() {
    if (this.parts().length === 0) return;
    this.isReviewingStructure.set(true);
    this.statusMessage.set('خەریکی پێداچوونەوەی پێکهاتە و بەهێزکردنی ناونیشانەکانە...');
    try {
      const currentList = this.parts().map(p => p.id + '| ' + p.title).join('\n');
      const prompt = 'تۆ پڕۆفیسۆری باڵای ئەکادیمیای کوردیت. ناونیشانی سەرەکی و ناونیشانی ئەم بەشە زنجیرەییانە بەهێزتر و زانستیتر بکە بێ گۆڕینی ژمارەی بەشەکان.\n' +
        'ناونیشان: ' + this.projectTitle() + '\nبابەت: ' + this.subject() + ' | جۆر: ' + this.writingType() + ' | ئاست: ' + this.academicLevel() + '\n' +
        'بەم فۆڕماتە وەڵام بدەرەوە:\nTITLE: [ناونیشانی نوێ]\n1| [ناونیشانی بەشی ١]\n2| [ناونیشانی بەشی ٢]\n\nلیستی ئێستا:\n' + currentList;
      const res = await this.callGeminiDirect(prompt);
      const tm = res.match(/TITLE:\s*(.+)/);
      if (tm && tm[1]) this.projectTitle.set(tm[1].trim());
      const updated = [...this.parts()];
      for (const line of res.split('\n')) {
        const m = line.match(/^(\d+)\s*[|\-:\.]\s*(.+)/);
        if (m) {
          const idx = parseInt(m[1], 10) - 1;
          if (updated[idx]) updated[idx] = { ...updated[idx], title: m[2].trim() };
        }
      }
      this.parts.set(updated);this.saveBookToIdb();
      this.statusMessage.set('✅ ناونیشانی سەرەکی و پێکهاتەی هەموو بەشەکان بەهێز کران.');
    } catch (err: any) {
      this.statusMessage.set('❌ ' + err.message);
    } finally {
      this.isReviewingStructure.set(false);
    }
  }

  async writeSinglePart(index: number) {
    const current = [...this.parts()];
    const part = current[index];
    if (!part) return;

    current[index] = { ...part, status: 'writing', errorMsg: undefined };
    this.parts.set(current);
    this.statusMessage.set('⏳ خەریکی نووسینی (' + part.title + ')ە...');

    const prevSummaries = this.parts()
      .slice(Math.max(0, index - 6), index)
      .filter(p => p.summary || p.content)
      .map(p => 'بەشی ' + p.id + ': ' + (p.summary || p.content.slice(-300)))
      .join('\n');

    const prevEnding = index > 0 && this.parts()[index - 1].content
      ? this.parts()[index - 1].content.slice(-500)
      : '';

    const instructions = [
      'تۆ سیستمێکی باڵای نووسینی ئەکادیمی و کتێبیت بە زمانی کوردیی ستاندارد.',
      'ناونیشانی گشتی: ' + this.projectTitle(),
      'بابەت: ' + (this.subject() === 'هتد' ? this.customSubject() : this.subject()),
      'جۆری نووسین: ' + this.writingType() + ' | ئاست: ' + this.academicLevel(),
      'شێوازی سەرچاوەدان: ' + this.citationStyle() + ' (بە بەکارهێنانی یاسای هەمان سەرچاوە و سەرچاوەی پێشوو)',
      'ئەڵقەی زنجیرەیی ئێستا: بەشی ' + part.id + ' لە کۆی ' + this.parts().length + ' بەش',
      'ناونیشانی ئەم بەشە: ' + part.title,
      'قەبارەی داواکراو: ' + part.targetPages + ' لاپەڕە (نزیکەی ' + part.targetWords + ' وشەی تێروتەسەل).',
      this.roleTriAgent() ? 'یاسای ڕۆڵی ٣-ئەجێنت (چالاکە): وەک (١. نووسەر، ٢. ڕەخنەگری میتۆدی، ٣. پێداچوونەوەی زمانەوانی) دەقێکی قووڵ و بێ کەموکوڕی بنووسە.' : '',
      this.dialecticMode() ? 'یاسای دیالێکتیک (چالاکە): بیرۆکە و دژەبیرۆکە و دەرەنجامی زانستی لەناو پەرەگرافەکاندا تێکەڵ بکە بێ ئەوەی هەرگیز وشەکانی (تێز، دژەتێز، سێنتێز) بنووسیت و شێوازێکی ١٠٠ لە سەد مرۆیی و پەرەگرافی ڕەوان بەکاربهێنە.' : '',
      this.copyStyleMode() && this.styleSampleText() ? ('یاسای کۆپی ستایل: ڕێک بە شێواز و زمانی ئەم نموونەیە بنووسە:\n' + this.styleSampleText().slice(0, 3500)) : '',
      this.comparisonMode() ? ('یاسای بەراوردکاری:\nسەرچاوەی ١: ' + this.compareText1().slice(0, 3000) + '\nسەرچاوەی ٢: ' + this.compareText2().slice(0, 3000) + '\nڕووی بەراوردکاری: ' + this.comparisonAxis()) : '',
      this.customSourcesMode() && this.customSourcesText() ? ('تەنها پشت بەم سەرچاوانە ببەستە:\n' + this.customSourcesText()) : '',
      prevSummaries ? ('پوختەی بەشەکانی پێشوو:\n' + prevSummaries) : '',
      prevEnding ? ('دوایین پەرەگرافی بەشی پێشوو (وەک ئەڵقەی زنجیرە ڕاستەوخۆ پەیوەستی بکە پێیەوە):\n' + prevEnding) : '',
      'ئێستا دەقی تەواوی ئەم بەشە بە پەرەگرافی تێروتەسەل و پەراوێزی زانستی بنووسە:'
    ].filter(Boolean).join('\n\n');

    try {
      const text = await this.callGeminiDirect(instructions);
      const wc = text.split(/\s+/).filter(Boolean).length;
      const updated = [...this.parts()];
      updated[index] = {
        ...updated[index],
        content: text,
        summary: text.slice(0, 300).replace(/\n+/g, ' '),
        wordCount: wc,
        status: 'completed',
        errorMsg: undefined
      };
      this.parts.set(updated);this.saveBookToIdb();
      if (this.inspectedPart()?.id === part.id) {
        this.inspectedPart.set(updated[index]);
      }
      this.statusMessage.set('✅ بەشی ' + part.id + ' تەواو بوو (' + wc + ' وشە). کلیک لە ئایکۆنی چاو 👁️ بکە بۆ بینینی.');
    } catch (err: any) {
      const updated = [...this.parts()];
      updated[index] = { ...updated[index], status: 'error', errorMsg: err.message };
      this.parts.set(updated);this.saveBookToIdb();
      this.statusMessage.set('❌ هەڵە لە بەشی ' + part.id + ': ' + err.message);
    }
  }

  async toggleAutoWrite() {
    if (this.isAutoWriting()) {
      this.isAutoWriting.set(false);if(this.parts().some(p=>p.content)){this.downloadBackupJson();this.statusMessage.set('✅ ئۆتۆڕایت تەواو بوو و کۆپییەکی پاڵپشت خۆکار دابەزێنرایە ناو Downloads.');}if(this.parts().some(p=>p.content)){this.downloadBackupJson();this.statusMessage.set('✅ ئۆتۆڕایت تەواو بوو و کۆپییەکی پاڵپشت خۆکار دابەزێنرایە ناو Downloads.');}
      this.statusMessage.set('ئۆتۆڕایت وەستێنرا.');
      return;
    }
    this.isAutoWriting.set(true);
    for (let i = 0; i < this.parts().length; i++) {
      if (!this.isAutoWriting()) break;
      if (this.parts()[i].status !== 'completed' && this.parts()[i].status !== 'humanized') {
        await this.writeSinglePart(i);if(this.isAutoWriting()&&i<this.parts().length-1){this.statusMessage.set('⏳ پشووی پاراستنی کلیلەکان (٣ چرکە) پێش بەشی دواتر...');await new Promise(r=>setTimeout(r,3000));}
      }
    }
    this.isAutoWriting.set(false);
  }

  async humanizeSinglePart(index: number) {
    const current = [...this.parts()];
    const part = current[index];
    if (!part || !part.content) return;
    current[index] = { ...part, status: 'humanizing' };
    this.parts.set(current);
    this.statusMessage.set('✨ خەریکی هیومانایزکردنی بەشی ' + part.id + 'ە...');
    try {
      const prompt = 'ئەم دەقە زانستییە بە شێوازێکی تەواو مرۆیی، ڕەوان و ئەکادیمیی باڵا (ئاستی ' + this.academicLevel() + ') دابڕێژەرەوە بێ ئەوەی پەراوێز و سەرچاوە و وتەکان بسڕیتەوە:\n\n' + part.content;
      const res = await this.callGeminiDirect(prompt);
      const wc = res.split(/\s+/).filter(Boolean).length;
      const updated = [...this.parts()];
      updated[index] = { ...updated[index], content: res, wordCount: wc, status: 'humanized' };
      this.parts.set(updated);this.saveBookToIdb();
      if (this.inspectedPart()?.id === part.id) this.inspectedPart.set(updated[index]);
      this.statusMessage.set('✨ بەشی ' + part.id + ' بە سەرکەوتوویی هیومانایز کرا.');
    } catch (err: any) {
      const updated = [...this.parts()];
      updated[index] = { ...updated[index], status: 'completed' };
      this.parts.set(updated);this.saveBookToIdb();
      this.statusMessage.set('❌ ' + err.message);
    }
  }

  async toggleAutoHumanize() {
    if (this.isAutoHumanizing()) {
      this.isAutoHumanizing.set(false);
      return;
    }
    this.isAutoHumanizing.set(true);
    for (let i = 0; i < this.parts().length; i++) {
      if (!this.isAutoHumanizing()) break;
      if (this.parts()[i].content && this.parts()[i].status !== 'humanized') {
        await this.humanizeSinglePart(i);if(this.isAutoHumanizing()&&i<this.parts().length-1){await new Promise(r=>setTimeout(r,3000));}
      }
    }
    this.isAutoHumanizing.set(false);
  }

  async openUnifiedToolModal(tool: 'library' | 'viva' | 'plagiarism' | 'glossary' | 'reader') {
    this.activeToolModal.set(tool);
    if (tool === 'library' || tool === 'reader') return;
    const combined = this.parts().map(p => p.content).filter(Boolean).join('\n\n').slice(0, 10000);
    if (!combined) {
      this.toolOutputText.set('تکایە سەرەتا لانیکەم بەشێک بنووسە تا ئەم ئامرازە شیکاریی بۆ بکات.');
      return;
    }
    this.isToolRunning.set(true);
    this.toolOutputText.set('⏳ خەریکی ئامادەکردنی ڕاپۆرتی زانستییە...');
    try {
      let p = '';
      if (tool === 'viva') p = 'وەک لیژنەی تاوتوێی دکتۆرا و ماستەر، ٥ پرسیاری قووڵی میتۆدی و زانستی لەگەڵ وەڵامی نموونەیی لەسەر ئەم دەقە ئامادە بکە:\n' + combined;
      if (tool === 'plagiarism') p = 'ڕاپۆرتی وردبینیی ڕەسەنایەتیی زانستی، پشکنینی پەراوێزەکان و هەڵسەنگاندنی ئاستی ئەکادیمی بۆ ئەم دەقە بنووسە:\n' + combined;
      if (tool === 'abstract' as any) p = 'بۆ ئەم توێژینەوەیە (١) پوختەیەکی زانستیی تێروتەسەل بە زمانی کوردی، (٢) الملخص بە زمانی عەرەبیی ئەکادیمی، (٣) Abstract بە زمانی ئینگلیزیی ئەکادیمی، لەگەڵ (٤) لیستی یەکگرتووی هەموو سەرچاوەکان بە ڕیزبەندیی ئەلفوبێ و جیاکراوە بەپێی زمان (کوردی، عەرەبی، فارسی، ئینگلیزی) ئامادە بکە:\\n' + combined;
      if (tool === 'abstract' as any) p = 'بۆ ئەم توێژینەوەیە (١) پوختەیەکی زانستیی تێروتەسەل بە زمانی کوردی، (٢) الملخص بە زمانی عەرەبیی ئەکادیمی، (٣) Abstract بە زمانی ئینگلیزیی ئەکادیمی، لەگەڵ (٤) لیستی یەکگرتووی هەموو سەرچاوەکان بە ڕیزبەندیی ئەلفوبێ و جیاکراوە بەپێی زمان (کوردی، عەرەبی، فارسی، ئینگلیزی) ئامادە بکە:\\n' + combined;
      if (tool === 'glossary') p = 'گرنگترین زاراوە زانستییەکانی ناو ئەم دەقە دەربهێنە بە ٤ زمان (کوردی، ئینگلیزی، عەرەبی، فارسی) لەگەڵ پێناسەی زانستی:\n' + combined;
      const out = await this.callGeminiDirect(p);
      this.toolOutputText.set(out);
    } catch (err: any) {
      this.toolOutputText.set('❌ ' + err.message);
    } finally {
      this.isToolRunning.set(false);
    }
  }

  saveAllAsBook(format: 'word' | 'pdf') {
    const written = this.parts().filter(p => p.content.trim().length > 0);
    if (written.length === 0) {
      alert('هیچ بەشێک هێشتا نەنووسراوە بۆ پاشەکەوتکردن!');
      return;
    }
    const cover = this.coverPageMode() ?
      '<div style="page-break-after:always;text-align:center;padding:60px 40px;border:4px double #065f46;border-radius:12px;margin-bottom:40px;">' +
      '<h3 style="font-size:20pt;color:#065f46;">' + this.universityName() + '</h3>' +
      '<p style="font-size:14pt;color:#475569;">' + this.writingType() + ' — ئاستی: ' + this.academicLevel() + ' (' + this.subject() + ')</p>' +
      '<h1 style="font-size:28pt;font-weight:bold;margin:40px 0;">' + this.projectTitle() + '</h1>' +
      '<p style="font-size:15pt;">' + (this.researcherName() ? 'ئامادەکردن: ' + this.researcherName() : '') + '</p>' +
      '<p style="font-size:15pt;">' + (this.supervisorName() ? 'سەرپەرشتیار: ' + this.supervisorName() : '') + '</p>' +
      '<p style="font-size:14pt;margin-top:30px;">ساڵ: ' + this.publishYear() + '</p></div>' : '';

    const toc = '<div style="page-break-after:always;padding:25px;"><h2 style="color:#065f46;border-bottom:2px solid #065f46;">پێڕستی بەشەکان</h2><ul>' +
      written.map(p => '<li style="font-size:14pt;line-height:2;"><strong>' + p.title + '</strong> (' + p.wordCount + ' وشە)</li>').join('') + '</ul></div>';

    const body = written.map(p =>
      '<div style="page-break-after:always;padding:20px 10px;">' +
      '<h2 style="font-size:20pt;color:#065f46;border-right:5px solid #065f46;padding-right:12px;">' + p.title + '</h2>' +
      '<div style="font-size:14pt;line-height:2;text-align:justify;white-space:pre-wrap;">' + p.content + '</div></div>'
    ).join('');

    const doc = '<!DOCTYPE html><html lang="ku" dir="rtl"><head><meta charset="utf-8"><title>' + this.projectTitle() + '</title>' +
      '<style>body{font-family:"Vazirmatn","Traditional Arabic",serif;direction:rtl;margin:2.5cm 3cm 2.5cm 2.5cm;color:#111827;line-height:2.1;}p,div{text-indent:1cm;}</style></head><body>' +
      cover + toc + body + '</body></html>';

    if (format === 'word') {
      const blob = new Blob(['\ufeff', doc], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (this.projectTitle() || 'mam-book') + '.doc';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const w = window.open('', '_blank');
      if (w) { w.document.write(doc); w.document.close(); setTimeout(() => w.print(), 500); }
    }
  }
}
export { App as AppComponent };