import { Directive, Input } from '@angular/core';
import type { AppComponent } from './app';
import { AppControllerActions } from './app-controller-actions';

@Directive()
export abstract class AppTemplateSectionBase extends AppControllerActions {
  private _host!: AppComponent;

  @Input({ required: true })
  get host(): AppComponent {
    return this._host;
  }

  set host(value: AppComponent) {
    this._host = value;
  }

  override ngOnInit(): void {
    // Section components must not execute the root application's startup lifecycle.
  }

  // Explicit host proxy methods for template bindings
  override addChapter(title?: string) { return this.host ? this.host.addChapter(title) : super.addChapter(title); }
  override renameChapter(id: number, title?: string) { if (this.host) this.host.renameChapter(id, title); else super.renameChapter(id, title); }
  override deleteChapter(id: number) { if (this.host) this.host.deleteChapter(id); else super.deleteChapter(id); }
  override moveChapterUp(id: number) { if (this.host) this.host.moveChapterUp(id); else super.moveChapterUp(id); }
  override moveChapterDown(id: number) { if (this.host) this.host.moveChapterDown(id); else super.moveChapterDown(id); }
  override addAxis(id: number, title?: string) { if (this.host) this.host.addAxis(id, title); else super.addAxis(id, title); }
  override renameAxis(chId: number, axId: string, title?: string) { if (this.host) this.host.renameAxis(chId, axId, title); else super.renameAxis(chId, axId, title); }
  override deleteAxis(chId: number, axId: string) { if (this.host) this.host.deleteAxis(chId, axId); else super.deleteAxis(chId, axId); }
  override addBranch(chId: number, axId: string, title?: string) { if (this.host) this.host.addBranch(chId, axId, title); else super.addBranch(chId, axId, title); }
  override renameBranch(chId: number, axId: string, brId: string, title?: string) { if (this.host) this.host.renameBranch(chId, axId, brId, title); else super.renameBranch(chId, axId, brId, title); }
  override deleteBranch(chId: number, axId: string, brId: string) { if (this.host) this.host.deleteBranch(chId, axId, brId); else super.deleteBranch(chId, axId, brId); }
  override aiGenerateStructure() { if (this.host) this.host.aiGenerateStructure(); else super.aiGenerateStructure(); }
  override writeSingleBranch(chId: number, axId: string, brId: string) { if (this.host) this.host.writeSingleBranch(chId, axId, brId); else super.writeSingleBranch(chId, axId, brId); }
  override applyTextFormatting(textarea: HTMLTextAreaElement, format: any) { if (this.host) this.host.applyTextFormatting(textarea, format); else super.applyTextFormatting(textarea, format); }
  override injectAcademicSourceCitation(source: any, mode?: any) { if (this.host) this.host.injectAcademicSourceCitation(source, mode); else super.injectAcademicSourceCitation(source, mode); }
  override updateChapterContent(id: number, content: string, msg?: string) { if (this.host) this.host.updateChapterContent(id, content, msg); else super.updateChapterContent(id, content, msg); }
  override forceManualSyncNow() { if (this.host) this.host.forceManualSyncNow(); else super.forceManualSyncNow(); }
  override exportWordOrPdf() { if (this.host) this.host.exportWordOrPdf(); else super.exportWordOrPdf(); }
  override backupProject(): void { if (this.host) this.host.backupProject(); else super.backupProject(); }
  override onBackupFileSelected(event: Event): Promise<void> { return this.host ? this.host.onBackupFileSelected(event) : super.onBackupFileSelected(event); }

  constructor() {
    super();

    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (property === 'host' || property === '_host' || property === 'ngOnInit') {
          return Reflect.get(target, property, receiver);
        }
        const host = target._host;
        if (host && property in host) {
          const value = (host as unknown as Record<PropertyKey, unknown>)[property];
          return typeof value === 'function' ? value.bind(host) : value;
        }
        return Reflect.get(target, property, receiver);
      },
      set: (target, property, value, receiver) => {
        if (property === 'host' || property === '_host') {
          return Reflect.set(target, property, value, receiver);
        }
        const host = target._host;
        if (host && property in host) {
          (host as unknown as Record<PropertyKey, unknown>)[property] = value;
          return true;
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }
}
