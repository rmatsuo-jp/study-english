import { vi } from 'vitest';
import { SessionStoreService } from './session-store.service';
import { CorrectionSession } from '@core/models/session.model';

const SESSIONS_KEY = 'correction_sessions';

function makeSession(partial: Partial<CorrectionSession>): CorrectionSession {
  return {
    id: partial.id ?? 'id',
    date: partial.date ?? new Date().toISOString(),
    original: partial.original ?? '',
    corrected: partial.corrected ?? '',
    mistakes: partial.mistakes ?? [],
    ...partial,
  };
}

// SessionStoreService はローカルストレージへのCRUD専任サービス（依存注入なし）。
// tombstone方式の論理削除、書き込み失敗時のalert通知、他タブのstorageイベント追随を検証する。
describe('SessionStoreService', () => {
  let service: SessionStoreService;

  beforeEach(() => {
    localStorage.clear();
    service = new SessionStoreService();
  });

  it('saveSession したセッションが sessions と allSessions 両方に反映される', () => {
    const session = makeSession({ id: 'a' });
    service.saveSession(session);
    expect(service.sessions().map((s) => s.id)).toEqual(['a']);
    expect(service.allSessions().map((s) => s.id)).toEqual(['a']);
  });

  it('deleteSession は物理削除せず tombstone を立て、sessions からは消え allSessions には残る', () => {
    service.saveSession(makeSession({ id: 'x' }));
    service.deleteSession('x');
    expect(service.sessions()).toEqual([]);
    const all = service.allSessions();
    expect(all.length).toBe(1);
    expect(all[0]).toMatchObject({ id: 'x', deleted: true });
  });

  it('importSessions は既存id重複分をスキップし、新規のみ追加して日付降順にソートする', () => {
    const existing = makeSession({ id: 'dup', date: '2024-01-01T00:00:00.000Z' });
    service.saveSession(existing);

    const older = makeSession({ id: 'dup', date: '2020-01-01T00:00:00.000Z' });
    const fresh = makeSession({ id: 'new', date: '2025-01-01T00:00:00.000Z' });
    const added = service.importSessions([older, fresh]);

    expect(added).toEqual([fresh]);
    expect(service.sessions().map((s) => s.id)).toEqual(['new', 'dup']);
  });

  it('exportSessions は削除済みを除いた JSON を返す', () => {
    service.saveSession(makeSession({ id: 'keep' }));
    service.saveSession(makeSession({ id: 'gone' }));
    service.deleteSession('gone');
    const exported = JSON.parse(service.exportSessions()) as CorrectionSession[];
    expect(exported.map((s) => s.id)).toEqual(['keep']);
  });

  it('localStorage書き込み失敗時はalertで通知しつつ、signalは更新される', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    service.saveSession(makeSession({ id: 'a' }));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(service.sessions().map((s) => s.id)).toEqual(['a']);

    vi.restoreAllMocks();
  });

  it('他タブでの storage イベントを検知すると _sessions を localStorage から再読込する', () => {
    service.saveSession(makeSession({ id: 'from-this-tab' }));

    // 他タブが書き換えた想定でlocalStorageを直接更新してからstorageイベントを発火する。
    const otherTabSessions = [makeSession({ id: 'from-other-tab' })];
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(otherTabSessions));
    window.dispatchEvent(new StorageEvent('storage', { key: SESSIONS_KEY }));

    expect(service.allSessions().map((s) => s.id)).toEqual(['from-other-tab']);
  });
});
