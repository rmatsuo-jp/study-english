/**
 * @file ルートコンポーネント。アプリ起動時に SettingsStoreService から theme・language 設定を読み取り、
 * それぞれ document ルートの data-theme 属性・I18nService（lang signal + document.lang）に反映する。
 * PracticeState.notice を購読し、どのタブにいても添削の処理中／完了／エラーを
 * グローバルバナーで表示する（タップで添削タブへ遷移）。
 * 初回起動時、および同意文言が改訂された場合（SettingsStoreService.needsConsent()）は、
 * 英文がGemini APIへ送信される旨・API利用料金が利用者負担である旨を伝える同意モーダルを表示し、
 * 「同意して続ける」で SettingsStoreService.acceptConsent() を呼ぶ。
 * サイドバーの JA/EN トグル（toggleLanguage）は setLang() による即時反映と saveSettings() による
 * 即時永続化を同時に行う（settings.ts の updateTheme() と同じ即時保存パターン）。
 */
import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../environments/environment';
import { SettingsStoreService } from '@core/settings/settings-store.service';
import { I18nService } from '@core/i18n/i18n.service';
import { Lang } from '@core/i18n/lang.model';
import { PracticeState } from '@features/practice/practice-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected practiceState = inject(PracticeState);
  private router = inject(Router);
  private settingsStore = inject(SettingsStoreService);
  protected i18n = inject(I18nService);

  // ── サイドバー（PCレイアウト時のみ）の格納状態。既定値 false = 表示中 ──
  protected sidebarCollapsed = signal(false);

  // ── 開発用ナビ項目の表示可否（本番ビルドでは /dev ルート自体が存在しないため非表示にする） ─
  protected isDev = !environment.production;

  // ── 同意モーダルの表示可否（初回起動時、または同意文言が改訂された場合に表示） ──
  protected showConsent = signal(this.settingsStore.needsConsent());

  constructor() {
    const settings = this.settingsStore.getSettings();
    document.documentElement.dataset['theme'] = settings.theme;
    this.i18n.setLang(settings.language);
  }

  // ── 表示言語のトグル: signal 反映と同時に即時永続化する ──────────
  toggleLanguage(lang: Lang) {
    this.i18n.setLang(lang);
    this.settingsStore.saveSettings({ ...this.settingsStore.getSettings(), language: lang });
  }

  acceptConsent() {
    this.settingsStore.acceptConsent();
    this.showConsent.set(false);
  }

  // ── バナータップ: 添削タブへ遷移して通知を閉じる ───────────────
  openResult() {
    this.router.navigate(['/practice']);
    this.practiceState.dismissNotice();
  }

  // ── サイドバー格納ボタン: 表示⇔格納をトグル ─────────────────
  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }
}
