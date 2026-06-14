# Study English

Gemini AI を使った英語添削 PWA アプリです。Angular で構築されており、英文を入力すると AI が文法・語彙・表現のミスを指摘・修正します。

## 機能

- **練習 (Practice)** — 英文を入力し、Gemini AI によるリアルタイム添削を受ける
- **履歴 (History)** — 過去の添削セッションを一覧で確認する
- **ミス一覧 (Mistakes)** — 蓄積されたミスをカテゴリ別に振り返る
- **設定 (Settings)** — Gemini API キー・モデル・添削プロンプトを設定する

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Angular 22 |
| AI | Google Gemini API (`@google/generative-ai`) |
| ストレージ | LocalStorage（`StorageService`） |
| スタイル | SCSS |
| テスト | Vitest |

## セットアップ

### 必要なもの

- Node.js
- Gemini API キー（[Google AI Studio](https://aistudio.google.com/) で取得）

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm start
```

ブラウザで `http://localhost:4200/` を開きます。

### 初回設定

アプリ起動後、**Settings** ページで以下を設定してください。

1. Gemini API キー
2. 使用するモデル（例: `gemini-1.5-flash`）
3. 添削プロンプト（`{USER_TEXT}` が入力テキストに置換されます）

## ビルド

```bash
ng build
```

ビルド成果物は `dist/` に出力されます。

## テスト

```bash
ng test
```

## プロジェクト構成

```
src/app/
├── models/
│   └── session.model.ts      # CorrectionSession / Mistake の型定義
├── services/
│   ├── gemini.service.ts     # Gemini API 呼び出し・ミス解析
│   └── storage.service.ts    # LocalStorage の読み書き
└── pages/
    ├── practice/             # 添削入力ページ
    ├── history/              # 履歴ページ
    ├── mistakes/             # ミス一覧ページ
    └── settings/             # 設定ページ
```
