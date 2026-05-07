#!/usr/bin/env node

/**
 * Obsidian同期CLIスクリプト
 * 
 * MCPサーバーのObsidian機能をコマンドラインから実行します。
 * 
 * 使用方法:
 *   node scripts/obsidian-sync.mjs backlinks [--dry-run] [--silent]
 *   node scripts/obsidian-sync.mjs validate
 *   node scripts/obsidian-sync.mjs report
 *   node scripts/obsidian-sync.mjs orphaned
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  updateAllBacklinks, 
  validateAllLinks, 
  getOrphanedFiles 
} from '../mcp/dist/obsidian/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DOCS_TEMPLATE_ROOT = join(REPO_ROOT, 'docs-template');

// コマンドライン引数のパース
const args = process.argv.slice(2);
const command = args[0];
const flags = {
  dryRun: args.includes('--dry-run'),
  silent: args.includes('--silent')
};

/**
 * ログ出力（--silent フラグがない場合のみ）
 */
function log(...messages) {
  if (!flags.silent) {
    console.log(...messages);
  }
}

/**
 * エラー出力
 */
function error(...messages) {
  console.error(...messages);
}

/**
 * バックリンク更新コマンド
 */
async function runBacklinks() {
  try {
    log('📚 バックリンクを更新中...');
    
    if (flags.dryRun) {
      log('⚠️  DRY RUNモード: 実際の更新は行いません');
      // Dry runの場合は検証のみ
      const report = await validateAllLinks(DOCS_TEMPLATE_ROOT);
      log(`✅ 検証完了: ${report.totalFiles} ファイル, ${report.totalLinks} リンク`);
      if (report.brokenLinks > 0) {
        log(`⚠️  壊れたリンク: ${report.brokenLinks} 件`);
      }
      return;
    }
    
    const result = await updateAllBacklinks(REPO_ROOT, DOCS_TEMPLATE_ROOT);
    
    if (result.failed.length > 0) {
      log(`⚠️  ${result.failed.length} ファイルの更新に失敗しました:`);
      for (const fail of result.failed.slice(0, 5)) {
        log(`  - ${fail.file}: ${fail.error}`);
      }
      if (result.failed.length > 5) {
        log(`  ... 他 ${result.failed.length - 5} 件`);
      }
    }
    
    if (result.updated === 0) {
      log('✅ すべてのバックリンクは最新です');
    } else {
      log(`✅ ${result.updated} / ${result.total} ファイルを更新しました`);
    }
  } catch (err) {
    error('❌ バックリンク更新エラー:', err?.message || err);
    process.exit(1);
  }
}

/**
 * リンク検証コマンド
 */
async function runValidate() {
  try {
    log('🔍 リンクを検証中...');
    
    const report = await validateAllLinks(DOCS_TEMPLATE_ROOT);
    
    log('\n📊 検証結果:');
    log(`  - ファイル数: ${report.totalFiles}`);
    log(`  - リンク数: ${report.totalLinks}`);
    log(`  - 壊れたリンク: ${report.brokenLinks}`);
    
    if (report.errors.length > 0) {
      log('\n⚠️  エラー詳細:');
      for (const err of report.errors) {
        const relPath = err.file.replace(REPO_ROOT + '/', '');
        log(`  - ${relPath}`);
        log(`    [${err.linkText}](${err.linkPath})`);
        log(`    ${err.errorType}: ${err.message}`);
      }
      process.exit(1);
    } else {
      log('\n✅ すべてのリンクが正常です');
    }
  } catch (err) {
    error('❌ リンク検証エラー:', err.message);
    process.exit(1);
  }
}

/**
 * レポート生成コマンド
 */
async function runReport() {
  try {
    log('📈 ナレッジベースレポートを生成中...');
    
    const linkReport = await validateAllLinks(DOCS_TEMPLATE_ROOT);
    const orphanedFiles = await getOrphanedFiles(DOCS_TEMPLATE_ROOT);
    
    log('\n📊 ナレッジベース統計:');
    log(`  - ドキュメント数: ${linkReport.totalFiles}`);
    log(`  - 総リンク数: ${linkReport.totalLinks}`);
    log(`  - 壊れたリンク: ${linkReport.brokenLinks}`);
    log(`  - 孤立ファイル: ${orphanedFiles.length}`);
    
    if (linkReport.brokenLinks > 0) {
      log('\n⚠️  壊れたリンク:');
      for (const err of linkReport.errors.slice(0, 5)) {
        const relPath = err.file.replace(REPO_ROOT + '/', '');
        log(`  - ${relPath}: ${err.linkText}`);
      }
      if (linkReport.errors.length > 5) {
        log(`  ... 他 ${linkReport.errors.length - 5} 件`);
      }
    }
    
    if (orphanedFiles.length > 0) {
      log('\n📄 孤立ファイル:');
      for (const file of orphanedFiles.slice(0, 10)) {
        log(`  - ${file.relativePath}`);
      }
      if (orphanedFiles.length > 10) {
        log(`  ... 他 ${orphanedFiles.length - 10} 件`);
      }
    }
    
    log('\n✅ レポート生成完了');
  } catch (err) {
    error('❌ レポート生成エラー:', err.message);
    process.exit(1);
  }
}

/**
 * 孤立ファイル検出コマンド
 */
async function runOrphaned() {
  try {
    log('🔍 孤立ファイルを検出中...');
    
    const orphanedFiles = await getOrphanedFiles(DOCS_TEMPLATE_ROOT);
    
    if (orphanedFiles.length === 0) {
      log('✅ 孤立ファイルは見つかりませんでした');
      return;
    }
    
    log(`\n⚠️  ${orphanedFiles.length} 件の孤立ファイルが見つかりました:\n`);
    for (const file of orphanedFiles) {
      log(`  - ${file.relativePath}`);
    }
    
    log('\nℹ️  これらのファイルはどのドキュメントからもリンクされていません');
  } catch (err) {
    error('❌ 孤立ファイル検出エラー:', err.message);
    process.exit(1);
  }
}

/**
 * ヘルプ表示
 */
function showHelp() {
  console.log(`
Obsidian同期CLIツール

使用方法:
  node scripts/obsidian-sync.mjs <command> [options]

コマンド:
  backlinks              バックリンクセクションを更新
  validate               すべてのリンクを検証
  report                 ナレッジベース統計レポートを生成
  orphaned               孤立ファイル（リンクされていないファイル）を検出

オプション:
  --dry-run              実際の変更を行わず、検証のみ実施（backlinkコマンドのみ）
  --silent               ログ出力を抑制（エラーのみ表示）

例:
  node scripts/obsidian-sync.mjs backlinks
  node scripts/obsidian-sync.mjs backlinks --dry-run
  node scripts/obsidian-sync.mjs validate
  node scripts/obsidian-sync.mjs report
  node scripts/obsidian-sync.mjs orphaned
`);
}

/**
 * メイン処理
 */
async function main() {
  if (!command || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }
  
  switch (command) {
    case 'backlinks':
      await runBacklinks();
      break;
    case 'validate':
      await runValidate();
      break;
    case 'report':
      await runReport();
      break;
    case 'orphaned':
      await runOrphaned();
      break;
    default:
      error(`❌ 不明なコマンド: ${command}`);
      error('詳細は --help を参照してください');
      process.exit(1);
  }
}

main().catch(err => {
  error('❌ 予期しないエラー:', err);
  process.exit(1);
});
