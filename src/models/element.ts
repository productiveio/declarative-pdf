import type { PDFDocument } from 'pdf-lib';
import type { SectionSetting } from '@app/evaluators/section-settings';

interface BodyElementOpts {
  buffer: Buffer;
  pdf: PDFDocument;
}

// TODO: check if we need to handle page embedding
export class BodyElement {
  declare buffer: Buffer;
  declare pdf: PDFDocument;

  constructor(opts: BodyElementOpts) {
    this.buffer = opts.buffer;
    this.pdf = opts.pdf;
  }

  embedPageNum(num: number, targetDocument: PDFDocument) {
    return targetDocument.embedPdf(this.pdf, [num]);
  }
}

interface SectionElementOpts {
  buffer: Buffer;
  pdf: PDFDocument;
  setting: SectionSetting;
}

// TODO: figure out page embedding
export class SectionElement {
  declare buffer: Buffer;
  declare pdf: PDFDocument;
  declare setting: SectionSetting;

  isEmbedded: boolean = false;

  constructor(opts: SectionElementOpts) {
    this.buffer = opts.buffer;
    this.pdf = opts.pdf;
    this.setting = opts.setting;
  }

  get isReusable() {
    return (
      this.setting.hasCurrentPageNumber || this.setting.hasTotalPagesNumber
    );
  }

  embedPage(targetDocument: PDFDocument) {
    this.isEmbedded = true;
    return targetDocument.embedPdf(this.pdf);
  }
}
