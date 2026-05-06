---
title: "Archive Strategy"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "2026-05-06"
updated: "2026-05-06"
---

# アーカイブ戦略 (Archive Strategy)

> **適用範囲**: 役目を終えた文書を `archive/` に退避させる際の判定基準と運用ルール。`docs-template/` 配下のあらゆる文書（コア 7・拡張・ADR）が対象。

## なぜアーカイブが必要か

- 古い文書を **削除すると履歴と決定根拠（ADR）が失われる**。
- かといって **active な文書群に残すと AI が古い情報を採用してしまう**。
- 「**残すが active には参照させない**」状態を作るのがアーカイブの目的。

## 判定基準（書籍 第14章準拠）

以下のいずれかに該当する文書は **アーカイブ対象**:

| 条件                    | 判定詳細                                                                |
| ----------------------- | ----------------------------------------------------------------------- |
| **6 ヶ月参照なし**      | コミット履歴上、6 ヶ月以上 **本文の変更も参照リンクの追加もない**       |
| **技術的陳腐化**        | 採用していたライブラリ・サービスの廃止 / 後継への完全移行が完了している |
| **別文書に統合された**  | 内容が他文書に移管され、本人は重複・抜け殻になっている                  |
| **PoC・実験用途で完了** | 一時的な検証用文書で、本番採用にあたって正式版に置き換わった            |

> いずれか 1 つでも該当すればアーカイブを **検討する** 段階。実行前に下記の判定フローを通す。

### 判定フロー（迷ったらこれに従う）

```text
[文書 X はまだ必要か？]
        │
        ▼
[直近 6 ヶ月で参照・更新があったか？]
   YES → 残す
    NO ↓
[現在のスタックでまだ通用するか？]
   YES → 残すが「最新化を要する」ラベルを付与
    NO ↓
[他文書に内容が移管済みか？]
   YES → archive/ へ移動 + リダイレクト
    NO → archive/ へ移動 + 「historical reference」ラベル
```

## アーカイブの具体手順

### Step 1: 退避先ディレクトリを用意

```text
docs-template/
├── archive/
│   ├── README.md                  # アーカイブ全体の索引（必須）
│   ├── 2024/                      # 年単位サブディレクトリ
│   │   └── OLD_AUTH_DESIGN.md
│   └── 2025/
│       └── OLD_DEPLOYMENT.md
```

- **年単位サブディレクトリ** で整理すると検索性が上がる。
- `archive/README.md` は索引として **必ず** 用意し、1 行 = 1 文書 + アーカイブ理由を併記する。
- 本テンプレートでは [`docs-template/archive/README.md`](../../archive/README.md) を **雛形（ヘッダー + 雛形 1 行）** として提供している。初回アーカイブ時にヘッダーはそのままで、雛形行を実エントリに置き換える運用とする。

### Step 2: `git mv` で履歴を保ったまま移動

```bash
# 履歴を保つため、必ず git mv を使う（cp + rm 禁止）
git mv docs-template/02-design/OLD_AUTH_DESIGN.md \
       docs-template/archive/2025/OLD_AUTH_DESIGN.md
```

### Step 3: フロントマターを更新

```yaml
---
title: "OLD_AUTH_DESIGN"
version: "1.0.0"
status: "deprecated" # ← draft/review/approved から deprecated へ
owner: "@your-github-handle"
created: "2024-03-15"
updated: "2026-05-06" # ← アーカイブ日に更新
archived: "2026-05-06" # ← 任意フィールド。アーカイブ実施日
archiveReason: "OAuth2 移行完了に伴い、内容は 02-design/AUTH_DESIGN.md に統合"
supersededBy: "02-design/AUTH_DESIGN.md" # 後継文書がある場合のみ
---
```

### Step 4: 文書冒頭にバナーを挿入

文書の **本文先頭** に以下を追加（h1 の直後）:

```markdown
> ⚠️ **このドキュメントはアーカイブされました**
>
> - **アーカイブ日**: 2026-05-06
> - **理由**: OAuth2 移行完了に伴い、現行設計は [AUTH_DESIGN.md](../../02-design/AUTH_DESIGN.md) に統合
> - **AI ツールへの注意**: この文書を新規実装の参照元として **使用しないでください**
```

### Step 5: MASTER.md からのリダイレクト管理

MASTER.md の参照リンクを以下いずれかに置き換え:

- **後継文書がある場合**: 直接後継リンクに張り替える。
- **後継がない場合**: `archive/README.md` 経由で誘導（active の参照リストには残さない）。

### Step 6: 機械的検証

- [ ] `grep -rln "OLD_AUTH_DESIGN.md" docs-template/ docs/` でリンク残存を確認。
- [ ] active 側にリンクが残っていないか目検（archive/ 内部からの参照は OK）。
- [ ] `npm run lint:md` でリンク切れがないことを確認。

## アーカイブしてはいけないケース

| 状況                                          | 判断                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| 6 ヶ月参照なしだが **法令保管義務** がある    | 残す。`compliance/` 等の active サブディレクトリで管理                       |
| 6 ヶ月参照なしだが **新人 onboarding** で参照 | 残す。「使用頻度は低いが必要」な文書は active 側で OK                        |
| 「使うかも」で迷う                            | **6 ヶ月運用ルール** に従う。例外を作らない                                  |
| ADR (Architecture Decision Record)            | 原則 active に残す。**決定の経緯は資産**。陳腐化したら status: deprecated へ |

## ADR (Architectural Decision Record) の扱い

- ADR は **アーカイブしない**（方針）。
- 内容が陳腐化したら以下のいずれかで対応:
  - フロントマター `status` を `deprecated` に変更し、本文に「Superseded by ADR-NNN」を明記。
  - 最後尾に「Lessons learned」セクションを追記して、なぜこの判断が古くなったかを記録。
- これにより **過去の判断の経緯** を将来の AI と人間に提示できる。

## アーカイブ後の復活

「やっぱり必要だった」となった場合:

1. `git mv archive/2025/X.md docs-template/02-design/X.md` で active に戻す。
2. フロントマターの `status` を `draft` または `approved` に更新。
3. 冒頭のアーカイブバナーを削除し、復活理由を変更履歴に追記。
4. PR 説明で「resurrect: archive 復帰」と明記し、レビュー時に妥当性を再確認。

## 落とし穴

| アンチパターン                                 | 対策                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `cp` + `rm` で履歴が切れる                     | 必ず `git mv` を使う                                                                 |
| アーカイブしたのにバナーがない                 | AI が古い情報を採用するリスク。**バナー必須**                                        |
| `archive/README.md` を整備しない               | 何が・いつ・なぜアーカイブされたか追跡不可になる                                     |
| アーカイブ判断を 1 人で決める                  | 6 ヶ月参照なしは機械的に判定できるが、「**陳腐化** の判断」は最低 1 名のレビュー必須 |
| アーカイブ対象なのに `status: approved` のまま | フロントマターを `deprecated` に更新する                                             |

## 次に読む

- [health-check.md](./health-check.md) — 月次で「6 ヶ月参照なし」を検出する手順
- [document-splitting.md](./document-splitting.md) — 分割で済む場合とアーカイブで済む場合の判断
- [phased-rollout.md](./phased-rollout.md) — Phase 4 完了後にアーカイブ運用を開始するタイミング
- [../ORGANIZATIONAL_ROLLOUT.md](../ORGANIZATIONAL_ROLLOUT.md) — 組織展開ガイドの索引（親）
