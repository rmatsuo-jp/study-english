/**
 * @file ユニットテスト実行前に読み込まれるグローバルセットアップ。
 * jsdomにはwindow.matchMediaが実装されていないため、app.ts等のデスクトップ判定コードが
 * 動くようにダミー実装を補う。
 * jsdomはIndexedDBも未実装のため、SettingsStoreServiceのAPIキー暗号化（crypto.util.tsが
 * 鍵の保管に使用）をテストできるよう fake-indexeddb で補う。
 */
import 'fake-indexeddb/auto';

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
