# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 MANDATORY: Always Read MASTER.md First

**Before starting any work on this project, you MUST read and understand the contents of `docs-template/MASTER.md`.**

This document contains:

- Project identification and context
- Technical stack and architecture patterns
- Mandatory coding rules and constraints
- AI-specific prompts and guidelines
- Implementation priorities and phases

**Failure to reference MASTER.md will result in incorrect implementations that violate project standards.**

## 🚨 Information Verification Protocol

**CRITICAL RULE: When information is missing, DO NOT make assumptions. Always request confirmation.**

### Required Information Checklist

Before proceeding with any implementation, verify you have:

**Project Fundamentals**:

- [ ] Project name (specific, not generic)
- [ ] Target users (who is this for?)
- [ ] Core features (what does it do?)
- [ ] Technology stack (languages, frameworks, databases)

**Technical Details**:

- [ ] Database type (PostgreSQL? MongoDB? MySQL?)
- [ ] Authentication method (JWT? OAuth? Session?)
- [ ] Deployment environment (AWS? GCP? Azure? Vercel?)
- [ ] API format (REST? GraphQL? gRPC?)

**Requirements**:

- [ ] Performance targets (specific numbers)
- [ ] Security requirements (mandatory safeguards)
- [ ] Scalability needs (concurrent users, data volume)
- [ ] Budget/timeline constraints

### Confirmation Template

When missing information, output in this format:

```markdown
⚠️ Missing Information - Confirmation Required

I need clarification on the following before proceeding:

[Required Confirmations]

1. Database Type

   - Why needed: PostgreSQL and MongoDB require fundamentally different designs
   - Options:
     - PostgreSQL (recommended for relational data)
     - MongoDB (recommended for document-oriented data)
     - MySQL (recommended for simplicity)
   - Please specify: Which database do you want to use?

2. [Other missing info]
   ...

[Optional Confirmations (Can proceed with assumptions)]

1. Test Coverage Target
   - Assumption: 80% minimum coverage
   - Risk: May need adjustment based on project criticality
   - Confirm if different: Yes/No

[Next Steps]
After confirmation, please instruct: "Proceed with [confirmed details]"
```

### Allowed Assumptions (Must Be Stated)

These defaults can be assumed if not specified, but **must be explicitly stated**:

- ✅ TypeScript strict mode: Enabled (stating this)
- ✅ Test coverage: 80%+ target (stating this)
- ✅ No magic numbers: Strictly enforced (stating this)
- ✅ Error handling: Result pattern (stating this)
- ✅ Naming conventions: Per MASTER.md (stating this)

### Examples of Good vs Bad Practice

❌ **Bad - Making Assumptions**:

```
"Since you didn't specify a database, I'll use PostgreSQL as it's common."
→ User wanted MongoDB, entire design needs rework
```

✅ **Good - Requesting Confirmation**:

```
"I notice the database type wasn't specified. Please choose:
1. PostgreSQL (best for relational data, ACID compliance)
2. MongoDB (best for flexible schemas, document storage)
3. MySQL (best for simplicity, wide support)

Which would you prefer for this project?"
```

For complete details, see `docs-template/MASTER.md` section "Information Verification Protocol".

---

## Project Overview

This repository contains a comprehensive guide and template system for AI-driven development documentation strategy. It demonstrates how to optimize documentation for AI development tools (Claude Code, GitHub Copilot, Cursor) by starting with a core 7-document structure (instead of traditional 60+ documents) and extending as the project grows.

**Key Concept**: The project advocates for "less is more" - fewer, highly-focused documents that AI tools can effectively parse and understand, rather than sprawling documentation that becomes counterproductive.

## Architecture & Document Structure

This project implements an AI-optimized documentation framework starting with 7 core documents (extensible as the project grows):

1. **MASTER.md** - Central coordination document containing project identification, tech stack, coding rules, and AI prompts
2. **PROJECT.md** - Vision, requirements, stakeholder analysis, and business objectives
3. **ARCHITECTURE.md** - System design, component architecture, and technical decisions
4. **DOMAIN.md** - Business logic, domain models, entities, and business rules
5. **PATTERNS.md** - Implementation patterns, coding standards, and best practices
6. **TESTING.md** - AI-driven testing strategies, test patterns, and automation approaches
7. **DEPLOYMENT.md** - Release strategies, CI/CD pipelines, and operational procedures

## Key Principles Implemented

### Anti-Magic Number Policy

The project enforces strict prohibition of magic numbers/hardcoded values:

- All meaningful values must be extracted to named constants
- Configuration values injected via environment variables or settings
- Units (ms, KB, etc.) and valid ranges must be documented
- Constants organized by architectural layer (Domain/Application/Infrastructure)

### File Size Guidelines

- Soft limit: 500 lines per file
- Hard limit: 800 lines (exceptions for generated code, schemas)
- Automatic splitting recommended when limits exceeded
- Linter configurations provided for enforcement

### AI-First Development

- Documentation optimized for AI tool comprehension
- Structured templates for consistent AI interaction
- Prompt assistance included for magic number avoidance
- Code generation rules emphasize type safety and error handling

## Repository Structure

This is a **framework and tooling repository** providing:

- `docs-template/` — Core 7-document template system with extensible folder structure (copy to your project)
- `docs/` — Concept documents, practical guides, operational guides
- `mcp/` — MCP server (TypeScript) for AI tool integration
- `scripts/` — Setup automation (GitHub labels, spec index, automated review)
- `.claude/` — Claude Code hooks and skills

### Build Commands

```bash
# MCP server
cd mcp && npm install && npm run build

# MCP validation (index check)
cd mcp && npm run check

# Spec index generation
node scripts/build-spec-index.mjs

# GitHub labels setup
bash scripts/setup-github-labels.sh

# Multi-CLI Review Agent setup
bash scripts/setup-multi-review.sh

# 品質ゲート（旧 GitHub Actions CI 相当。npm ci は含まない）
npm run quality:local
```

### Development Workflow（10ステップ）

このプロジェクトでは以下の10ステップワークフローに従って開発を進めます：

```
1. Issue       ─ 作業の起点を明確化（/create-issue で作成）
2. Branch      ─ feature/#<issue>-<description> で作業を分離
3. Implement   ─ AI駆動で実装・コミット
4. Test        ─ `npm run quality:local`（PR 前。手順の全体像: [docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md)）
5. Self-Review ─ 5観点チェック＋Review Toolkit（/pre-commit-check）
6. PR          ─ develop ベースでPR作成
7. Review      ─ @review-router＋レビュー対応（修正ループ）
8. ACE         ─ ナレッジ体系化（マージ前に実行。/ace-curate）
9. Merge       ─ Squash merge → ブランチ削除
10. Cleanup    ─ develop pull → git fetch --prune
```

**重要ルール**:

- 全作業はIssueから開始する
- ブランチ命名: `feature/#<issue-number>-<description>`
- マージ先: develop（Squash merge）
- ACEはマージ前（レビュー完了後）にfeature branchで実行する
- 詳細: [docs/AI_GIT_WORKFLOW.md](docs/AI_GIT_WORKFLOW.md)

### Working with This Repository

When making changes:

1. Understand the AI-optimization principles in `ai_spec_driven_development.md`
2. Follow the core 7-document templates in `docs-template/` (extensible per project needs)
3. Maintain consistency with the established patterns
4. Ensure MCP server builds successfully after doc changes (`cd mcp && npm run check`)
5. Keep magic number prohibition guidelines updated

## Special Considerations

- **Version control** — All changes should maintain the integrity of the core document system and its extensions
- **MCP server** — After modifying `docs/` or `docs-template/`, verify with `cd mcp && npm run check`
- **Examples** — All code examples should demonstrate anti-magic number practices
- **Templates** — Maintain template sections as placeholders for actual project adaptation

## Document Relationships

```
MASTER.md (Central Hub)
├── PROJECT.md (Business Layer)
├── ARCHITECTURE.md (Technical Layer)
├── DOMAIN.md (Business Logic Layer)
├── PATTERNS.md (Implementation Layer)
├── TESTING.md (Quality Layer)
└── DEPLOYMENT.md (Operations Layer)
```

Each document serves a specific AI-readable purpose while maintaining cross-references to others, creating a coherent information architecture that LLMs can effectively navigate and utilize.

## Usage Notes for AI Tools

- Prioritize reading MASTER.md first for project context
- Reference PATTERNS.md for coding standards and anti-magic number enforcement
- Use ARCHITECTURE.md for technical design decisions
- Apply DOMAIN.md for business rule validation
- Follow TESTING.md for quality assurance patterns
- Consult DEPLOYMENT.md for operational requirements

This structure enables AI tools to quickly locate relevant information without parsing through dozens of scattered documents.
