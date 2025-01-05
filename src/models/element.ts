import type {PDFDocument, PDFEmbeddedPage} from 'pdf-lib';
import type {SectionSetting} from '@app/evaluators/section-settings';

interface BodyElementOpts {
  buffer: Buffer;
  pdf: PDFDocument;
  layout: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export class BodyElement {
  declare buffer: Buffer;
  declare pdf: PDFDocument;
  declare layout: BodyElementOpts['layout'];

  constructor(opts: BodyElementOpts) {
    this.buffer = opts.buffer;
    this.pdf = opts.pdf;
    this.layout = opts.layout;
  }

  get x() {
    return this.layout.x;
  }

  get y() {
    return this.layout.y;
  }

  get width() {
    return this.layout.width;
  }

  get height() {
    return this.layout.height;
  }

  async embedPageIdx(targetDocument: PDFDocument, idx: number) {
    return await targetDocument.embedPdf(this.pdf, [idx]);
  }
}

interface SectionElementOpts {
  buffer: Buffer;
  pdf: PDFDocument;
  setting: SectionSetting;
  layout: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export class SectionElement {
  declare buffer: Buffer;
  declare pdf: PDFDocument;
  declare setting: SectionSetting;
  declare layout: SectionElementOpts['layout'];

  private embeddedPage?: PDFEmbeddedPage;

  constructor(opts: SectionElementOpts) {
    this.buffer = opts.buffer;
    this.pdf = opts.pdf;
    this.setting = opts.setting;
    this.layout = opts.layout;
  }

  get x() {
    return this.layout.x;
  }

  get y() {
    return this.layout.y;
  }

  get width() {
    return this.layout.width;
  }

  get height() {
    return this.setting.height;
  }

  async embedPage(targetDocument: PDFDocument) {
    if (this.embeddedPage) return this.embeddedPage;

    const pages = await targetDocument.embedPdf(this.pdf);
    this.embeddedPage = pages[0];
    return pages[0];
  }
}
