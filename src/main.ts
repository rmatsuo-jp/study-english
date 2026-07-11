/**
 * @file Angular アプリケーションのブートストラップエントリポイント。
 * appConfig を渡してルートコンポーネント App を起動する。
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
