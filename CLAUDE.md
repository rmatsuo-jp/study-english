# CLAUDE.md — Study English プロジェクト概要

## プロジェクト概要

**Study English** は Angular 22 製の PWA。Google Gemini AI で英作文を添削し、結果をブラウザの LocalStorage に保存して学習履歴・ミス傾向を追跡するアプリ。

UI 言語: 日本語。対象ユーザー: 英語学習者。

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Angular 22（Standalone コンポーネント、NgModule 不使用） |
| 言語 | TypeScript（strict モード） |
| スタイル | SCSS（コンポーネントスコープ） |
| AI | Google Generative AI SDK (`@google/generative-ai`) |
| Markdown | marked v18 |
| 永続化 | ブラウザ LocalStorage（StorageService 経由） |
| PWA | @angular/service-worker + ngsw-config.json |
| テスト | Vitest |

---

## ディレクトリ構造

```
src/
├── main.ts                          # Angular ブートストラップ
├── index.html                       # PWA ルート HTML（lang="ja"）
└── app/
    ├── app.ts                       # ルートコンポーネント。テーマ初期化
    ├── app.html                     # ボトムナビ + router-outlet
    ├── app.scss                     # グローバルスタイル
    ├── app.routes.ts                # 遅延ロードルーティング設定
    ├── app.config.ts                # Angular DI / Service Worker 設定
    ├── models/
    │   └── session.model.ts         # Mistake / CorrectionSession 型定義
    ├── services/
    │   ├── gemini.service.ts        # Gemini API 呼び出し・レスポンス解析
    │   └── storage.service.ts       # LocalStorage 永続化・プロンプト構築
    └── pages/
        ├── practice/                # 英文入力・添削結果表示
        ├── history/                 # 過去セッション一覧・インポート/エクスポート
        ├── mistakes/                # ミス傾向分析ダッシュボード
        └── settings/                # API キー・モデル・機能トグル・テーマ設定
```

---

## データフロー

```
[Practice ページ]
    ↓ userText
[GeminiService.correct()]
    ↓ Gemini API (buildPrompt + userText)
[レスポンス: Markdown + <mistakes>JSON</mistakes>]
    ↓ parseMistakes() で分離
[StorageService.saveSession()] → LocalStorage
    ↓
[History ページ]  [Mistakes ページ]
```

---

## 主要型定義（session.model.ts）

```typescript
interface Mistake {
  category: string;    // ミスのカテゴリ（例: "文法", "語彙"）
  original: string;    // 元の誤った表現
  corrected: string;   // 正しい表現
  explanation: string; // 日本語解説
}

interface CorrectionSession {
  id: string;          // Date.now().toString()
  date: string;        // ISO 8601
  original: string;    // ユーザーが入力した英文
  corrected: string;   // Gemini が返した添削済み Markdown
  mistakes: Mistake[];
}
```

`AppSettings`（storage.service.ts）: `apiKey`, `model`, `includeNaturalExpressions`, `includeGrammarTendency`, `includeCefrEvaluation`, `includeLevelUpSuggestion`, `theme`

---

## 開発コマンド

```bash
npm start        # 開発サーバー起動（localhost:4200）
npm run build    # 本番ビルド（dist/ へ出力、Service Worker 有効）
npm test         # Vitest 実行
```

---

## コーディング規約

- **リアクティブ**: `signal()` を使用（`BehaviorSubject` は使わない）。
- **コンポーネント**: Standalone（`imports: []` で直接インポート）。
- **永続化**: `StorageService` 経由のみ。コンポーネントから直接 `localStorage` を操作しない。
- **API 呼び出し**: `GeminiService` 経由のみ。
- **プロンプト構築**: `buildPrompt(settings)` で一元管理（storage.service.ts）。
- **スタイル**: SCSS ファイルはコンポーネントと同名で同ディレクトリに配置。

---

## コメント管理ルール（エージェント向け）

> **ファイルを編集したら、そのファイルの `@file` コメントと影響するセクションコメントを必ず同時に更新すること。**
> 新機能を追加した場合は新しいセクションコメントを追加する。
> このルールはトークン消費削減のためにある — コメントが最新状態であればエージェントはファイルを全読みしなくてよい。

### コメント書式

**TypeScript:**
```typescript
/**
 * @file ファイルの役割を 1〜2 行で説明
 */

// ── セクション名 ─────────────────────────────────────────────────
```

**HTML:**
```html
<!-- @file ファイルの役割を 1〜2 行で説明 -->

<!-- ── セクション名 ─────────────────────────────────────────────── -->
```
