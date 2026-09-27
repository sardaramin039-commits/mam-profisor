import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GoogleTasksService, GoogleTask } from '../../services/google-tasks.service';
import { WorkspaceOAuthHelperService } from '../../services/workspace-oauth-helper.service';

@Component({
  selector: 'app-google-tasks-integration',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 dir-rtl">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <mat-icon>task_alt</mat-icon>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              پێوەندیکردن بە Google Tasks (Google Tasks Integration)
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-normal flex items-center gap-1">
                <mat-icon class="!w-3 !h-3 !text-[12px]">check_circle</mat-icon>
                Tasks Active
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              بەڕێوەبردنی ئەرکە ئەکادیمییەکان، وادەی ڕادەستکردنی بەشەکانی تێز و پلانی نووسین
            </p>
          </div>
        </div>

        @if (tasksService.isAuthenticated()) {
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
              <img [src]="tasksService.currentUser()?.photoURL || 'https://picsum.photos/seed/user/100/100'" 
                   alt="User" 
                   class="w-6 h-6 rounded-full border border-slate-600"
                   referrerpolicy="no-referrer" />
              <span class="text-xs text-slate-200 font-medium">
                {{ tasksService.currentUser()?.displayName || tasksService.currentUser()?.email }}
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Not Authenticated View -->
      @if (!tasksService.isAuthenticated()) {
        <div class="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
            <mat-icon class="!w-8 !h-8 !text-[32px]">checklist</mat-icon>
          </div>
          <h4 class="text-base font-bold text-white mb-2">به‌ستنه‌وه‌ی هەژماری Google Tasks</h4>
          <p class="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            بۆ سینکرۆنکردنی وادەکانی توێژینەوە، پلانی پێداچوونەوە و بەدواداچوونی ئەرکەکان لەگەڵ Google Tasks، چوونه‌ژووره‌وه‌ ئه‌نجام بده‌.
          </p>

          @if (oauthHelper.isRunningInIframe()) {
            <div class="w-full max-w-md mb-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-2 text-right">
              <div class="flex items-center gap-2">
                <mat-icon class="!w-4 !h-4 text-amber-400 shrink-0">info</mat-icon>
                <span>پۆپ-ئەپی OAuth لە فرەیمی پیشبینیندا لەوانەیە بلۆک بێت. ئەپەکە لە پەڕەیەکی نوێدا بکەرەوە.</span>
              </div>
              <button (click)="oauthHelper.openAppInNewTab()" 
                      type="button"
                      class="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 shadow-md shadow-amber-600/20">
                <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">launch</mat-icon>
                <span>New Tab</span>
              </button>
            </div>
          }

          <button (click)="handleConnect()"
                  [disabled]="tasksService.isLoading()"
                  class="relative inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-6 py-3 rounded-xl border border-blue-500/30 transition duration-200 shadow-lg disabled:opacity-50">
            @if (tasksService.isLoading()) {
              <mat-icon class="animate-spin">sync</mat-icon>
              <span>لە حاڵەتی پێوەندیکردندایە...</span>
            } @else {
              <mat-icon>login</mat-icon>
              <span>چوونەژوورەوە لەگەڵ Google Tasks</span>
            }
          </button>
        </div>
      }

      <!-- Authenticated View -->
      @if (tasksService.isAuthenticated()) {
        <div class="space-y-6">
          <!-- Add new Task form -->
          <div class="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <mat-icon class="text-blue-400 !w-5 !h-5 !text-[20px]">add_task</mat-icon>
              دروستکردنی ئەرکی نوێ لە Google Tasks
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-slate-400 mb-1">ناونیشانی ئەرک (Task Title):</label>
                <input type="text"
                       [(ngModel)]="newTaskTitle"
                       placeholder="پێداچوونەوەی سەرچاوەکانی بەشی دووەمی تێز"
                       class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition" />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">وادەی تەواوکردن (Due Date):</label>
                <input type="date"
                       [(ngModel)]="newTaskDueDate"
                       class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition" />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">تێبینی / ڕوونکردنەوە:</label>
                <input type="text"
                       [(ngModel)]="newTaskNotes"
                       placeholder="ناردن بۆ مامۆستای سەرپەرشتیار پێش تەواوبوونی هەفتە"
                       class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="promptConfirm()"
                      [disabled]="!newTaskTitle"
                      class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-40">
                <mat-icon class="!w-4 !h-4 !text-[16px]">playlist_add</mat-icon>
                زیادکردن بۆ Google Tasks
              </button>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="!w-4 !h-4 !text-[16px] text-blue-400">format_list_bulleted</mat-icon>
                ئەرکەکانت لە Google Tasks
              </h4>

              <button (click)="loadTasks()"
                      [disabled]="tasksService.isLoading()"
                      class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5">
                <mat-icon [class.animate-spin]="tasksService.isLoading()" class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
                تازەکردنەوە
              </button>
            </div>

            @if (tasksService.isLoading() && tasks().length === 0) {
              <div class="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <mat-icon class="animate-spin text-blue-400 !w-8 !h-8 !text-[32px]">sync</mat-icon>
                لە خوێندنەوەی ئەرکەکاندایە...
              </div>
            } @else if (tasks().length === 0) {
              <div class="py-10 text-center text-slate-500 text-xs bg-slate-950/20 border border-slate-800 rounded-xl">
                هیچ ئەرکێک نەدۆزرایەوە.
              </div>
            } @else {
              <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
                @for (t of tasks(); track t.id) {
                  <div class="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between transition"
                       [class.opacity-50]="t.status === 'completed'">
                    <div class="flex items-center gap-3">
                      <button (click)="toggleComplete(t)"
                              class="w-6 h-6 rounded-lg border flex items-center justify-center transition"
                              [class.bg-blue-600]="t.status === 'completed'"
                              [class.border-blue-500]="t.status === 'completed'"
                              [class.border-slate-700]="t.status !== 'completed'">
                        @if (t.status === 'completed') {
                          <mat-icon class="!w-4 !h-4 !text-[16px] text-white">check</mat-icon>
                        }
                      </button>

                      <div>
                        <p class="text-xs font-bold text-slate-200" [class.line-through]="t.status === 'completed'">
                          {{ t.title }}
                        </p>
                        @if (t.notes) {
                          <p class="text-[11px] text-slate-400 mt-0.5">{{ t.notes }}</p>
                        }
                      </div>
                    </div>

                    @if (t.due) {
                      <span class="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-slate-400">
                        {{ t.due.slice(0, 10) }}
                      </span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal Confirmation -->
      @if (showConfirmModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center gap-3 text-blue-400">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <mat-icon>task_alt</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white">پشتڕاستکردنەوەی دروستکردنی ئەرک</h4>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">
              ئایا دڵنیایت لە دروستکردنی ئەم ئەرکە لە هەژماری Google Tasks؟
            </p>

            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p class="text-slate-400">ناونیشان: <span class="text-white font-medium">{{ newTaskTitle }}</span></p>
              @if (newTaskDueDate) {
                <p class="text-slate-400">وادە: <span class="text-slate-200">{{ newTaskDueDate }}</span></p>
              }
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button (click)="showConfirmModal.set(false)"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition">
                پەشیمانبوونەوە
              </button>

              <button (click)="executeAddTask()"
                      [disabled]="isExecuting()"
                      class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-lg flex items-center gap-1.5">
                @if (isExecuting()) {
                  <mat-icon class="animate-spin !w-4 !h-4 !text-[16px]">sync</mat-icon>
                  <span>لە دروستکردندایە...</span>
                } @else {
                  <span>پشتڕاستکردنەوە</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Status Message -->
      @if (statusMessage()) {
        <div class="mt-4 p-3 rounded-xl text-xs flex items-center justify-between border"
             [ngClass]="{
               'bg-emerald-500/10 border-emerald-500/20 text-emerald-300': statusType() === 'success',
               'bg-rose-500/10 border-rose-500/20 text-rose-300': statusType() === 'error'
             }">
          <span class="flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-[16px]">
              {{ statusType() === 'success' ? 'check_circle' : 'error' }}
            </mat-icon>
            {{ statusMessage() }}
          </span>
          <button (click)="statusMessage.set(null)" class="text-slate-400 hover:text-white">
            <mat-icon class="!w-4 !h-4 !text-[16px]">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class GoogleTasksIntegrationComponent {
  tasksService = inject(GoogleTasksService);
  oauthHelper = inject(WorkspaceOAuthHelperService);

  newTaskTitle = '';
  newTaskDueDate = '';
  newTaskNotes = '';

  tasks = signal<GoogleTask[]>([]);

  showConfirmModal = signal<boolean>(false);
  isExecuting = signal<boolean>(false);

  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');

  async handleConnect() {
    const token = await this.tasksService.authenticateWithTasks();
    if (token) {
      this.showStatus('بە سەرکەوتوویی بەستنەوە لەگەڵ Google Tasks ئەنجامدرا.', 'success');
      this.loadTasks();
    }
  }

  async loadTasks() {
    try {
      const items = await this.tasksService.listTasks();
      this.tasks.set(items);
    } catch (err: any) {
      this.showStatus(`هەڵە لە خوێندنەوەی ئەرکەکان: ${err.message}`, 'error');
    }
  }

  promptConfirm() {
    this.showConfirmModal.set(true);
  }

  async executeAddTask() {
    this.isExecuting.set(true);
    try {
      const task = await this.tasksService.createTask(
        this.newTaskTitle,
        this.newTaskNotes,
        this.newTaskDueDate
      );

      this.tasks.update(prev => [task, ...prev]);
      this.showStatus(`ئەرکی '${task.title}' لە Google Tasks دروستکرا!`, 'success');
      this.newTaskTitle = '';
      this.newTaskDueDate = '';
      this.newTaskNotes = '';
      this.showConfirmModal.set(false);
    } catch (err: any) {
      this.showStatus(`هەڵە لە زیادرکردنی ئەرک: ${err.message}`, 'error');
    } finally {
      this.isExecuting.set(false);
    }
  }

  async toggleComplete(task: GoogleTask) {
    if (task.status === 'completed') return;
    try {
      await this.tasksService.completeTask(task.id);
      this.tasks.update(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
      this.showStatus(`ئەرکی '${task.title}' وەک تەواوکراو دیاری کرا.`, 'success');
    } catch (err: any) {
      this.showStatus(`هەڵە لە گۆڕینی دۆخی ئەرک: ${err.message}`, 'error');
    }
  }

  private showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage.set(msg);
    this.statusType.set(type);
    setTimeout(() => {
      if (this.statusMessage() === msg) {
        this.statusMessage.set(null);
      }
    }, 5000);
  }
}
