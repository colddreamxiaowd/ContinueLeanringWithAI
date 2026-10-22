export interface DemoParagraph {
  index: number;
  level: number;
  text: string;
}

export interface DemoTextBlock {
  type: 'text';
  role: 'title' | 'body';
  shape_index: number;
  paragraphs: DemoParagraph[];
}

export interface DemoTableBlock {
  type: 'table';
  shape_index: number;
  rows: string[][];
}

export interface DemoUnsupportedBlock {
  type: 'unsupported';
  shape_index: number;
  shape_type: string;
  note: string;
}

export type DemoBlock = DemoTextBlock | DemoTableBlock | DemoUnsupportedBlock;

export interface DemoSlide {
  slide_index: number;
  slide_number: number;
  title: string;
  blocks: DemoBlock[];
}

export interface DemoDocument {
  schema_version: string;
  document_id: string;
  title: string;
  source_kind: string;
  source_sha256: string;
  current_version: string;
  slide_count: number;
  synthetic: boolean;
  demo: boolean;
  notice: string;
  slides: DemoSlide[];
}

export interface DemoIndexEntry {
  document_id: string;
  title: string;
  source_kind: string;
  source_sha256: string;
  current_version: string;
  schema_version: string;
  slide_count: number;
  synthetic: boolean;
  demo: boolean;
  content_file: string;
}

export interface DemoIndex {
  schema_version: string;
  generated_by: string;
  synthetic: boolean;
  notice: string;
  documents: DemoIndexEntry[];
}

export function readDemoIndex(): DemoIndex;
export function readDemoDocument(documentId: string): DemoDocument | null;
