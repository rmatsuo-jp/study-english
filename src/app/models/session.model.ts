/**
 * @file アプリ全体で使うドメイン型定義。Mistake（1件のミス情報）と CorrectionSession（1回の添削セッション）を定義する。
 */

// ── Mistake: Gemini が返す1件のミス情報 ─────────────────────────
export interface Mistake {
  category: string;
  original: string;
  corrected: string;
  explanation: string;
}

// ── CorrectionSession: 1回の添削セッション（LocalStorage に保存される単位） ─
export interface CorrectionSession {
  id: string;
  date: string;
  original: string;
  corrected: string;
  mistakes: Mistake[];
}
