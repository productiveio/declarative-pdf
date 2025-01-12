import type {PDFDocument, PDFPage, PDFEmbeddedPage} from 'pdf-lib';
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

  async embedPageIdx(targetPage: PDFPage, idx: number) {
    return await targetPage.doc.embedPdf(this.pdf, [idx]);
  }
}

type SectionType = 'header' | 'footer' | 'background';

interface SectionElementOpts {
  buffer: Buffer;
  pdf: PDFDocument;
  debug: {
    type: SectionType;
    pageNumber: number;
  };
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
  declare debug: SectionElementOpts['debug'];

  declare private _name: string;
  private embeddedPage?: PDFEmbeddedPage;

  constructor(opts: SectionElementOpts) {
    this.buffer = opts.buffer;
    this.pdf = opts.pdf;
    this.setting = opts.setting;
    this.layout = opts.layout;

    this.debug = opts.debug;
    this._name = `${opts.debug.pageNumber}-${opts.debug.type}.pdf`;
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

  get name() {
    return this._name;
  }

  async embedPage(targetPage: PDFPage) {
    if (this.embeddedPage) return this.embeddedPage;

    const pages = await targetPage.doc.embedPdf(this.pdf);
    this.embeddedPage = pages[0];
    return pages[0];
  }
}
