import { Model, type TModel } from '@app/models/model';
import type { PDFDocument } from 'pdf-lib';

// TODO: refactor this - for anything other than a body, we need only the first page
// also, body only needs a buffer if there are no other page elements
// also, other sections don't need a buffer, only generated pdf page
export type TPageElement = {
  buffer: Buffer;
  pdf: PDFDocument;
} & TModel;

export class PageElement extends Model {
  declare buffer: TPageElement['buffer'];
  declare pdf: TPageElement['pdf'];

  constructor(opts: TPageElement) {
    super(opts);
    this.buffer = opts.buffer;
    this.pdf = opts.pdf;
  }
}
