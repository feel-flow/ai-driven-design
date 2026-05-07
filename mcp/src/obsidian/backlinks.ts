/**
 * バックリンク生成機能
 * 
 * 全Markdownファイルを走査してリンク元マップを構築し、
 * 各ファイル末尾の「## Linked from」セクションを更新します。
 */

import fs from 'fs';
import path from 'path';
import { BACKLINKS_SECTION_HEADER, BACKLINKS_SECTION_TEMPLATE } from '../constants.js';
import { walkMarkdownFiles } from './utils.js';

/**
 * Markdownリンクのパターン
 * 形式: [text](path.md) または [text](path.md#section)
 */
function createMarkdownLinkPattern(): RegExp {
  return /\[([^\]]+)\]\(([^)]+)\)/g;
}

function stripFencedCodeBlocks(content: string): string {
  return content.replace(/`{3}[\s\S]*?`{3}/g, '');
}

function stripInlineCode(content: string): string {
  return content.replace(/`[^`\n]+`/g, '');
}

/**
 * バックリンクマップの型定義
 * Key: ファイルの絶対パス
 * Value: このファイルへのリンクを持つファイルのリスト
 */
export type BacklinksMap = Map<string, Array<{
  fromFile: string;
  linkText: string;
  anchor?: string;
}>>;

/**
 * 相対パスを絶対パスに解決
 * @param fromFile リンク元ファイルの絶対パス
 * @param linkPath リンクパス（相対または絶対）
 * @returns 解決された絶対パス（アンカーを除く）
 */
function resolveRelativePath(fromFile: string, linkPath: string): { absolutePath: string; anchor?: string } {
  // アンカーを分離
  const [pathPart, anchor] = linkPath.split('#');
  if (!pathPart) {
    return { absolutePath: fromFile, anchor };
  }
  
  // 絶対パスの場合
  if (path.isAbsolute(pathPart)) {
    return { absolutePath: pathPart, anchor };
  }
  
  // 相対パスの場合
  const fromDir = path.dirname(fromFile);
  const absolutePath = path.resolve(fromDir, pathPart);
  
  return { absolutePath, anchor };
}

/**
 * ファイル内のMarkdownリンクを抽出
 * @param filePath ファイルの絶対パス
 * @param content ファイルの内容
 * @returns 抽出されたリンク情報の配列
 */
function extractLinks(filePath: string, content: string): Array<{ targetPath: string; linkText: string; anchor?: string }> {
  const links: Array<{ targetPath: string; linkText: string; anchor?: string }> = [];
  const markdownLinkPattern = createMarkdownLinkPattern();
  let match: RegExpExecArray | null;
  
  // バックリンクセクション内のリンクは無視（無限ループ回避）
  const backlinksIndex = content.indexOf(BACKLINKS_SECTION_HEADER);
  const contentWithoutBacklinksSection = backlinksIndex !== -1 ? content.substring(0, backlinksIndex) : content;
  const contentToScan = stripInlineCode(stripFencedCodeBlocks(contentWithoutBacklinksSection));
  
  while ((match = markdownLinkPattern.exec(contentToScan)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];
    
    // 外部リンク（http, https）は無視
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
      continue;
    }
    
    // 相対パスを絶対パスに解決
    const { absolutePath, anchor } = resolveRelativePath(filePath, linkPath);
    
    // .md ファイルのみを対象
    if (absolutePath.endsWith('.md')) {
      links.push({ targetPath: absolutePath, linkText, anchor });
    }
  }
  
  return links;
}

/**
 * バックリンクマップを構築
 * @param repoRoot リポジトリのルートパス
 * @param docsRoot ドキュメントのルートパス（例: docs-template/）
 * @returns バックリンクマップ
 */
export async function buildBacklinksMap(repoRoot: string, docsRoot: string): Promise<BacklinksMap> {
  const backlinksMap: BacklinksMap = new Map();
  
  await walkMarkdownFiles(docsRoot, async (fullPath, content) => {
    const links = extractLinks(fullPath, content);
    
    // 各リンクに対してバックリンクを記録
    for (const link of links) {
      if (!backlinksMap.has(link.targetPath)) {
        backlinksMap.set(link.targetPath, []);
      }
      
      backlinksMap.get(link.targetPath)!.push({
        fromFile: fullPath,
        linkText: link.linkText,
        anchor: link.anchor
      });
    }
  });
  
  return backlinksMap;
}

/**
 * 相対パスを計算
 * @param from 基準ファイルの絶対パス
 * @param to 対象ファイルの絶対パス
 * @returns 相対パス
 */
function getRelativePath(from: string, to: string): string {
  const fromDir = path.dirname(from);
  const relativePath = path.relative(fromDir, to);
  
  // UNIXスタイルのパス区切り文字に統一
  return relativePath.replace(/\\/g, '/');
}

/**
 * バックリンクセクションを生成
 * @param targetFile 対象ファイルの絶対パス
 * @param backlinks このファイルへのバックリンク情報
 * @returns バックリンクセクションの文字列
 */
function generateBacklinksSection(targetFile: string, backlinks: Array<{ fromFile: string; linkText: string; anchor?: string }>): string {
  if (backlinks.length === 0) {
    return BACKLINKS_SECTION_TEMPLATE + '（このドキュメントへのリンクはまだありません）\n';
  }
  
  let section = BACKLINKS_SECTION_TEMPLATE;
  
  // リンク元ファイルをソート（ファイル名順）
  const sortedBacklinks = [...backlinks].sort((a, b) => 
    path.basename(a.fromFile).localeCompare(path.basename(b.fromFile))
  );
  
  for (const backlink of sortedBacklinks) {
    const relativePath = getRelativePath(targetFile, backlink.fromFile);
    const fileName = path.basename(backlink.fromFile, '.md');
    section += `- [${fileName}](${relativePath})`;
    
    if (backlink.anchor) {
      section += ` (→ #${backlink.anchor})`;
    }
    
    section += '\n';
  }
  
  section += '\n';
  
  return section;
}

/**
 * ファイルのバックリンクセクションを更新
 * @param filePath ファイルの絶対パス
 * @param backlinks このファイルへのバックリンク情報
 * @returns 更新結果
 */
export async function updateBacklinksSection(
  filePath: string,
  backlinks: Array<{ fromFile: string; linkText: string; anchor?: string }>
): Promise<{ success: boolean; updated: boolean; error?: Error }> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // 既存のバックリンクセクションを検索
    const backlinksIndex = content.indexOf(BACKLINKS_SECTION_HEADER);
    
    // 新しいバックリンクセクションを生成
    const newBacklinksSection = generateBacklinksSection(filePath, backlinks);
    
    let newContent: string;
    
    if (backlinksIndex !== -1) {
      // 既存のセクションを置換
      const beforeBacklinks = content.substring(0, backlinksIndex);
      newContent = beforeBacklinks.trimEnd() + '\n\n' + newBacklinksSection;
    } else {
      // ファイル末尾に追加
      newContent = content.trimEnd() + '\n\n' + newBacklinksSection;
    }
    
    // 内容が変更された場合のみ書き込み
    if (newContent !== content) {
      await fs.promises.writeFile(filePath, newContent, 'utf-8');
      return { success: true, updated: true };
    }
    
    return { success: true, updated: false };
  } catch (error) {
    return { success: false, updated: false, error: error as Error };
  }
}

/**
 * 全ファイルのバックリンクセクションを更新
 * @param repoRoot リポジトリのルートパス
 * @param docsRoot ドキュメントのルートパス
 * @returns 更新結果
 */
export async function updateAllBacklinks(
  repoRoot: string, 
  docsRoot: string
): Promise<{ updated: number; total: number; failed: Array<{ file: string; error: string }> }> {
  const backlinksMap = await buildBacklinksMap(repoRoot, docsRoot);
  
  let updatedCount = 0;
  let totalCount = 0;
  const failed: Array<{ file: string; error: string }> = [];
  
  await walkMarkdownFiles(docsRoot, async (fullPath) => {
    totalCount++;
    const backlinks = backlinksMap.get(fullPath) || [];
    const result = await updateBacklinksSection(fullPath, backlinks);
    
    if (result.success) {
      if (result.updated) {
        updatedCount++;
      }
    } else {
      failed.push({
        file: path.relative(repoRoot, fullPath),
        error: result.error?.message || 'Unknown error'
      });
    }
  });
  
  return { updated: updatedCount, total: totalCount, failed };
}
