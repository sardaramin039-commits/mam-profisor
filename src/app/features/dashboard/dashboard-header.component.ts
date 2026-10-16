import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BackupRestoreService } from '../../core/services/backup-restore.service';

type MainTab = 'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive' | 'platform';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mam-sidebar-backdrop" [class.is-open]="mobileNavOpen()" (click)="closeMobileNav()"></div>

    <aside class="mam-sidebar" [class.is-open]="mobileNavOpen()" aria-label="ناڤیگەیشنی مام پڕۆفیسۆر">
      <div class="mam-brand">
        <button type="button" class="mam-brand-mark" (click)="goSplash.emit()" aria-label="گەڕانەوە بۆ پەڕەی سەرەکی">
          <mat-icon>auto_stories</mat-icon>
        </button>
        <div>
          <strong>مام پڕۆفیسۆر</strong>
          <span>ناوەندی نووسین و توێژینەوە</span>
        </div>
      </div>

      <button type="button" class="mam-new-project" (click)="goSplash.emit(); closeMobileNav()">
        <mat-icon>add</mat-icon>
        <span>پڕۆژەی نوێ</span>
      </button>

      <nav class="mam-nav" aria-label="هەنگاوەکانی پێڕەوی ئەکادیمی">
        <p class="mam-nav-label">پێڕەوی ٥ هەنگاوی ئەکادیمی</p>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'advanced_research'"
                (click)="selectTab.emit('advanced_research'); closeMobileNav()">
          <span class="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold font-mono">١</span>
          <mat-icon class="!text-lg !w-4 !h-4">architecture</mat-icon>
          <span><b>نەخشەسازیی توێژینەوە</b><small>Blueprint & Setup - ئامادەکاری و میتۆد</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'library'"
                (click)="selectTab.emit('library'); closeMobileNav()">
          <span class="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold font-mono">٢</span>
          <mat-icon class="!text-lg !w-4 !h-4">auto_stories</mat-icon>
          <span><b>کتێبخانە و سەرچاوەکان</b><small>Digital Library & Citations - بەڵگە و ژێدەر</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'editor'"
                (click)="selectTab.emit('editor'); closeMobileNav()">
          <span class="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold font-mono">٣</span>
          <mat-icon class="!text-lg !w-4 !h-4">history_edu</mat-icon>
          <span><b>نووسینگە و دەستنووس</b><small>Thesis Editor & Copilot - داڕشتنی بەشەکان</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'platform'"
                (click)="selectTab.emit('platform'); closeMobileNav()">
          <span class="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold font-mono">٤</span>
          <mat-icon class="!text-lg !w-4 !h-4">fact_check</mat-icon>
          <span><b>پشکنینی زانستی و زمانەوانی</b><small>Quality, Tone & Plagiarism Audit</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'suite'"
                (click)="selectTab.emit('suite'); closeMobileNav()">
          <span class="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold font-mono">٥</span>
          <mat-icon class="!text-lg !w-4 !h-4">school</mat-icon>
          <span><b>چاپ و بەرگریی تێز</b><small>Formatting, Export & Viva Defense</small></span>
        </button>
      </nav>

      <div class="mam-sidebar-bottom">
        <button type="button" class="mam-sidebar-action" (click)="selectTab.emit('google_drive'); closeMobileNav()">
          <mat-icon>cloud</mat-icon>
          <span>هاوبەشی و فایل</span>
        </button>

        <button type="button" class="mam-sidebar-action" (click)="toggleFocusMode.emit(); closeMobileNav()">
          <mat-icon>{{ isFocusMode() ? 'fullscreen_exit' : 'center_focus_strong' }}</mat-icon>
          <span>{{ isFocusMode() ? 'دەرچوون لە سەرنج' : 'دۆخی سەرنج (Focus Mode)' }}</span>
        </button>

        <button type="button" class="mam-sidebar-action" (click)="openReadingMode.emit(); closeMobileNav()">
          <mat-icon>menu_book</mat-icon>
          <span>دۆخی خوێندنەوە</span>
        </button>

        <button type="button" class="mam-sidebar-action" (click)="toggleDarkMode.emit()">
          <mat-icon>{{ academicDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          <span>{{ academicDarkMode() ? 'ڕووناکی' : 'تاریکی' }}</span>
        </button>

        <button type="button" class="mam-sidebar-action" (click)="backupService.exportFullBackup()">
          <mat-icon>download</mat-icon>
          <span>داگرتنی فایلی پڕۆژە (.json)</span>
        </button>

        <button type="button" class="mam-sidebar-action" (click)="backupFileInput.click()">
          <mat-icon>upload_file</mat-icon>
          <span>گەڕاندنەوەی پڕۆژە</span>
        </button>

        <input type="file" #backupFileInput class="hidden" accept=".json" (change)="onBackupFileSelected($event)" />

        <button type="button" class="mam-sidebar-action danger" (click)="clearEditor.emit(); closeMobileNav()">
          <mat-icon>restart_alt</mat-icon>
          <span>پاککردنەوەی پڕۆژە</span>
        </button>

        @if (currentUser()) {
          <div class="mam-user-card">
            @if (currentUser()?.photoURL) {
              <img [src]="currentUser()?.photoURL" alt="وێنەی بەکارهێنەر" referrerpolicy="no-referrer">
            } @else {
              <mat-icon>person</mat-icon>
            }
            <div class="mam-user-text">
              <strong>{{ currentUser()?.displayName || 'بەکارهێنەر' }}</strong>
              <span>چوونەژوورەوە کراوە</span>
            </div>
            <button type="button" (click)="logout.emit()" title="دەرچوون">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        } @else {
          <button type="button" class="mam-login" (click)="loginWithGoogle.emit()">
            <mat-icon>login</mat-icon>
            <span>چوونەژوورەوە</span>
          </button>
        }
      </div>
    </aside>

    <header class="mam-topbar">
      <div class="mam-topbar-left">
        <button type="button" class="mam-menu-button" (click)="toggleMobileNav()" aria-label="کردنەوەی ڕێنوێن">
          <mat-icon>{{ mobileNavOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
        <div class="mam-breadcrumb">
          <span>ناوەندی مام پڕۆفیسۆر</span>
          <mat-icon>chevron_left</mat-icon>
          <strong>{{ tabLabel(mainTab()) }}</strong>
        </div>
      </div>

      <div class="mam-topbar-right">
        <div class="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white rounded-full text-xs font-bold shadow-sm border border-amber-300/40">
          <mat-icon class="!text-sm">workspace_premium</mat-icon>
          <span>ئاستی پڕۆ • Pro Active</span>
        </div>

        <!-- 1-Click Backup / Restore Action Buttons in Topbar -->
        <button type="button" class="mam-top-action" (click)="backupService.exportFullBackup()" title="داگرتنی هەموو داتاکانی تێز بە فایلی JSON">
          <mat-icon>download</mat-icon>
          <span>داگرتنی فایلی پڕۆژە (.json)</span>
        </button>

        <button type="button" class="mam-top-action" (click)="topbarFileInput.click()" title="گەڕاندنەوەی تێز لە فایلی JSON">
          <mat-icon>upload_file</mat-icon>
          <span>گەڕاندنەوەی پڕۆژە</span>
        </button>
        <input type="file" #topbarFileInput class="hidden" accept=".json" (change)="onBackupFileSelected($event)" />

        <button type="button" class="mam-top-action" [class.primary]="isFocusMode()" (click)="toggleFocusMode.emit()" title="دۆخی سەرنج (Focus Mode) - نووسینی ئارام و بێ بەربەست">
          <mat-icon>{{ isFocusMode() ? 'fullscreen_exit' : 'center_focus_strong' }}</mat-icon>
          <span>{{ isFocusMode() ? 'دەرچوون لە سەرنج' : 'دۆخی سەرنج' }}</span>
        </button>

        <button type="button" class="mam-top-action" (click)="openReadingMode.emit()" title="دۆخی خوێندنەوە">
          <mat-icon>menu_book</mat-icon>
          <span>خوێندنەوە</span>
        </button>

        @if (currentUser()) {
          <button type="button" class="mam-top-action" (click)="logout.emit()">
            <mat-icon>logout</mat-icon>
            <span>دەرچوون</span>
          </button>
        } @else {
          <button type="button" class="mam-top-action primary" (click)="loginWithGoogle.emit()">
            <mat-icon>login</mat-icon>
            <span>چوونەژوورەوە</span>
          </button>
        }
      </div>
    </header>
  `
})
export class DashboardHeaderComponent {
  readonly backupService = inject(BackupRestoreService);

  mainTab = input<MainTab>('editor');
  currentUser = input<any>(null);
  academicDarkMode = input(false);
  isFocusMode = input(false);

  goSplash = output<void>();
  selectTab = output<MainTab>();
  loginWithGoogle = output<void>();
  logout = output<void>();
  openReadingMode = output<void>();
  toggleDarkMode = output<void>();
  clearEditor = output<void>();
  toggleFocusMode = output<void>();

  mobileNavOpen = signal(false);

  toggleMobileNav(): void {
    this.mobileNavOpen.update(open => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  async onBackupFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      await this.backupService.restoreFromFile(input.files[0]);
      input.value = '';
    }
  }

  tabLabel(tab: MainTab): string {
    const labels: Record<MainTab, string> = {
      library: 'بەڵگە و سەرچاوە',
      editor: 'نووسین',
      suite: 'ئامراز و هەناردە',
      advanced_research: 'توێژینەوە',
      google_drive: 'هاوبەشی و فایل',
      platform: 'پشکنین و بڕواپێکراوی'
    };
    return labels[tab];
  }
}
