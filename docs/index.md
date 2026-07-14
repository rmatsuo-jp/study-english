# ドキュメント目次

このファイルは本リポジトリのドキュメント一覧・索引です。読者はまずここを見て、
目的に合ったドキュメントを選んでください。Claude Code はドキュメントの新規作成・移動・削除時に
このファイルを更新し、末尾の「ドキュメントリファクタリング方針」に従ってください。

対象読者は「開発者」「ユーザー」「法務」「Claude Code（AI開発ツール）」の4種類で分類する。
どれか1つに決めがたいものは対象読者欄に **要検討** と表示し、理由を添えている
（`のちほどリファクタリング` 対象 — 分割や再配置を検討する）。

## リポジトリ直下

| ファイル | 対象読者 | 内容 |
| --- | --- | --- |
| [README.md](../README.md) | **要検討**（開発者＋ユーザー） | プロジェクト概要・機能・技術スタック・セットアップ手順。初見の開発者向けだが、アプリ機能紹介などユーザー向け内容も混在 |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 開発者 | レイヤー構成（features → core → shared）、データフロー、データモデル、ルーティング設計 |
| [SECURITY.md](../SECURITY.md) | 開発者 | サポート対象バージョンと脆弱性報告方法（GitHub Private Vulnerability Reporting） |
| [CHANGELOG.md](../CHANGELOG.md) | **要検討**（開発者＋ユーザー） | semantic-releaseによる自動生成の変更履歴。開発者はリリース内容確認に、ユーザーは更新内容確認に使う可能性がある |
| [CLAUDE.md](../CLAUDE.md) | Claude Code | Claude Code向けの開発ルール（依存方向・型定義運用・コメント規約など）。開発フロー上のルールはこちらが正 |

## 開発者向け

| ファイル | 対象読者 | 内容 |
| --- | --- | --- |
| [overview.md](overview.md) | 開発者 | システム構成、機能一覧、ディレクトリ構成、データフロー、LocalStorageキー |
| [setup.md](setup.md) | 開発者 | ローカル開発環境構築手順（clone、Node/npmバージョン、APIキー設定、テスト・lint・ビルド） |

## ユーザー向け

| ファイル | 対象読者 | 内容 |
| --- | --- | --- |
| [manual.md](manual.md) | ユーザー | 初期設定（APIキー、Googleログイン/クラウド同期）と各画面（添削・ドリル・履歴・ミス・設定）の操作方法、FAQ |
| [deploy-to-android-pwa.md](deploy-to-android-pwa.md) | ユーザー | GitHub PagesへのPWAデプロイとAndroid端末へのインストール手順 |

## 法務

`docs/legal/` のみディレクトリ構成を維持しています（理由は下記「ドキュメントリファクタリング方針」参照）。

| ファイル | 対象読者 | 内容 |
| --- | --- | --- |
| [legal/terms.md](legal/terms.md) | 法務 | 利用規約（禁止事項、アカウント・第三者サービス利用、知的財産権など） |
| [legal/privacy.md](legal/privacy.md) | 法務 | プライバシーポリシー（ローカル保存/Firebase同期データ、Gemini APIへの送信データ、APIキー暗号化） |
| [legal/disclaimer.md](legal/disclaimer.md) | 法務 | 免責事項（無償提供・AI出力の正確性・データ損失等に関する免責、準拠法） |
| [legal/LICENSE.md](legal/LICENSE.md) | 法務 | MITライセンス本文（日本語参考訳付き） |

## 用語集

| ファイル | 対象読者 | 内容 |
| --- | --- | --- |
| [glossary.md](glossary.md) | **要検討**（開発者＋Claude Code） | 日本語用語の正典。UI文言・Geminiプロンプト・ドキュメントの表記統一に使う。機械チェックは`prh.yml`（`npm run lint:text`）。開発者が参照する一方、Claude Codeがドキュメント/プロンプト編集時に必ず参照するルールでもあり、片方に決めがたい |

## ドキュメントリファクタリング方針

Claude Codeがドキュメントを追加・移動・削除する際は、以下を守ること。

- **`docs/` 配下は基本フラット構成**とする。サブフォルダに分けない。
- **例外は `docs/legal/` のみ**。`angular.json` のビルドアセット設定（`docs/legal` を
  `dist/legal/` へディレクトリ単位でコピー）と、実行時にそれをHTTP取得して表示する
  [legal.ts](../src/app/features/legal/legal.ts) が、このディレクトリ構成に依存しているため。
  `docs/legal/` 配下のファイルを移動・改名する場合は、`angular.json` の該当assets設定と
  `legal.ts` の取得パス（`legal/{doc}.md`）も必ず合わせて更新すること。
- 新規ドキュメントを追加したら、性質（開発者向け／ユーザー向け／法務）を判断し、法務以外は
  `docs/` 直下にフラットに配置した上で、このファイルの表に1行追記する。
- ファイルを移動・削除した場合も、このファイルのリンクと表を同時に更新する。
  更新を怠るとこの索引が実態と乖離するため、ドキュメント変更のPRには本ファイルの更新を含めること。
- 用語表記は `docs/glossary.md` を正とする。UI文言・Geminiプロンプト・ドキュメントの文言を
  変更した場合は `npm run lint:text` を実行して表記ゆれを確認する（CLAUDE.md参照）。
