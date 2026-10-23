export type OfficeSection = { label: string; title: string; paragraphs: string[] };
export type OfficeReadResult = { format: 'pptx' | 'docx' | 'xlsx'; sections: OfficeSection[]; totalSections: number };
export function extractOfficeSections(data: Uint8Array, filename: string): OfficeReadResult;
