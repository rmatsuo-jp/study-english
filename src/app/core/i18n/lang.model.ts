/**
 * @file アプリの表示言語（UI 文言・添削解説の切り替え）の型定義。
 * ja=日本語、en=英語の 2 言語のみを対象とする。AppSettings.language・I18nService・
 * localized-session.util の各所でこの型を共有する。
 */
export type Lang = 'ja' | 'en';

export const LANGS: readonly Lang[] = ['ja', 'en'] as const;
