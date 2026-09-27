import { Injectable, signal } from '@angular/core';

export type ActiveDialog = 'export' | 'citations' | 'ai-prompt' | 'viva' | 'settings' | 'source-verify' | null;

@Injectable({
  providedIn: 'root'
})
export class AppDialogsService {
  readonly activeDialog = signal<ActiveDialog>(null);
  readonly dialogData = signal<unknown>(null);

  openDialog(dialog: ActiveDialog, data?: unknown) {
    this.dialogData.set(data ?? null);
    this.activeDialog.set(dialog);
  }

  closeDialog() {
    this.activeDialog.set(null);
    this.dialogData.set(null);
  }
}
