/**
 * @file Angular グローバル設定。グローバルエラーリスナー、ルーター、HttpClient（法的文書のfetchに使用）、
 * Service Worker（本番のみ有効）を提供する。
 * initializeAppUpdates() を APP_INITIALIZER として登録し、新バージョンの Service Worker が
 * インストールされたら自動でアクティベート＋リロードして、GitHub Pages 上での旧バージョン
 * キャッシュ残存問題を解消する。
 */
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideServiceWorker, SwUpdate } from '@angular/service-worker';

// ── Service Worker 更新監視: 新バージョン検知時に即座にアクティベートしてリロードする ──
// 目的: GitHub Pages 上で古いバージョンがキャッシュされ続け、スーパーリロードしないと
// 反映されない問題を恒久的に解消するため。APP_INITIALIZER としてアプリ起動時に購読を開始する。
function initializeAppUpdates() {
  return () => {
    if (!isDevMode()) {
      const swUpdate = inject(SwUpdate);
      if (swUpdate.isEnabled) {
        swUpdate.versionUpdates.subscribe((event) => {
          if (event.type === 'VERSION_READY') {
            swUpdate.activateUpdate().then(() => document.location.reload());
          }
        });
        swUpdate.checkForUpdate();
      }
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: APP_INITIALIZER, useFactory: initializeAppUpdates, multi: true },
  ],
};
