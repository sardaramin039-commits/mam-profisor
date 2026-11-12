import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, inject, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GeminiRequestManagerService } from '../../services/gemini-request-manager.service';
import { WordExportService } from '../../services/word-export';
import { AcademicCitationManager } from '../../services/academic-citation-manager.service';

type BookView = 'mam-preview' | 'mam-window1' | 'mam-window2' | 'workspace' | 'splash';
type WorkspaceTab = 'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive' | 'platform';
interface CoverInfo { university: string; researcher: string; supervisor: string; year: string; }

interface MamBookHost {
  refineForm: FormGroup;
  mainTab: WritableSignal<WorkspaceTab>;
  academicDarkMode: WritableSignal<boolean>;
}

interface BookPart {
  number: number;
  title: string;
  content: string;
  status: 'pending' | 'writing' | 'complete' | 'error';
  previousSummary: string;
}

@Component({
  selector: 'app-mam-book-library',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() === 'mam-preview') {
      <main class="preview-screen" dir="rtl">
        <div class="preview-shade"></div>
        <div class="preview-actions">
          <button type="button" class="preview-icon" (click)="openSettings()" aria-label="سێتینگ">
            <mat-icon>settings</mat-icon><span>سێتینگ</span>
          </button>
          <button type="button" class="preview-icon" (click)="modeChange.emit('mam-window1')" aria-label="نوسین">
            <mat-icon>edit_note</mat-icon><span>نوسین</span>
          </button>
        </div>
        <h1>کتێبخانەی مام</h1>
        <p>شوێنێک بۆ بیرکردنەوە، ڕێکخستن و نووسینی کتێب و توێژینەوە</p>
        @if (settingsOpen()) {
          <div class="modal-shade" (click)="settingsOpen.set(false)">
            <section class="settings-modal" (click)="$event.stopPropagation()">
              <button type="button" class="close-button" (click)="settingsOpen.set(false)" aria-label="داخستن"><mat-icon>close</mat-icon></button>
              <h2>سێتینگ</h2>
              <label>کلیلەکانی Gemini API</label>
              <p class="server-key-status" [class.server-key-missing]="serverKeyStatus() === 'missing'">{{ serverKeyMessage() }}</p>
              <label>مۆدێل</label>
              <select [value]="gemini.preferredModel()" (change)="gemini.setPreferredModel(valueOf($event))">
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              </select>
              <label class="theme-row"><input type="checkbox" [checked]="host().academicDarkMode()" (change)="toggleTheme($event)"> شێوازی تاریک</label>
              <button type="button" class="primary-button" (click)="settingsOpen.set(false)">تەواو</button>
            </section>
          </div>
        }
      </main>
    } @else {
      <main class="book-app" dir="rtl">
        <header class="book-header">
          <button type="button" class="header-button" (click)="modeChange.emit('mam-preview')"><mat-icon>arrow_forward</mat-icon><span>کتێبخانەی مام</span></button>
          <strong>{{ mode() === 'mam-window1' ? 'پەنجەرەی یەکەم: ڕێکخستنی پڕۆژە' : 'پەنجەرەی دووەم: زنجیرەی بەشەکان' }}</strong>
          <button type="button" class="header-button" (click)="openSettings()"><mat-icon>settings</mat-icon><span>سێتینگ</span></button>
        </header>

        @if (mode() === 'mam-window1') {
          <section class="window-one">
            <form [formGroup]="host().refineForm" (submit)="$event.preventDefault(); createParts()">
              <div class="form-grid">
                <label class="wide">ناونیشان
                  <input formControlName="title" type="text" placeholder="ناونیشانی کتێب یان توێژینەوە" required>
                </label>
                <label>بابەت
                  <select formControlName="discipline">
                    <option value="religion">ئاینی</option><option value="politics">سیاسی</option><option value="sociology">کۆمەڵایەتی</option>
                    <option value="economics">ئابووری</option><option value="science_tech_internet">زانستی</option><option value="history">مێژوو</option>
                    <option value="geography">جوگرافیا</option><option value="literature_arts">ئەدەبی</option><option value="grammar">ڕێزمان</option>
                    <option value="linguistics_grammar">زمانەوانی</option><option value="law">یاسا</option><option value="health_medicine">پزیشکی</option>
                    <option value="travelogue">سەفەرنامە</option><option value="general_academic">هتد</option>
                  </select>
                </label>
                <label>جۆری نوسین
                  <select formControlName="writingType">
                    <option value="essay">داڕشتن</option><option value="report">ڕاپۆرت</option><option value="graduation_research">لێکۆڵینەوەی دەرچوون</option>
                    <option value="master_thesis">ماستەرنامە</option><option value="phd_dissertation">دکتۆرانامە</option><option value="book">کتێب</option>
                  </select>
                </label>
                <label>ئاست
                  <select formControlName="academicLevel">
                    <option value="school">قوتابخانە</option><option value="bachelor">زانکۆ</option><option value="master">ماستەر</option>
                    <option value="phd">دکتۆرا</option><option value="professor">پڕۆفیسۆر</option>
                  </select>
                </label>
                <label>قەبارە (لاپەڕە)
                  <input formControlName="targetPages" type="number" min="1" max="3000">
                  <small>تێبینی: ١ لاپەڕە = ٣٠٠ وشە · {{ totalWords() | number }} وشە · {{ partCount() | number }} بەشی پەیوەست</small>
                </label>
              </div>

              <div class="settings-grid">
                <label class="toggle-row"><input type="checkbox" formControlName="roleCritic"> ئایکۆنی ڕۆڵ (نوسەر • ڕەخنەگر • پێداچونەوە)</label>
                <label class="toggle-row"><input type="checkbox" formControlName="dialectThesis"> ئایکۆنی دیالێکت (تێز • دژەتێز • سێنتێز)</label>
                <label class="toggle-row"><input type="checkbox" [checked]="copyStyleOn()" (change)="copyStyleOn.set(checkedOf($event))"> ئایکۆنی کۆپی ستایل</label>
                <label class="toggle-row"><input type="checkbox" [checked]="comparisonOn()" (change)="comparisonOn.set(checkedOf($event))"> ئایکۆنی بەراورد</label>
                <label class="toggle-row"><input type="checkbox" formControlName="includeDedication"> بەرگی تێز</label>
              </div>

              @if (copyStyleOn()) {
                <div class="drawer">
                  <label>نمونەی ستایل<textarea formControlName="copyStyleText" rows="4" placeholder="دەقی نموونەی شێوازی نووسین"></textarea></label>
                  <label class="file-button">هەڵبژاردنی Word/PDF<input type="file" accept=".doc,.docx,.pdf" (change)="rememberFile($event, 'style')"></label>
                  @if (styleFileName()) { <small>{{ styleFileName() }}</small> }
                </div>
              }
              @if (comparisonOn()) {
                <div class="drawer form-grid">
                  <label>فایلی یەکەم<textarea formControlName="compareFile1" rows="3"></textarea></label>
                  <label class="file-button">هەڵبژاردنی Word/PDF یەکەم<input type="file" accept=".doc,.docx,.pdf" (change)="rememberFile($event, 'one')"></label>
                  <label>فایلی دووەم<textarea formControlName="compareFile2" rows="3"></textarea></label>
                  <label class="file-button">هەڵبژاردنی Word/PDF دووەم<input type="file" accept=".doc,.docx,.pdf" (change)="rememberFile($event, 'two')"></label>
                  <label class="wide">ڕووی بەراوردکاری<input formControlName="compareAspect" type="text"></label>
                </div>
              }

              <div class="form-grid control-grid">
                <label>پلەی گەرمی نوسین: {{ host().refineForm.get('temperature')?.value }}
                  <input type="range" min="0.1" max="1.2" step="0.1" formControlName="temperature">
                </label>
                <label>تۆکێنی بیرکردنەوە: {{ host().refineForm.get('thinkingTokens')?.value | number }}
                  <input type="range" min="1024" max="24576" step="1024" formControlName="thinkingTokens">
                </label>
                <label>تۆکێنی نوسین: {{ host().refineForm.get('writingTokens')?.value | number }}
                  <input type="range" min="2048" max="32768" step="1024" formControlName="writingTokens">
                </label>
                <label>شێوازی پەراوێز
                  <select formControlName="citationStyle"><option value="chicago">پەراوێزی کوردی</option><option value="apa7">APA</option><option value="harvard">Harvard</option></select>
                </label>
              </div>
              @if (host().refineForm.get('includeDedication')?.value) {
                <div class="form-grid cover-fields">
                  <label>زانکۆ<input [value]="cover().university" (input)="updateCover('university', $event)"></label>
                  <label>توێژەر<input [value]="cover().researcher" (input)="updateCover('researcher', $event)"></label>
                  <label>سەرپەرشتیار<input [value]="cover().supervisor" (input)="updateCover('supervisor', $event)"></label>
                  <label>ساڵ<input [value]="cover().year" (input)="updateCover('year', $event)"></label>
                </div>
              }

              <div class="restored-tools">
                <button type="button" (click)="openTool('library')"><mat-icon>local_library</mat-icon>کتێبخانەی سەرچاوەکان</button>
                <button type="button" (click)="openTool('suite')"><mat-icon>record_voice_over</mat-icon>لیژنەی تاوتوێ</button>
                <button type="button" (click)="openTool('suite')"><mat-icon>translate</mat-icon>فەرهەنگ</button>
                <button type="button" (click)="openTool('suite')"><mat-icon>fact_check</mat-icon>پشکنەری ڕەسەنایەتی</button>
                <button type="button" (click)="toggleFormControl('customSourcesOn')"><mat-icon>lock</mat-icon>سەرچاوەی تایبەت</button>
                <button type="button" (click)="toggleFormControl('customTOCOn')"><mat-icon>format_list_numbered</mat-icon>پێڕستی تایبەت</button>
              </div>
              @if (host().refineForm.get('customSourcesOn')?.value) {
                <label class="drawer">لیستی سەرچاوە تایبەت<textarea formControlName="customSourcesText" rows="4"></textarea></label>
              }
              @if (host().refineForm.get('customTOCOn')?.value) {
                <label class="drawer">پێڕستی تایبەت<textarea formControlName="customTOCText" rows="4"></textarea></label>
              }

              @if (errorMessage()) { <p class="error-message">{{ errorMessage() }}</p> }
              <button class="primary-button send-button" type="submit"><mat-icon>send</mat-icon> ناردن بۆ پەنجەرەی دووەم</button>
            </form>
          </section>
        } @else {
          <section class="window-two">
            <div class="parts-column">
              @for (part of parts(); track part.number) {
                <article class="part-card" [class.part-done]="part.status === 'complete'">
                  <span class="chain-link" aria-hidden="true">⛓</span>
                  <div class="part-content">
                    <div class="part-heading">
                      <h2>{{ part.title }}</h2>
                      <span class="part-status">{{ part.status === 'complete' ? 'تەواو' : part.status === 'writing' ? 'لە نووسین' : part.status === 'error' ? 'هەڵە' : 'چاوەڕوان' }}</span>
                    </div>
                    <p>{{ part.content ? excerpt(part.content) : 'ئەم بەشە دەقێکی پەیوەست لەگەڵ پوختەی بەشی پێشوو دەبێت.' }}</p>
                    <button type="button" class="eye-button" [disabled]="part.status !== 'complete'" (click)="openReader(part.number)" aria-label="بینینی بەش">
                      <mat-icon>visibility</mat-icon><span>بینین</span>
                    </button>
                  </div>
                </article>
              }
            </div>
            <div class="bottom-actions">
              <button type="button" (click)="reviewStructure()" [disabled]="busy()"><mat-icon>account_tree</mat-icon><span>پێداچوونەوەی پێکهاتە</span></button>
              <button type="button" (click)="autoWrite()" [disabled]="busy()"><mat-icon>edit_note</mat-icon><span>ئۆتۆڕایت (AutoWrite)</span></button>
              <button type="button" (click)="autoHumanize()" [disabled]="busy()"><mat-icon>face</mat-icon><span>ئۆتۆهیومانیز (AutoHumanize)</span></button>
              @if (busy()) {
                <button type="button" (click)="togglePause()"><mat-icon>{{ paused() ? 'play_arrow' : 'pause' }}</mat-icon><span>{{ paused() ? 'بەردەوامبوون' : 'ڕاگرتنی کاتی' }}</span></button>
              }
              <button type="button" (click)="exportDialogOpen.set(true)" [disabled]="busy()"><mat-icon>download</mat-icon><span>سەیڤ ئۆڵ (Save All)</span></button>
            </div>
            @if (statusMessage()) { <p class="status-message" aria-live="polite">{{ statusMessage() }}</p> }
            @if (errorMessage()) { <p class="error-message" aria-live="assertive">{{ errorMessage() }}</p> }
          </section>
        }

        @if (readerPart(); as activePart) {
          <div class="modal-shade" (click)="readerPart.set(null)">
            <section class="reader-modal" (click)="$event.stopPropagation()">
              <header><h2>{{ activePart.title }}</h2><button type="button" class="close-button" (click)="readerPart.set(null)"><mat-icon>close</mat-icon></button></header>
              <textarea [value]="activePart.content" (input)="updatePartContent(activePart.number, $event)" aria-label="دەقی بەش"></textarea>
            </section>
          </div>
        }
        @if (exportDialogOpen()) {
          <div class="modal-shade" (click)="exportDialogOpen.set(false)">
            <section class="settings-modal export-modal" (click)="$event.stopPropagation()">
              <button type="button" class="close-button" (click)="exportDialogOpen.set(false)"><mat-icon>close</mat-icon></button>
              <h2>هەناردەکردنی کتێب</h2>
              <button type="button" class="primary-button" (click)="saveAll('docx')"><mat-icon>description</mat-icon> Word (.docx)</button>
              <button type="button" class="primary-button" (click)="saveAll('pdf')"><mat-icon>picture_as_pdf</mat-icon> PDF (چاپ و پاشەکەوت)</button>
            </section>
          </div>
        }
        @if (settingsOpen()) {
          <div class="modal-shade" (click)="settingsOpen.set(false)">
            <section class="settings-modal" (click)="$event.stopPropagation()">
              <button type="button" class="close-button" (click)="settingsOpen.set(false)"><mat-icon>close</mat-icon></button>
              <h2>سێتینگ</h2><label>کلیلەکانی Gemini API</label>
              <p class="server-key-status" [class.server-key-missing]="serverKeyStatus() === 'missing'">{{ serverKeyMessage() }}</p>
              <label>مۆدێل</label><select [value]="gemini.preferredModel()" (change)="gemini.setPreferredModel(valueOf($event))"><option value="gemini-2.5-flash">gemini-2.5-flash</option><option value="gemini-2.5-pro">gemini-2.5-pro</option></select>
              <label class="theme-row"><input type="checkbox" [checked]="host().academicDarkMode()" (change)="toggleTheme($event)"> شێوازی تاریک</label>
            </section>
          </div>
        }
      </main>
    }
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#f8fafc; font-family:Vazirmatn,"Noto Naskh Arabic",system-ui,sans-serif; }
    .preview-screen { min-height:100vh; position:relative; isolation:isolate; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:8vh 2rem; overflow:hidden; background:#142821 url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85") center/cover no-repeat; }
    .preview-shade { position:absolute; inset:0; z-index:-1; background:linear-gradient(180deg,rgba(8,15,12,.32),rgba(8,15,12,.45) 55%,rgba(8,15,12,.68)); }
    .preview-screen h1 { margin:5vh 0 1rem; text-align:center; font-size:clamp(3rem,8vw,7.5rem); font-weight:900; letter-spacing:.04em; color:#fff9dd; text-shadow:0 2px 6px #fff5,0 0 22px #ffd978,0 0 55px #ffc14c; }
    .preview-screen>p { text-align:center; font-size:clamp(1rem,2vw,1.35rem); color:#fff; text-shadow:0 2px 8px #000; }
    .preview-actions { position:absolute; top:1.5rem; right:1.5rem; display:flex; flex-direction:column; gap:.75rem; }
    .preview-icon { width:4.5rem; min-height:4.5rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.2rem; border:1px solid #fff8; border-radius:1rem; color:white; background:#11182799; backdrop-filter:blur(12px); cursor:pointer; }
    .preview-icon mat-icon { font-size:1.5rem; width:1.5rem; height:1.5rem; }.preview-icon span { font-size:.72rem; }
    .book-app { min-height:100vh; background:#0b1220; color:#e2e8f0; padding-bottom:1.5rem; }
    .book-header { min-height:4rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.75rem clamp(1rem,4vw,3rem); background:#111b2e; border-bottom:1px solid #26344b; }
    .book-header strong { text-align:center; }.header-button { border:0; background:transparent; color:#e2e8f0; display:flex; align-items:center; gap:.4rem; cursor:pointer; }
    .window-one,.window-two { width:min(1100px,calc(100% - 2rem)); margin:1.5rem auto; }
    .form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; margin-bottom:1rem; }
    .form-grid label,.drawer>label,.settings-modal>label { display:flex; flex-direction:column; gap:.45rem; color:#e2e8f0; font-size:.93rem; font-weight:700; }
    .wide { grid-column:1/-1; }
    input:not([type=checkbox]):not([type=range]),select,textarea { width:100%; min-width:0; padding:.75rem; border:1px solid #34445f; border-radius:.7rem; background:#111b2e; color:#f8fafc; font:inherit; }
    textarea { resize:vertical; line-height:1.8; } input[type=range] { width:100%; accent-color:#eab308; }
    small { color:#facc15; font-weight:500; line-height:1.7; }
    .settings-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:.6rem; padding:1rem; border:1px solid #2b3a51; border-radius:1rem; background:#111b2e; margin:1.25rem 0; }
    .toggle-row { display:flex; align-items:center; gap:.65rem; font-size:.87rem; cursor:pointer; }.toggle-row input,.theme-row input { accent-color:#eab308; width:1rem; height:1rem; }
    .drawer { padding:1rem; margin:1rem 0; background:#111b2e; border:1px solid #34445f; border-radius:1rem; display:grid; grid-template-columns:1fr auto; gap:1rem; }
    .file-button { display:flex; align-items:center; justify-content:center; padding:.7rem; border:1px dashed #64748b; border-radius:.7rem; cursor:pointer; color:#fde68a; }.file-button input { max-width:15rem; }
    .control-grid { margin-top:1.25rem; padding:1rem; border-radius:1rem; background:#111b2e; }
    .cover-fields { padding:1rem; border:1px solid #34445f; border-radius:1rem; }
    .restored-tools { display:flex; flex-wrap:wrap; gap:.6rem; margin:1rem 0; }.restored-tools button,.bottom-actions button { display:flex; align-items:center; justify-content:center; gap:.4rem; padding:.65rem .85rem; border:1px solid #34445f; border-radius:.7rem; background:#15233a; color:#e2e8f0; cursor:pointer; }
    .primary-button { display:flex; justify-content:center; align-items:center; gap:.5rem; padding:.8rem 1.2rem; border:0; border-radius:.75rem; background:#ca8a04; color:#111827; font-weight:800; cursor:pointer; }.send-button { margin-inline-start:auto; }
    .parts-column { display:flex; flex-direction:column; gap:.8rem; }.part-card { position:relative; display:grid; grid-template-columns:2.5rem 1fr; gap:.8rem; padding:1rem; background:#111b2e; border:1px solid #334155; border-radius:1rem; }.part-card:before { content:""; position:absolute; top:100%; right:2.15rem; height:.85rem; border-right:2px dashed #eab30877; }.part-card:last-child:before { display:none; }
    .chain-link { display:flex; align-items:flex-start; justify-content:center; color:#facc15; font-size:1.5rem; }.part-heading { display:flex; justify-content:space-between; align-items:center; gap:1rem; }.part-heading h2 { margin:0; font-size:1rem; }.part-content p { color:#94a3b8; white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.8; }.part-done { border-color:#15803d; }.part-status { font-size:.75rem; color:#facc15; }.eye-button { display:inline-flex; align-items:center; gap:.3rem; padding:.35rem .65rem; border:1px solid #475569; border-radius:.5rem; color:#e2e8f0; background:#17243a; cursor:pointer; }.eye-button:disabled { opacity:.4; cursor:not-allowed; }
    .bottom-actions { position:sticky; bottom:.5rem; display:flex; flex-wrap:wrap; justify-content:center; gap:.55rem; margin-top:1.5rem; padding:.75rem; background:#0b1220eF; border:1px solid #334155; border-radius:1rem; backdrop-filter:blur(8px); }.bottom-actions button:disabled { opacity:.5; cursor:wait; }
    .status-message,.error-message { padding:.75rem 1rem; border-radius:.7rem; background:#17243a; color:#fde68a; }.error-message { color:#fecaca; background:#451a1a; }
    .modal-shade { position:fixed; z-index:1000; inset:0; display:grid; place-items:center; padding:1rem; background:#020617c9; }.settings-modal,.reader-modal { position:relative; width:min(620px,100%); max-height:90vh; overflow:auto; padding:1.5rem; border:1px solid #475569; border-radius:1rem; background:#111b2e; box-shadow:0 24px 80px #0009; display:flex; flex-direction:column; gap:.8rem; }.settings-modal h2,.reader-modal h2 { margin:0 0 .4rem; }.close-button { position:absolute; top:.75rem; left:.75rem; display:grid; place-items:center; border:0; border-radius:50%; width:2rem; height:2rem; color:white; background:#29384f; cursor:pointer; }.reader-modal { width:min(900px,100%); }.reader-modal header { display:flex; align-items:center; justify-content:space-between; }.reader-modal textarea { min-height:60vh; }
    .theme-row { display:flex; align-items:center; gap:.5rem; }.settings-modal .primary-button { align-self:flex-start; }
    .server-key-status { margin:0; color:#bbf7d0; line-height:1.8; }.server-key-missing { color:#fecaca; }
    @media(max-width:680px) { .preview-screen { padding:12vh 1rem; }.preview-actions { top:1rem; right:1rem; }.form-grid { grid-template-columns:1fr; }.wide { grid-column:auto; }.drawer { grid-template-columns:1fr; }.book-header strong { font-size:.85rem; }.bottom-actions button { flex:1 1 40%; font-size:.78rem; } }
  `]
})
export class MamBookLibraryComponent {
  readonly gemini = inject(GeminiRequestManagerService);
  private readonly wordExport = inject(WordExportService);
  private readonly citations = inject(AcademicCitationManager);

  mode = input.required<BookView>();
  host = input.required<MamBookHost>();
  modeChange = output<BookView>();

  parts = signal<BookPart[]>([]);
  readerPart = signal<BookPart | null>(null);
  settingsOpen = signal(false);
  exportDialogOpen = signal(false);
  busy = signal(false);
  paused = signal(false);
  statusMessage = signal('');
  errorMessage = signal('');
  copyStyleOn = signal(false);
  comparisonOn = signal(false);
  styleFileName = signal('');
  compareOneFileName = signal('');
  compareTwoFileName = signal('');
  cover = signal<CoverInfo>({ university: '', researcher: '', supervisor: '', year: String(new Date().getFullYear()) });
  private resumeGeneration: (() => void) | null = null;
  serverKeyStatus = signal<'checking' | 'configured' | 'missing' | 'unavailable'>('checking');
  serverKeyCount = signal(0);

  serverKeyMessage = () => {
    switch (this.serverKeyStatus()) {
      case 'configured': return `کلیلی Gemini لە سێرڤەری پارێزراودا ئامادەیە (${this.serverKeyCount()} کلیل).`;
      case 'missing': return 'کلیلی Gemini لە سێرڤەر نییە. GEMINI_API_KEY لە .env یان Secrets دابنێ و سێرڤەرەکە دووبارە دەست پێ بکە.';
      case 'unavailable': return 'دۆخی API نەزانراوە؛ سێرڤەری ناوخۆیی نوێ بکەرەوە و دووبارە هەوڵ بدەرەوە.';
      default: return 'پشکنینی ڕێکخستنی Gemini لە سێرڤەری ناوخۆیی...';
    }
  };

  totalWords = () => Math.max(1, Number(this.host().refineForm.get('targetPages')?.value) || 1) * 300;
  partCount = () => Math.max(1, Math.ceil((Number(this.host().refineForm.get('targetPages')?.value) || 1) / 10));

  valueOf(event: Event): string { return (event.target as HTMLSelectElement).value; }
  checkedOf(event: Event): boolean { return (event.target as HTMLInputElement).checked; }

  openSettings(): void {
    this.settingsOpen.set(true);
    this.serverKeyStatus.set('checking');
    void fetch('/api/gemini/key-status')
      .then(async response => {
        if (!response.ok) throw new Error(`API status request failed (${response.status}).`);
        return response.json() as Promise<{ configured?: boolean; keyCount?: number }>;
      })
      .then(status => {
        this.serverKeyCount.set(Number(status.keyCount) || 0);
        this.serverKeyStatus.set(status.configured ? 'configured' : 'missing');
      })
      .catch(() => this.serverKeyStatus.set('unavailable'));
  }

  toggleTheme(event: Event): void {
    const enabled = this.checkedOf(event);
    this.host().academicDarkMode.set(enabled);
    if (typeof localStorage !== 'undefined') localStorage.setItem('mam_dark_mode', String(enabled));
  }

  toggleFormControl(controlName: string): void {
    const control = this.host().refineForm.get(controlName);
    if (control) control.setValue(!control.value);
  }

  rememberFile(event: Event, slot: 'style' | 'one' | 'two'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (slot === 'style') this.styleFileName.set(file.name);
    if (slot === 'one') this.compareOneFileName.set(file.name);
    if (slot === 'two') this.compareTwoFileName.set(file.name);
  }

  updateCover(key: keyof CoverInfo, event: Event): void {
    this.cover.update(current => ({ ...current, [key]: (event.target as HTMLInputElement).value }));
  }

  createParts(): void {
    const form = this.host().refineForm;
    if (form.invalid) {
      form.markAllAsTouched();
      this.errorMessage.set('تکایە ناونیشان و زانیارییە پێویستەکان پڕ بکەرەوە.');
      return;
    }
    const pages = Math.max(1, Math.floor(Number(form.get('targetPages')?.value) || 1));
    const count = Math.ceil(pages / 10);
    form.patchValue({ size: pages, targetWordCount: pages * 300, targetChapters: count, chapterCount: count });
    const title = String(form.get('title')?.value || 'کتێب');
    const outline = form.get('customTOCOn')?.value
      ? String(form.get('customTOCText')?.value || '').split(/\r?\n/).map(line => line.replace(/^\s*[\d٠-٩۰-۹١٢٣٤٥٦٧٨٩]+[.)،:\-]?\s*/, '').trim()).filter(Boolean)
      : [];
    this.parts.set(Array.from({ length: count }, (_, index) => ({
      number: index + 1,
      title: `بەشی ${this.kurdishNumber(index + 1)}: ${outline[index] || title}`,
      content: '',
      status: 'pending',
      previousSummary: ''
    })));
    this.errorMessage.set('');
    this.statusMessage.set(`${count.toLocaleString('ckb-IQ')} بەشی پەیوەست ئامادە کرا.`);
    this.modeChange.emit('mam-window2');
    void this.persistProject();
  }

  async autoWrite(): Promise<void> {
    await this.runSequentially(false);
  }

  async autoHumanize(): Promise<void> {
    await this.runSequentially(true);
  }

  private async runSequentially(humanize: boolean): Promise<void> {
    if (this.busy()) return;
    if (this.parts().length === 0) {
      this.errorMessage.set('هیچ بەشێک نییە؛ تکایە سەرەتا پڕۆژەکە ڕێک بخە.');
      return;
    }
    const form = this.host().refineForm;
    if (form.get('customSourcesOn')?.value && !String(form.get('customSourcesText')?.value || '').trim()) {
      this.errorMessage.set('قوفڵی سەرچاوە تایبەت چالاکە، بەڵام لیستی سەرچاوەکان بەتاڵە؛ بۆ پاراستنی قوفڵ نووسین ڕاگیرا.');
      return;
    }
    this.busy.set(true);
    this.paused.set(false);
    this.errorMessage.set('');
    const stage = humanize ? 'هیومانایزکردن' : 'نووسین';
    try {
      for (let index = 0; index < this.parts().length; index++) {
        await this.waitWhilePaused();
        const part = this.parts()[index];
        if (!humanize && part.status === 'complete') continue;
        if (humanize && !part.content.trim()) continue;
        this.setPart(part.number, { ...part, status: 'writing' });
        this.statusMessage.set(`${stage}: ${part.title}`);
        const previous = index > 0 ? this.parts()[index - 1] : undefined;
        const lastParagraph = previous?.content.trim().split(/\n\s*\n/).at(-1) || '';
        const continuity = previous?.content
          ? `پوختەی بەشی پێشوو:\n${previous.previousSummary}\n\nکۆتا پاراگرافی بەشی پێشوو:\n${lastParagraph.slice(-1200)}`
          : 'ئەمە بەشی یەکەمی کتێبە.';
        const controls: string[] = [];
        if (form.get('roleCritic')?.value) controls.push('ڕۆڵەکانی نووسەر، ڕەخنەگر و پێداچوونەوە بە نۆرە جێبەجێ بکە؛ کێشەکان چاک بکە پێش دەرکردنی دەق.');
        if (form.get('dialectThesis')?.value) controls.push('هەر بڕگەیەک بە تێز، دژەتێز و سێنتێزی ڕەخنەیی ڕێک بخە.');
        if (this.copyStyleOn() && String(form.get('copyStyleText')?.value || '').trim()) controls.push(`تایبەتمەندییەکانی شێوازی ئەم نموونەیە وەربگرە، بەڵام دەقەکە لە خۆت دروست بکە:\n${form.get('copyStyleText')?.value}`);
        if (this.comparisonOn()) controls.push(`بەراورد لەسەر ئەم تەوەرە بکە: ${form.get('compareAspect')?.value || ''}\nسەرچاوەی یەکەم:\n${form.get('compareFile1')?.value || ''}\nسەرچاوەی دووەم:\n${form.get('compareFile2')?.value || ''}`);
        if (form.get('customSourcesOn')?.value) controls.push(`قوفڵی سەرچاوە: تەنها لەم لیستە سەرچاوە بدە و هیچ سەرچاوەیەکی تر زیاد مەکە:\n${form.get('customSourcesText')?.value}`);
        if (form.get('customTOCOn')?.value) controls.push(`قوفڵی پێڕست: سەردێڕ و ڕیزبەندیی دیاریکراو مەگۆڕە:\n${form.get('customTOCText')?.value}`);
        controls.push(`شێوازی پەراوێز: ${form.get('citationStyle')?.value || 'chicago'}.`);
        const directives = humanize
          ? 'تەنها دەقی کوردیی ئەم بەشە بە شێوەی مرۆیی، ڕەوان و ئەکادیمی بازنووسە؛ ناوەڕۆک و بەڵگەکان بپارێزە.'
          : 'بەشێکی کوردیی ڕەسەن، ڕێکخراو و ئەکادیمی بنووسە. دروستکردنی سەرچاوە و زانیاریی ساختە مەکە. بەردەوام بە لە کۆتا بیرۆکەی بەشی پێشوو.';
        const prompt = `${directives}\n\nناونیشانی کتێب: ${form.get('title')?.value}\nبابەت: ${form.get('discipline')?.value}\nجۆری نووسین: ${form.get('writingType')?.value}\nئاست: ${form.get('academicLevel')?.value}\n${controls.join('\n\n')}\n${continuity}\n\n${humanize ? `دەقی ئێستا:\n${part.content}` : `ناونیشانی بەش: ${part.title}\nئامانج: نزیکەی ${Math.ceil(this.totalWords() / this.parts().length)} وشە.`}`;
        const content = await this.gemini.callGeminiApi(
          prompt,
          'وەک مامۆستای زانکۆیی کوردی بنووسە. ڕێنووسی کوردی، ڕێکخستنی بەش و پەیوەندیی زنجیرەیی بپارێزە.',
          {
            temperature: Number(this.host().refineForm.get('temperature')?.value) || 0.7,
            thinkingBudgetTokens: Number(this.host().refineForm.get('thinkingTokens')?.value) || 8192,
            maxOutputTokens: Number(this.host().refineForm.get('writingTokens')?.value) || 8192,
            model: this.gemini.preferredModel()
          }
        );
        if (!content.trim()) throw new Error(`بەشی ${part.number} وەڵامی بەتاڵی وەرگرت.`);
        this.setPart(part.number, {
          ...this.parts().find(item => item.number === part.number)!,
          content,
          previousSummary: this.extractSummary(content),
          status: 'complete'
        });
        await this.persistProject();
      }
      this.statusMessage.set(humanize ? 'هیومانایزکردنی بەشە ئامادەکان تەواو بوو.' : 'نووسینی زنجیرەیی تەواو بوو.');
    } catch (error) {
      const current = this.parts().find(part => part.status === 'writing');
      if (current) this.setPart(current.number, { ...current, status: 'error' });
      this.errorMessage.set(error instanceof Error ? error.message : 'نووسینی بەشەکان سەرکەوتوو نەبوو.');
    } finally {
      this.paused.set(false);
      this.resumeGeneration?.();
      this.resumeGeneration = null;
      this.busy.set(false);
    }
  }

  togglePause(): void {
    if (!this.busy()) return;
    if (this.paused()) {
      this.paused.set(false);
      this.resumeGeneration?.();
      this.resumeGeneration = null;
      this.statusMessage.set('نووسینی زنجیرەیی بەردەوام بوو.');
      return;
    }
    this.paused.set(true);
    this.statusMessage.set('نووسین لە کۆتایی بەشی جاری ڕادەوەستێت.');
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.paused()) {
      await new Promise<void>(resolve => { this.resumeGeneration = resolve; });
      this.resumeGeneration = null;
    }
  }

  async reviewStructure(): Promise<void> {
    if (this.busy()) return;
    const title = String(this.host().refineForm.get('title')?.value || '');
    const names = this.parts().map(part => part.title).join('\n');
    if (!names) {
      this.errorMessage.set('پێش پێداچوونەوە، بەشەکان دروست بکە.');
      return;
    }
    this.busy.set(true);
    this.errorMessage.set('');
    try {
      const result = await this.gemini.callGeminiApi(`ناونیشانی کتێب: ${title}\nئەم سەردێڕانە ڕێک بخە و تەنها هەمان ژمارەی سەردێڕ بە هێڵی جیاواز بگەڕێنەوە:\n${names}`, 'تەنها پێکهاتە و ناونیشانەکان بە کوردیی ڕوون چاک بکە.');
      const updated = result.split(/\r?\n/).map(line => line.replace(/^\s*[\d٠-٩۰-۹١٢٣٤٥٦٧٨٩]+[.)،:\-]?\s*/, '').trim()).filter(Boolean);
      if (updated.length !== this.parts().length) throw new Error('وەڵامی پێداچوونەوە ژمارەی سەردێڕەکان گۆڕی؛ ناونیشانەکان نەگۆڕدران.');
      this.parts.update(parts => parts.map((part, index) => ({ ...part, title: updated[index] })));
      this.statusMessage.set('ناونیشانی بەشەکان چاککران.');
      await this.persistProject();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'پێداچوونەوەی پێکهاتە سەرکەوتوو نەبوو.');
    } finally {
      this.busy.set(false);
    }
  }

  openReader(number: number): void {
    const part = this.parts().find(item => item.number === number);
    if (part?.status === 'complete') this.readerPart.set({ ...part });
  }

  updatePartContent(number: number, event: Event): void {
    const content = (event.target as HTMLTextAreaElement).value;
    this.setPart(number, { ...this.parts().find(part => part.number === number)!, content });
    this.readerPart.update(part => part?.number === number ? { ...part, content } : part);
    void this.persistProject();
  }

  async saveAll(format: 'docx' | 'pdf'): Promise<void> {
    const chapters = this.parts().map(part => ({ title: part.title, content: part.content }));
    if (chapters.length === 0) {
      this.errorMessage.set('هیچ بەشێک بۆ هەناردەکردن نییە.');
      return;
    }
    if (chapters.some(chapter => !chapter.content.trim())) {
      this.errorMessage.set('هەموو بەشەکان هێشتا تەواو نەکراون؛ پێش Save All نووسینیان تەواو بکە.');
      return;
    }
    this.busy.set(true);
    this.errorMessage.set('');
    try {
      const title = String(this.host().refineForm.get('title')?.value || 'کتێب');
      const cover = this.cover();
      const footnotes = this.citations.getAllFootnotes().map(item => item.formattedFootnote).join('\n');
      const sources = this.citations.getAllSources().map(source =>
        `${source.author} (${source.year})، ${source.title}، ${source.publisherOrJournal}${source.citedPageOrNote ? `، ${source.citedPageOrNote}` : ''}`
      ).join('\n');
      const allChapters = [
        { title: 'بەرگی تێز', content: `${title}\n${cover.university}\n${cover.researcher}\n${cover.supervisor}\n${cover.year}` },
        ...chapters,
        { title: 'پەراوێز', content: footnotes || 'هیچ پەراوێزێک تۆمار نەکراوە.' },
        { title: 'لیستی سەرچاوەکان', content: sources || 'هیچ سەرچاوەیەک تۆمار نەکراوە.' }
      ];
      if (format === 'docx') {
        const blob = await this.wordExport.generateDocxBlob(title, String(this.host().refineForm.get('discipline')?.value || ''), String(this.host().refineForm.get('academicLevel')?.value || ''), allChapters);
        this.downloadBlob(blob, `${this.safeFilename(title)}.docx`);
        this.statusMessage.set('کتێبەکە بە فایلی Word هەناردە کرا.');
      } else {
        this.wordExport.exportToPrintablePdf({
          title,
          discipline: String(this.host().refineForm.get('discipline')?.value || ''),
          academicLevel: String(this.host().refineForm.get('academicLevel')?.value || ''),
          chapters: allChapters
        });
        this.statusMessage.set('پەنجەرەی چاپی PDF کراوەتەوە؛ لەوێدا PDF پاشەکەوت بکە.');
      }
      this.exportDialogOpen.set(false);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'هەناردەکردنی Word سەرکەوتوو نەبوو.');
    } finally {
      this.busy.set(false);
    }
  }

  excerpt(text: string): string { return text.length > 260 ? `${text.slice(0, 260)}…` : text; }

  openTool(tab: WorkspaceTab): void {
    this.host().mainTab.set(tab);
    this.modeChange.emit('workspace' as BookView);
  }

  private async persistProject(): Promise<void> {
    try {
      const response = await fetch('/api/local-storage/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `projects/${this.safeFilename(String(this.host().refineForm.get('title')?.value || 'book'))}.json`,
          data: { form: this.host().refineForm.getRawValue(), parts: this.parts(), cover: this.cover() }
        })
      });
      if (!response.ok) throw new Error(`Local project save failed (${response.status}).`);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'پاشەکەوتی لۆکاڵی سەرکەوتوو نەبوو.');
    }
  }

  private setPart(number: number, updated: BookPart): void {
    this.parts.update(parts => parts.map(part => part.number === number ? updated : part));
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private safeFilename(value: string): string {
    return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim().slice(0, 100) || 'book';
  }

  private kurdishNumber(number: number): string {
    return number.toLocaleString('ckb-IQ');
  }

  private extractSummary(text: string): string {
    return text.split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean).slice(0, 2).join('\n\n').slice(0, 800);
  }
}
