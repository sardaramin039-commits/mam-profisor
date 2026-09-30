import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type MainTab = 'library' | 'editor' | 'suite' | 'advanced_research' | 'google_drive' | 'platform';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
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

      <nav class="mam-nav" aria-label="بەشە سەرەکییەکان">
        <p class="mam-nav-label">کار</p>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'editor'"
                (click)="selectTab.emit('editor'); closeMobileNav()">
          <mat-icon>history_edu</mat-icon>
          <span><b>نووسین</b><small>تێز، وتار و کتێب</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'advanced_research'"
                (click)="selectTab.emit('advanced_research'); closeMobileNav()">
          <mat-icon>hub</mat-icon>
          <span><b>توێژینەوە</b><small>ڕەچاوکردن و بەڵگە</small></span>
        </button>

        <p class="mam-nav-label">ئامراز</p>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'platform'"
                (click)="selectTab.emit('platform'); closeMobileNav()">
          <mat-icon>account_tree</mat-icon>
          <span><b>پلاتفۆرمی زانستی</b><small>کارەکانی توێژینەوە</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'suite'"
                (click)="selectTab.emit('suite'); closeMobileNav()">
          <mat-icon>build</mat-icon>
          <span><b>ئامرازەکان</b><small>ئامرازە پێویستەکان</small></span>
        </button>

        <button type="button" class="mam-nav-item" [class.active]="mainTab() === 'google_drive'"
                (click)="selectTab.emit('google_drive'); closeMobileNav()">
          <mat-icon>cloud</mat-icon>
          <span><b>هاوبەشی و فایل</b><small>گووگڵ و کارەکان</small></span>
        </button>
      </nav>

      <div class="mam-sidebar-bottom">
        <button type="button" class="mam-sidebar-action" (click)="openReadingMode.emit(); closeMobileNav()">
          <mat-icon>menu_book</mat-icon>
          <span>دۆخی خوێندنەوە</span>
        </button>

        <button type="button" class="mam-sidebar-action" (click)="toggleDarkMode.emit()">
          <mat-icon>{{ academicDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          <span>{{ academicDarkMode() ? 'ڕووناکی' : 'تاریکی' }}</span>
        </button>

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
        <div class="mam-trust-badge">
          <mat-icon>verified_user</mat-icon>
          <span>سەرچاوە و بەڵگە بە شێوەی ڕوون</span>
        </div>

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
  \`
})
export class DashboardHeaderComponent {
  mainTab = input<MainTab>('editor');
  currentUser = input<any>(null);
  academicDarkMode = input(false);

  goSplash = output<void>();
  selectTab = output<MainTab>();
  loginWithGoogle = output<void>();
  logout = output<void>();
  openReadingMode = output<void>();
  toggleDarkMode = output<void>();
  clearEditor = output<void>();

  mobileNavOpen = signal(false);

  toggleMobileNav(): void {
    this.mobileNavOpen.update(open => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  tabLabel(tab: MainTab): string {
    const labels: Record<MainTab, string> = {
      library: 'کتێبخانە',
      editor: 'نووسین',
      suite: 'ئامرازەکان',
      advanced_research: 'توێژینەوە',
      google_drive: 'هاوبەشی و فایل',
      platform: 'پلاتفۆرمی زانستی'
    };
    return labels[tab];
  }
}
