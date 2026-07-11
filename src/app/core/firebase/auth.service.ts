/**
 * @file Google SSO 認証を担うサービス。
 * Firebase Auth の onAuthStateChanged を signal に流し込み、ログイン状態をリアクティブに公開する。
 * login()（Google: popup→redirect フォールバック）・logout() を提供する。同期処理は FirestoreSyncService が user signal を監視して実行する。
 * クラウド同期はホワイトリスト制（auth.constants.ts）: 非許可メールのログインは即サインアウトし、
 * loginError signal に理由を流す（user signal には載せないため同期も発火しない）。
 * 真の防御は firestore.rules 側で行われ、ここはあくまで UX（分かりやすい拒否表示）を担う。
 */
import { Injectable, signal } from '@angular/core';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase.init';
import { isAllowedSyncUser } from './auth.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ── ログイン状態（読み取り専用 signal で公開） ───────────────────
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();

  // 初回の認証状態解決が済んだか（起動直後のちらつき防止に利用可能）
  private _ready = signal(false);
  readonly ready = this._ready.asReadonly();

  // ── ログイン拒否メッセージ（非許可ユーザーに表示。許可ログイン/ログアウトでクリア） ──
  private _loginError = signal<string | null>(null);
  readonly loginError = this._loginError.asReadonly();

  constructor() {
    // Firebase 管理外で発火するコールバックを signal に反映する（NgZone 不要）
    // popup・redirect どちらのログインもここを通るため、ホワイトリスト検査はこの1箇所で行う。
    onAuthStateChanged(auth, (user) => {
      if (user && !isAllowedSyncUser(user.email)) {
        // 非許可ユーザー: user signal に載せず（= 同期を発火させず）即サインアウトする
        this._loginError.set(
          'このアプリのクラウド同期は許可されたユーザーのみ利用できます。ログインなしでもローカル保存で全機能を利用できます。',
        );
        signOut(auth).catch((err) =>
          console.error('[AuthService] 非許可ユーザーのサインアウトに失敗:', err),
        );
        this._ready.set(true);
        return;
      }
      if (user) {
        this._loginError.set(null);
      }
      this._user.set(user);
      this._ready.set(true);
    });
    // リダイレクト方式でログインした場合、戻ってきた際に結果を回収する
    // （状態反映自体は onAuthStateChanged が担当。ここはエラー検知のため）
    getRedirectResult(auth).catch((err) =>
      console.error('[AuthService] リダイレクトログインの結果取得に失敗:', err),
    );
  }

  // ── ログイン（Google） ────────────────────────────────────────────
  // まず popup を試し、ブロック／PWA非対応で失敗したら redirect にフォールバックする。
  // （インストール済みモバイルPWA・iOS では popup が使えないことが多いため）
  async login(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.warn('[AuthService] popup ログイン失敗、redirect に切替:', err);
      await signInWithRedirect(auth, provider);
    }
  }

  // ── ログアウト ────────────────────────────────────────────────────
  async logout(): Promise<void> {
    this._loginError.set(null);
    await signOut(auth);
  }
}
