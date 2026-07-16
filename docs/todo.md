# TODO

本ファイルは今後の機能追加・修正およびリファクタリングのタスクを記録する。
Claude Codeはタスク着手・完了時に本ファイルを更新すること。完了した項目は削除するか、
取り消し線を付けて記録する（運用はユーザーと相談の上決定）。

## 機能追加・修正

- 4択クイズに誤答理由・正答理由の表示機能を追加
  - ドリルの4択クイズ（`ReviewItem.choices`）で、選択後に「選んだ選択肢がなぜ誤りか」「正答がなぜ正しいか」を
    ユーザーが把握できるように、選択肢ごとの理由を表示する。
  - `ReviewItem`（`src/app/core/models/session.model.ts`）に選択肢ごとの理由フィールドを追加する必要あり。
  - Geminiプロンプト（`core/gemini/prompt.util.ts` の `SECTIONS`）で選択肢ごとの理由も生成させる必要あり。
  - `gemini-parse.util.ts` のパース対応が必要。
  - `quiz.util.ts`（`Quiz` interface, `buildClozeQuiz`）と `features/drill` の表示側（`drill.html`等）に
    理由表示UIを追加する必要あり。
  - `CorrectionSession` に optional フィールドを追加する場合は `firestore-sync.service.ts` の
    `OPTIONAL_FIELDS_MAP` への追加が必須（CLAUDE.md のルール参照）。

- ドリルにゲーミフィケーション要素（統計・実績）を追加
  - ユーザーがドリルを継続したくなるよう、挑戦回数・正答数・誤答数・連続正解数・パーフェクト・
    連続パーフェクトなどの統計と、それらに基づく実績（バッジ）解除機能を追加する。
  - データ設計:
    - `DrillProgress`（`session.model.ts`）に累積統計フィールド（挑戦回数・正答数・誤答数など）の
      追加を検討する。既存の `correctStreak`/`everCorrect` との役割分担を整理すること。
    - 「連続正解数」「パーフェクト（全問正解）」「連続パーフェクト」はドリル1セッション（1回の
      出題セット）単位で算出・記録する新しい集計モデルが必要（`drill-state.service.ts` の
      セッション進行ロジックと連携）。
    - 実績（バッジ）の解除条件・解除状態を保持する新しいモデル（例: `Achievement`/
      `AchievementProgress`）を新設する必要あり。軸は以下4種を想定:
      - 累積系（挑戦回数・正答数の節目）
      - 連続系（連続正解・連続パーフェクト・継続日数）
      - 精度・パーフェクト系
      - カテゴリ制覇系（文法カテゴリ等の制覇）
    - 既存データの遡及集計は行わず、本機能リリース以降のデータから集計を開始する方針。
    - Firestore同期: `DrillProgressSyncService` と同様の仕組みで新しい統計・実績データも同期する
      必要あり。`CorrectionSession` に optional フィールドを追加する場合は
      `firestore-sync.service.ts` の `OPTIONAL_FIELDS_MAP` への追加が必須（CLAUDE.md のルール参照）。
  - UI:
    - ドリル画面内で実績解除時にトースト/バナーによる即時通知を表示。
    - 実績（バッジ）の一覧を確認できる専用ページを新設（`features/history` 等への追加を検討）。
    - ドリルのサマリー画面（結果表示）に今回の正答率・連続記録などの統計を表示することも検討。
  - 影響範囲の見積り: `DrillProgressService`/`DrillProgressSyncService`（core/features/drill）、
    `session.model.ts`（core/models）、`drill-state.service.ts`、`features/drill` の表示コンポーネント、
    新設する実績一覧ページ、`translations.ts`（新規UI文言）、`docs/glossary.md`（「実績」
    「連続正解」「パーフェクト」等の新規ドメイン用語を追記し `npm run lint:text` 対応）。

- 同日複数添削の順序（N回目）表示
  - 一日一添削を基本としつつ、同じ日に追加で添削したいニーズに対応するため、同日内の何回目の
    添削かをUIで判別できるようにする。
  - `CorrectionSession.id` は既に日付非依存（`Date.now()+random`、`practice-state.service.ts`）で
    同日複数保存時も衝突しないため、ストレージ層の変更は不要。表示側のみの対応で足りる。
  - `history-state.service.ts` の `filteredSessions`（選択日の全セッションを返す）や
    `history-calendar.ts` の `sessionsByDay`（日付ごとにグループ化済み）を起点に、同日内で
    `date`（タイムスタンプ）昇順に並べ替えて「N回目」の序数を導出するヘルパーの追加を検討する。
  - `history.html` の各セッションカード表示（`filteredSessions()` のループ箇所）に「1回目」
    「2回目」等のラベルを表示する。
  - `history-calendar.ts` のカレンダーバッジは現在、同日に複数セッションがある場合でも末尾
    （＝最後に保存された）1件の評価のみを表示している。複数回あることが分かるよう見直しを検討する
    （例: 件数表示への変更）。
  - UI文言を新規追加する場合は `docs/glossary.md`／`prh.yml` への追記と `npm run lint:text`
    での確認が必要（CLAUDE.md の用語ルール参照）。

## リファクタリング

- （現時点で記載事項なし。今後追記）
