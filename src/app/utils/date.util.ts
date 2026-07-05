/**
 * @file 日時フォーマット用の純粋関数群。
 */

// ── エクスポートファイル名用タイムスタンプ ──────────────────────────
/** ローカル時刻を YYMMDDhhmm 形式の文字列にする（ダウンロードファイル名に使用）。 */
export function formatTimestampForFilename(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yy = pad(date.getFullYear() % 100);
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yy}${mm}${dd}${hh}${mi}`;
}
