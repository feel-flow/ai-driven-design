---
id: ai-spec-driven-development-index
title: AI Spec Driven Development - ドキュメントインデックス
version: 3.1.0
status: active
created: 2025-11-07
updated: 2025-11-07
owner: feel-flow
phase: mvp
tags: [docs, index, ai-agent]
references:
  - docs/OPERATIONAL_GUIDE.md
  - docs/AI_SPEC_DRIVEN_DEVELOPMENT.md
  - docs/PRACTICAL_GUIDE.md
  - docs/DEEP_DIVE.md
changeImpact: medium
---

# AI Spec Driven Development - ドキュメントインデックス

このリポジトリは「AI Spec Driven Development」アプローチを実践するためのドキュメントとツールセットを提供します。
このアプローチは、AIエージェントが開発プロセスを効率的に実行できるよう、最小限かつ高精度なドキュメント構造に焦点を当てています。

## 主要ドキュメント

このプロジェクトの主要なドキュメントは以下の通りです。

### 1. 運用ガイド (AIエージェント向け)

AIエージェントがプロジェクトの構造を理解し、タスクを自律的に実行するための厳密な運用ルールと仕様を定義しています。

- **ファイル**: [`docs/OPERATIONAL_GUIDE.md`](docs/OPERATIONAL_GUIDE.md)
- **対象読者**: AIエージェント、開発者
- **内容**:
  - 必須のフォルダ構造とファイルセット
  - ファイル分類マトリクス
  - 命名規則とバージョニングルール
  - AIエージェント向けの実行チェックリスト

### 2. AI Spec Driven Development

このアプローチの背景にある思想、具体的な実践方法、そして従来の開発手法との比較について解説しています。この文書は以下の3つに分割されています。

#### 2.1 概念編

アプローチの核心となる概念と、なぜAIにとって少ないドキュメントが良いのかについて解説します。

- **ファイル**: [`docs/AI_SPEC_DRIVEN_DEVELOPMENT.md`](docs/AI_SPEC_DRIVEN_DEVELOPMENT.md)
- **対象読者**: 全員

#### 2.2 実践ガイド

各ドキュメント（`MASTER.md`, `PROJECT.md`など）の詳細な書き方や、Claude Skillsを使った具体的な活用法を解説します。

- **ファイル**: [`docs/PRACTICAL_GUIDE.md`](docs/PRACTICAL_GUIDE.md)
- **対象読者**: 開発者、プロジェクトマネージャー

#### 2.3 深掘り

理論的背景、測定可能な成果、よくある質問への回答など、より詳細な情報を提供します。

- **ファイル**: [`docs/DEEP_DIVE.md`](docs/DEEP_DIVE.md)
- **対象読者**: アーキテクト、リード開発者

## はじめに

- **AIエージェントの方へ**: まずは `docs/OPERATIONAL_GUIDE.md` を読み込み、プロジェクトの運用ルールを理解してください。
- **開発者の方へ**: まず `docs/AI_SPEC_DRIVEN_DEVELOPMENT.md` で概念を理解し、次に `docs/PRACTICAL_GUIDE.md` で実践方法を学んでください。

---

## Revision History

| Date       | Author  | Version | Impact | Summary                                                                                                            |
| ---------- | ------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 2025-11-07 | copilot | 3.1.0   | medium | Updated index to reflect the 3-way split of the main documentation.                                                |
| 2025-11-07 | copilot | 3.0.0   | high   | Refactored monolithic file into OPERATIONAL_GUIDE.md and AI_SPEC_DRIVEN_DEVELOPMENT.md. This file is now an index. |
