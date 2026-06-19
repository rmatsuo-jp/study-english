/**
 * @file 過去の添削セッション一覧ページ。
 * セッションの表示・複数選択削除・展開、日付ソート、JSON インポート/エクスポートを提供する。
 */
import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { StorageService } from '../../services/storage.service';
import { CorrectionSession } from '../../models/session.model';

@Component({
  selector: 'app-history',
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  // ── 状態管理（signal） ────────────────────────────────────────────
  sessions = signal<CorrectionSession[]>([]);
  expandedId = signal<string | null>(null);
  selectionMode = signal(false);
  selectedIds = signal<Set<string>>(new Set());
  sortOrder = signal<'asc' | 'desc'>('desc');

  sortedSessions = computed(() =>
    [...this.sessions()].sort((a, b) => {
      const diff = a.date.localeCompare(b.date);
      return this.sortOrder() === 'asc' ? diff : -diff;
    })
  );

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private storage: StorageService,
    private sanitizer: DomSanitizer,
  ) {
    this.sessions.set(this.storage.getSessions());
  }

  toHtml(markdown: string): SafeHtml {
    const html = marked.parse(markdown) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggle(id: string) {
    if (this.selectionMode()) return;
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  toggleSort() {
    this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
  }

  toggleSelectionMode() {
    const next = !this.selectionMode();
    this.selectionMode.set(next);
    if (!next) this.selectedIds.set(new Set());
  }

  toggleSelect(id: string, event: Event) {
    event.stopPropagation();
    const ids = new Set(this.selectedIds());
    if (ids.has(id)) {
      ids.delete(id);
    } else {
      ids.add(id);
    }
    this.selectedIds.set(ids);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  deleteSelected() {
    const ids = this.selectedIds();
    if (ids.size === 0) return;
    if (!confirm(`${ids.size}件の履歴を削除しますか？この操作は元に戻せません。`)) return;
    ids.forEach(id => this.storage.deleteSession(id));
    this.sessions.set(this.storage.getSessions());
    this.selectedIds.set(new Set());
    this.selectionMode.set(false);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }

  // ── インポート / エクスポート ──────────────────────────────────────
  triggerImport() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed)) {
          alert('配列形式のJSONを指定してください');
          return;
        }
        const valid = parsed.filter(
          (s: unknown) => {
            const session = s as Record<string, unknown>;
            return session['id'] && session['date'] && session['original'] !== undefined &&
              session['corrected'] !== undefined && Array.isArray(session['mistakes']);
          }
        );
        this.sessions.set(this.storage.importSessions(valid as CorrectionSession[]));
      } catch {
        alert('JSONの形式が正しくありません');
      }
      (event.target as HTMLInputElement).value = '';
    };
    reader.readAsText(file);
  }

  exportJson() {
    const blob = new Blob([this.storage.exportSessions()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
