export interface SectionIndexEntry {
  file: string;
  title: string;
  content: string;
}

export interface SpecRecordMeta {
  specId?: string;
  title?: string;
  owners?: unknown; // TODO: refine schema (array of { github: string })
  status?: string; // validate separately against SpecStatus
  version?: string;
  lastUpdated?: string;
  tags?: unknown;
  links?: unknown;
  summary?: string;
  riskLevel?: string;
  impact?: string;
  metrics?: unknown;
  file: string; // relative path
  body: string;
}

export interface SpecIndexResult {
  specs: SpecRecordMeta[];
  errors: Array<{ file: string; specId: string | null; errors: string[] }>;
}

export type Glossary = Record<string, string>;

export interface SearchResultItem {
  file: string;
  title: string;
  score: number;
  excerpt: string;
}
