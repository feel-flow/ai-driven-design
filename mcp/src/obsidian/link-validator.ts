/**
 * リンク検証機能
 * 
 * 全Markdownファイルを走査して、壊れたリンクや孤立ファイルを検出します。
 */

import fs from 'fs';
import path from 'path';
import { walkMarkdownFiles } from './utils.js';

/**
 * Markdownリンクのパターン
 * 形式: [text](path.md) または [text](path.md#section)
 */
function createMarkdownLinkPattern(): RegExp {
  return /\[([^\]]+)\]\(([^)]+)\)/g;
}

/**
 * Markdownヘッダーのパターン
 * 形式: # Header または ## Header など
 */
function createHeaderPattern(): RegExp {
  return /^#{1,6}\s+(.+)$/gm;
}

function stripFencedCodeBlocks(content: string): string {
  return content.replace(/`{3}[\s\S]*?`{3}/g, '');
}

function stripInlineCode(content: string): string {
  return content.replace(/`[^`\n]+`/g, '');
}

/**
 * リンクエラーの型定義
 */
export interface LinkError {
  /** エラーが見つかったファイル */
  file: string;
  /** リンクテキスト */
  linkText: string;
  /** リンク先パス */
  linkPath: string;
  /** エラータイプ */
  errorType: 'FILE_NOT_FOUND' | 'INVALID_ANCHOR';
  /** エラーメッセージ */
  message: string;
}

/**
 * 孤立ファイルの情報
 */
export interface OrphanedFile {
  /** ファイルパス */
  file: string;
  /** 相対パス表示用 */
  relativePath: string;
}

/**
 * リンク検証レポート
 */
export interface LinkValidationReport {
  /** 検証したファイル数 */
  totalFiles: number;
  /** 検証したリンク数 */
  totalLinks: number;
  /** 壊れたリンクの数 */
  brokenLinks: number;
  /** リンクエラーのリスト */
  errors: LinkError[];
  /** 孤立ファイルの数 */
  orphanedFilesCount: number;
  /** 孤立ファイルのリスト */
  orphanedFiles: OrphanedFile[];
}

/**
 * ヘッダーからアンカーIDを生成
 * Obsidianと同じルールでアンカーを生成
 * @param header ヘッダーテキスト
 * @returns アンカーID
 */
function generateAnchorId(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '') // 記号を削除（日本語などUnicode文字は保持）
    .replace(/\s+/g, '-'); // スペースをハイフンに変換
}

/**
 * ファイル内の有効なアンカーIDを抽出
 * @param content ファイルの内容
 * @returns アンカーIDのセット
 */
function extractAnchors(content: string): Set<string> {
  const anchors = new Set<string>();
  const headerPattern = createHeaderPattern();
  let match: RegExpExecArray | null;
  
  while ((match = headerPattern.exec(content)) !== null) {
    const header = match[1];
    const anchorId = generateAnchorId(header);
    anchors.add(anchorId);
  }
  
  return anchors;
}

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
 * ファイル内のリンクを検証
 * @param filePath ファイルの絶対パス
 * @param content ファイルの内容
 * @returns リンクエラーのリストと検証したリンク数
 */
async function validateLinksInFile(filePath: string, content: string): Promise<{ errors: LinkError[]; linkCount: number }> {
  const errors: LinkError[] = [];
  let linkCount = 0;
  const contentToScan = stripInlineCode(stripFencedCodeBlocks(content));
  const markdownLinkPattern = createMarkdownLinkPattern();
  let match: RegExpExecArray | null;
  
  while ((match = markdownLinkPattern.exec(contentToScan)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];
    
    // 外部リンク（http, https）はスキップ
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
      continue;
    }
    
    linkCount++;
    
    // 相対パスを絶対パスに解決
    const { absolutePath, anchor } = resolveRelativePath(filePath, linkPath);
    
    // ファイルの存在確認
    try {
      await fs.promises.access(absolutePath);
      
      // アンカーが指定されている場合、アンカーの検証
      if (anchor) {
        try {
          const targetContent = await fs.promises.readFile(absolutePath, 'utf-8');
          const anchors = extractAnchors(targetContent);
          
          if (!anchors.has(anchor)) {
            errors.push({
              file: filePath,
              linkText,
              linkPath,
              errorType: 'INVALID_ANCHOR',
              message: `アンカー '#${anchor}' が ${path.basename(absolutePath)} に存在しません`
            });
          }
        } catch (readError) {
          errors.push({
            file: filePath,
            linkText,
            linkPath,
            errorType: 'FILE_NOT_FOUND',
            message: `ファイル読み込みエラー: ${(readError as Error).message}`
          });
        }
      }
    } catch (error) {
      errors.push({
        file: filePath,
        linkText,
        linkPath,
        errorType: 'FILE_NOT_FOUND',
        message: `リンク先ファイルが存在しません: ${absolutePath}`
      });
    }
  }
  
  return { errors, linkCount };
}

/**
 * 全ドキュメントのリンクを検証
 * @param docsRoot ドキュメントのルートパス
 * @returns リンク検証レポート
 */
export async function validateAllLinks(docsRoot: string): Promise<LinkValidationReport> {
  const allErrors: LinkError[] = [];
  let totalFiles = 0;
  let totalLinks = 0;
  
  await walkMarkdownFiles(docsRoot, async (fullPath, content) => {
    totalFiles++;
    const { errors, linkCount } = await validateLinksInFile(fullPath, content);
    allErrors.push(...errors);
    totalLinks += linkCount;
  });
  
  return {
    totalFiles,
    totalLinks,
    brokenLinks: allErrors.length,
    errors: allErrors,
    orphanedFilesCount: 0,
    orphanedFiles: []
  };
}

/**
 * 孤立ファイル（どこからもリンクされていないファイル）を検出
 * @param docsRoot ドキュメントのルートパス
 * @returns 孤立ファイルのリスト
 */
export async function getOrphanedFiles(docsRoot: string): Promise<OrphanedFile[]> {
  const allFiles = new Set<string>();
  const linkedFiles = new Set<string>();
  
  // 全Markdownファイルを収集
  await walkMarkdownFiles(docsRoot, async (fullPath) => {
    allFiles.add(fullPath);
  });
  
  // 全リンクを収集
  await walkMarkdownFiles(docsRoot, async (fullPath, content) => {
    const markdownLinkPattern = createMarkdownLinkPattern();
    const contentToScan = stripInlineCode(stripFencedCodeBlocks(content));
    let match: RegExpExecArray | null;
    
    while ((match = markdownLinkPattern.exec(contentToScan)) !== null) {
      const linkPath = match[2];
      
      // 外部リンクはスキップ
      if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
        continue;
      }
      
      const { absolutePath } = resolveRelativePath(fullPath, linkPath);
      
      if (absolutePath.endsWith('.md')) {
        linkedFiles.add(absolutePath);
      }
    }
  });
  
  // 孤立ファイルを特定（すべてのファイル - リンクされているファイル）
  const orphanedFiles: OrphanedFile[] = [];
  
  for (const file of allFiles) {
    if (!linkedFiles.has(file)) {
      const relativePath = path.relative(docsRoot, file);
      orphanedFiles.push({ file, relativePath });
    }
  }
  
  // ファイル名順にソート
  orphanedFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  
  return orphanedFiles;
}
