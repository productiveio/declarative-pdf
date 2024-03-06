import { Model, type TModel } from '@app/models/model';
import type { PDFDocument } from 'pdf-lib';

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
