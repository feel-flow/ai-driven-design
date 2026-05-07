/*
 * Low-level MCP Server (custom methods)
 * --------------------------------------------------------------
 * WHY: The historical high-level helpers (resource(), registerTool(), prompt())
 *      are not present in @modelcontextprotocol/sdk ^0.6.x, so we expose
 *      equivalent capabilities via explicit custom/* request handlers.
 * DESIGN:
 *   - Resources:   custom/resources/list, custom/resources/read
 *   - Tools:       custom/tools/list, custom/tools/call
 *   - (Planned) Prompts: custom/prompts/list, custom/prompts/get (future)
 * PATTERNS:
 *   - Zod schemas define each request (schema-first, fail fast)
 *   - All file access is confined under REPO_ROOT (basic path safety)
 *   - Virtual resources (search-index, spec-index) are generated on demand
 *   - Functions kept <30 lines (MASTER.md constraint) via small pure helpers
 * ERROR HANDLING:
 *   - Tool invocation returns structured { ok, error, ... } without throwing
 *   - File or access issues return coded errors (NOT_FOUND / ACCESS_DENIED)
 * SECURITY NOTES:
 *   - No arbitrary path traversal (prefix check)
 *   - No dynamic eval; glossary/spec parsing is string based only
 * EXTENSIBILITY:
 *   - To add prompts: create PROMPTS array + add handlers mirroring tools
 *   - To add new tool: use addTool(name, description, schemaDef, impl)
 * PERFORMANCE:
 *   - Indexes built once at startup; future optimization could add a lazy
 *     cache invalidation / watch if hot-reload is required.
 */
// NOTE: SDK export paths (verified by package contents). Avoid deep /dist paths if package exports root.
// Fallback to top-level server exports.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { EXCERPT_PADDING_CHARS, SPEC_STATUS, SpecStatus } from './constants.js';
import { SectionIndexEntry, SpecIndexResult, SpecRecordMeta, Glossary } from './types.js';
import { splitSections, parseFrontMatter, buildGlossary } from './utils.js';

// ---------- Paths ----------
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOCS_ROOT = path.join(REPO_ROOT, 'docs');
const DOCS_TEMPLATE_ROOT = path.join(REPO_ROOT, 'docs-template');
const SPECS_DIR = path.join(DOCS_ROOT, 'specs');
const GLOSSARY_PATH = path.join(DOCS_TEMPLATE_ROOT, '06-reference', 'GLOSSARY.md');

// ---------- FS helpers ----------
const readFileSafe = (p: string): string => { try { return fs.readFileSync(p, 'utf-8'); } catch { return ''; } };
const listMarkdown = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listMarkdown(full));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
};

// ---------- Markdown section splitting ----------
// splitSections is imported from ./utils.js

// ---------- Build indexes ----------
const MD_FILES = [path.join(REPO_ROOT, 'README.md'), path.join(REPO_ROOT, 'ai_spec_driven_development.md'), ...listMarkdown(DOCS_ROOT), ...listMarkdown(DOCS_TEMPLATE_ROOT)].filter(f => fs.existsSync(f));
const buildSearchIndex = (files: string[]): SectionIndexEntry[] => files.flatMap(f => {
  const rel = path.relative(REPO_ROOT, f);
  const text = readFileSafe(f);
  const sections = splitSections(text);
  if (!sections.length) return [{ file: rel, title: path.basename(f), content: text }];
  return sections.map(s => ({ file: rel, title: s.title || path.basename(f), content: s.content }));
});
const SEARCH_INDEX = buildSearchIndex(MD_FILES);

// ---------- Front matter parsing ----------
// parseScalar and parseFrontMatter are imported from ./utils.js

const buildSpecIndex = (): SpecIndexResult => {
  if (!fs.existsSync(SPECS_DIR)) return { specs: [], errors: [] };
  const files = listMarkdown(SPECS_DIR);
  const seen = new Set<string>();
  const specs: SpecRecordMeta[] = []; const errors: SpecIndexResult['errors'] = [];
  for (const f of files) {
    const { meta, body } = parseFrontMatter(readFileSafe(f));
    const rel = path.relative(REPO_ROOT, f);
    const spec: SpecRecordMeta = { ...(meta as Record<string, unknown>), file: rel, body };
    const errs: string[] = [];
    const status = typeof spec.status === 'string' ? spec.status : undefined;
    if (!spec.specId) errs.push('MISSING_specId');
    if (spec.specId && seen.has(spec.specId)) errs.push('DUPLICATE_specId');
    if (spec.specId) seen.add(spec.specId);
    if (!spec.title) errs.push('MISSING_title');
    if (!status) errs.push('MISSING_status');
    if (status && !SPEC_STATUS.includes(status as SpecStatus)) errs.push('INVALID_status');
    if (!spec.version) errs.push('MISSING_version');
    if (errs.length) errors.push({ file: rel, specId: (spec.specId as string) || null, errors: errs });
    specs.push(spec);
  }
  return { specs, errors };
};
const SPEC_INDEX = buildSpecIndex();

// ---------- Glossary ----------
// buildGlossary is imported from ./utils.js
let GLOSSARY: Glossary = fs.existsSync(GLOSSARY_PATH) ? buildGlossary(readFileSafe(GLOSSARY_PATH)) : {};

// ---------- Resource + Tool registries ----------
interface ResourceEntry { id: string; uri: string; mimeType: string; description: string; }
const RESOURCES: ResourceEntry[] = [
  ...MD_FILES.map(f => ({ id: path.relative(REPO_ROOT, f), uri: `file://${path.resolve(f)}`, mimeType: 'text/markdown', description: 'Project documentation markdown' })),
  { id: 'virtual/search-index', uri: 'mcp://ai-spec-driven-development/search-index', mimeType: 'application/json', description: 'In-memory search index' },
  { id: 'virtual/spec-index', uri: 'mcp://ai-spec-driven-development/spec-index', mimeType: 'application/json', description: 'Specification metadata index' }
];

type ToolImpl = (args: Record<string, unknown>) => Promise<unknown>;
interface ToolMeta { name: string; description: string; schema: z.ZodObject<any>; impl: ToolImpl; }

const tools: ToolMeta[] = [];
const addTool = (name: string, description: string, schemaDef: Record<string, z.ZodTypeAny>, impl: ToolImpl) => {
  tools.push({ name, description, schema: z.object(schemaDef), impl });
};

addTool('search', 'Keyword search over docs (title weighted).', {
  query: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(5)
}, async ({ query, limit }) => {
  const q = String(query).toLowerCase();
  const lim = Number(limit);
  return SEARCH_INDEX.map(i => {
    const titleLc = i.title.toLowerCase(); const contentLc = i.content.toLowerCase();
    const score = (titleLc.includes(q) ? 3 : 0) + (contentLc.includes(q) ? 1 : 0);
    if (!score) return null;
    const pos = contentLc.indexOf(q);
    const excerpt = pos >= 0 ? i.content.slice(Math.max(0, pos - EXCERPT_PADDING_CHARS), pos + q.length + EXCERPT_PADDING_CHARS) : '';
    return { file: i.file, title: i.title, score, excerpt };
  }).filter(Boolean).sort((a, b) => (b!.score - a!.score)).slice(0, lim);
});

addTool('extract_section', 'Extract a level-2 markdown heading section.', {
  file: z.string(),
  heading: z.string()
}, async ({ file, heading }) => {
  const rel = String(file); const abs = path.join(REPO_ROOT, rel);
  if (!abs.startsWith(REPO_ROOT) || !fs.existsSync(abs)) throw new Error('File not found');
  const sections = splitSections(readFileSafe(abs));
  const found = sections.find(s => s.title.trim() === String(heading).trim());
  return found ? { title: found.title, content: found.content } : null;
});

addTool('glossary_lookup', 'Lookup a glossary term (case-insensitive).', { term: z.string() }, async ({ term }) => {
  const key = Object.keys(GLOSSARY).find(k => k.toLowerCase() === String(term).toLowerCase());
  return key ? { term: key, definition: GLOSSARY[key] } : null;
});

addTool('list_docs', 'List documentation markdown file paths.', { prefix: z.string().optional() }, async ({ prefix }) => {
  const rels = MD_FILES.map(f => path.relative(REPO_ROOT, f));
  return prefix ? rels.filter(r => r.startsWith(String(prefix))) : rels;
});

addTool('spec_lookup', 'Retrieve spec by specId.', { specId: z.string().min(1) }, async ({ specId }) => {
  const s = SPEC_INDEX.specs.find(sp => (sp.specId || '').toLowerCase() === String(specId).toLowerCase());
  if (!s) return null; const { body, ...meta } = s; return { meta, body };
});

addTool('spec_search', 'Substring search over spec title, tags, summary.', {
  query: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(5)
}, async ({ query, limit }) => {
  const q = String(query).toLowerCase(); const lim = Number(limit);
  return SPEC_INDEX.specs.map(s => {
    const title = (s.title || '').toLowerCase();
    const summary = (s.summary || '').toLowerCase();
    const tags = Array.isArray(s.tags) ? s.tags.join(' ').toLowerCase() : '';
    const score = [title, summary, tags].reduce((acc, part) => acc + (part.includes(q) ? 1 : 0), 0);
    if (!score) return null; return { specId: s.specId, title: s.title, status: s.status, score };
  }).filter(Boolean).sort((a, b) => (b!.score - a!.score)).slice(0, lim);
});

// ---------- Zod request schemas ----------
const ResourcesListRequest = z.object({ method: z.literal('custom/resources/list'), params: z.object({}).optional() });
type ResourcesListReq = z.infer<typeof ResourcesListRequest>;
const ResourcesReadRequest = z.object({ method: z.literal('custom/resources/read'), params: z.object({ id: z.string() }) });
type ResourcesReadReq = z.infer<typeof ResourcesReadRequest>;
const ToolsListRequest = z.object({ method: z.literal('custom/tools/list'), params: z.object({}).optional() });
type ToolsListReq = z.infer<typeof ToolsListRequest>;
const ToolsCallRequest = z.object({ method: z.literal('custom/tools/call'), params: z.object({ name: z.string(), args: z.record(z.any()).optional() }) });
type ToolsCallReq = z.infer<typeof ToolsCallRequest>;

// ---------- Server init ----------
const server = new Server({ name: 'ai-spec-driven-development-mcp', version: '0.3.0' }, { capabilities: { logging: {} } });

// ---------- Request Handlers ----------
server.setRequestHandler(ResourcesListRequest, async (_req: ResourcesListReq) => ({
  resources: RESOURCES.map(r => ({ id: r.id, uri: r.uri, mimeType: r.mimeType, description: r.description }))
}));

server.setRequestHandler(ResourcesReadRequest, async (req: ResourcesReadReq) => {
  const id = req.params?.id;
  const res = RESOURCES.find(r => r.id === id);
  if (!res) return { error: 'NOT_FOUND', id };
  if (res.id === 'virtual/search-index') return { id, contents: [{ uri: res.uri, mimeType: res.mimeType, text: JSON.stringify(SEARCH_INDEX, null, 2) }] };
  if (res.id === 'virtual/spec-index') return { id, contents: [{ uri: res.uri, mimeType: res.mimeType, text: JSON.stringify({ generatedAt: new Date().toISOString(), ...SPEC_INDEX }, null, 2) }] };
  const filePath = url.fileURLToPath(res.uri);
  if (!filePath.startsWith(REPO_ROOT) || !fs.existsSync(filePath)) return { error: 'ACCESS_DENIED', id };
  return { id, contents: [{ uri: res.uri, mimeType: res.mimeType, text: readFileSafe(filePath) }] };
});

server.setRequestHandler(ToolsListRequest, async (_req: ToolsListReq) => ({
  tools: tools.map(t => ({ name: t.name, description: t.description }))
}));

server.setRequestHandler(ToolsCallRequest, async (req: ToolsCallReq) => {
  const name = req.params?.name;
  const args = (req.params?.args as Record<string, unknown>) || {};
  const t = tools.find(tt => tt.name === name);
  if (!t) return { ok: false, error: 'UNKNOWN_TOOL', name };
  const parsed = t.schema.safeParse(args);
  if (!parsed.success) return { ok: false, error: 'INVALID_ARGS', issues: parsed.error.issues };
  try {
    const data = await t.impl(parsed.data as Record<string, unknown>);
    return { ok: true, tool: name, data };
  } catch (e) {
    return { ok: false, error: 'EXECUTION_FAILED', message: (e as Error).message };
  }
});

// ---------- Check mode ----------
if (process.argv.includes('--check')) {
  console.error(`Indexed files=${MD_FILES.length} sections=${SEARCH_INDEX.length} specs=${SPEC_INDEX.specs.length} errors=${SPEC_INDEX.errors.length} glossaryTerms=${Object.keys(GLOSSARY).length}`);
  process.exit(0);
}

// ---------- Start server ----------
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[mcp] server started (low-level custom methods)');
