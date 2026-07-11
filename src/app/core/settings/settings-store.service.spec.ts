import { SettingsStoreService, AppSettings } from './settings-store.service';

// jsdom + fake-indexeddb（test-setup.ts）で実際の Web Crypto 暗号化/復号を通してテストする。
// isCryptoSupported() をモックせず実挙動を検証することで、暗号化・旧形式移行・復号失敗時の
// フォールバックを実際のコードパスで確認する。
function baseSettings(partial: Partial<AppSettings> = {}): AppSettings {
  return {
    apiKey: 'my-secret-key',
    modelPriority: ['gemini-2.5-flash'],
    theme: 'dark',
    language: 'ja',
    ...partial,
  };
}

describe('SettingsStoreService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveSettings→persist完了後、別インスタンスのinit()でAPIキーが復元される（暗号化保存）', async () => {
    const writer = new SettingsStoreService();
    // saveSettings() 自体は persist() を fire-and-forget するため、書き込み完了を確定させるには
    // private persist() を直接 await する（暗号化・IndexedDB鍵アクセスの完了を保証するため）。
    await (writer as unknown as { persist(s: AppSettings): Promise<void> }).persist(baseSettings());

    const reader = new SettingsStoreService();
    await reader.init();

    expect(reader.getSettings().apiKey).toBe('my-secret-key');
    expect(reader.hasApiKey()).toBe(true);
    const stored = JSON.parse(localStorage.getItem('app_settings')!);
    expect(stored.apiKey).toBeUndefined();
    expect(stored.apiKeyEnc).toBeDefined();
  });

  it('旧形式（平文apiKey）が残っている場合、init()で暗号化保存に移行し平文を除去する', async () => {
    localStorage.setItem(
      'app_settings',
      JSON.stringify({ apiKey: 'legacy-plain-key', theme: 'light', language: 'ja' })
    );

    const service = new SettingsStoreService();
    await service.init();

    expect(service.getSettings().apiKey).toBe('legacy-plain-key');
    const stored = JSON.parse(localStorage.getItem('app_settings')!);
    expect(stored.apiKey).toBeUndefined();
    expect(stored.apiKeyEnc).toBeDefined();
  });

  it('暗号文が壊れている（復号失敗）場合はAPIキー未設定として扱う', async () => {
    localStorage.setItem(
      'app_settings',
      JSON.stringify({ apiKeyEnc: 'not-a-valid-base64-cipher!!', theme: 'dark', language: 'ja' })
    );

    const service = new SettingsStoreService();
    await service.init();

    expect(service.getSettings().apiKey).toBe('');
    expect(service.hasApiKey()).toBe(false);
  });

  it('旧バージョンの単一モデル文字列(model)からmodelPriorityへ移行する', () => {
    localStorage.setItem(
      'app_settings',
      JSON.stringify({ model: 'gemini-1.5-pro', theme: 'dark', language: 'ja' })
    );

    const service = new SettingsStoreService();
    const settings = service.getSettings();

    expect(settings.modelPriority[0]).toBe('gemini-1.5-pro');
    expect(settings.modelPriority).not.toContain(undefined);
  });

  it('acceptConsent()は同意日時と現行バージョンを保存し、needsConsent()がfalseになる', () => {
    const service = new SettingsStoreService();
    expect(service.needsConsent()).toBe(true);

    service.acceptConsent();

    expect(service.needsConsent()).toBe(false);
    expect(service.getSettings().consentAcceptedAt).toBeDefined();
  });
});
