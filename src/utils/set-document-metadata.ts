import type {PDFDocument} from 'pdf-lib';
import type {DocumentMeta} from '@app/index';

function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidKeyword(keyword: any): keyword is string[] {
  return Array.isArray(keyword) && !!keyword.length && keyword.every((k) => typeof k === 'string');
}

function typedEntries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

const adapters: {[K in keyof DocumentMeta]: (pdf: PDFDocument, value: DocumentMeta[K]) => void} = {
  title: (pdf, value) => pdf.setTitle(value),
  author: (pdf, value) => pdf.setAuthor(value),
  subject: (pdf, value) => pdf.setSubject(value),
  keywords: (pdf, value) => isValidKeyword(value) && pdf.setKeywords(value),
  producer: (pdf, value) => pdf.setProducer(value),
  creator: (pdf, value) => pdf.setCreator(value),
  creationDate: (pdf, value) => isValidDate(value) && pdf.setCreationDate(value),
  modificationDate: (pdf, value) => isValidDate(value) && pdf.setModificationDate(value),
};

export function setDocumentMetadata(pdf: PDFDocument, meta?: Partial<DocumentMeta>): void {
  if (!meta || Object.keys(meta).length === 0) return;

  for (const [key, value] of typedEntries(meta)) {
    if (value !== undefined && value !== null && key in adapters) {
      adapters[key](pdf, value as any);
    }
  }
}
