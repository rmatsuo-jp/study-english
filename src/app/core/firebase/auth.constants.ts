/**
 * @file クラウド同期を許可する Google アカウントのホワイトリスト。
 * サーバー側の強制は firestore.rules の isAllowedUser() が担い、ここはクライアント側の
 * UX（非許可ユーザーの即サインアウト＋メッセージ表示）に使う。
 * メールを追加するときは firestore.rules 側のリストと必ず同期させること。
 */

// ── 許可メールアドレス一覧 ──────────────────────────────────────────
export const ALLOWED_SYNC_EMAILS: readonly string[] = ['dreamskyryou@gmail.com'];

// ── 判定関数 ────────────────────────────────────────────────────────
export function isAllowedSyncUser(email: string | null | undefined): boolean {
  return !!email && ALLOWED_SYNC_EMAILS.includes(email);
}
