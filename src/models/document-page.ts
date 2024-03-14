import { PDFDocument } from 'pdf-lib';
import { Layout } from '@app/models/layout';

import type DeclarativePDF from '@app/index';

type DocumentPageOpts = {
  parent: DeclarativePDF;
  /** index of document-page element in DOM */
  index: number;
  /** whole page width in pixels */
  width: number;
  /** whole page height in pixels */
  height: number;
};

export type SectionMeta = {
  sectionHeight: number;
  sectionType: 'header' | 'footer' | 'background';
  hasCurrentPageNumber: boolean;
  hasTotalPagesNumber: boolean;
};

export type SectionVariantMeta = {
  physicalPageIndex: number;
  physicalPageType: 'first' | 'last' | 'even' | 'odd' | 'default';
} & SectionMeta;

export class DocumentPage {
  declare parent: DeclarativePDF;
  declare height: number;
  declare width: number;
  declare index: number;

  declare layout?: Layout;
  declare body?: { buffer: Buffer; pdf: PDFDocument };

  constructor(opts: DocumentPageOpts) {
    this.parent = opts.parent;
    this.index = opts.index;
    this.width = opts.width;
    this.height = opts.height;
  }

  get viewPort() {
    return {
      width: this.width,
      height: this.height,
    };
  }

  get html() {
    return this.parent.html;
  }

  /**
   * Create the layout and body element.
   *
   * This method creates the body PDF and sets the number
   * of pages for this document-page.
   *
   * At this point, layout knows only of heights and what
   * page elements exist. To finish the layouting, we need
   * number of pages for this doc and total number of pages
   * across all documentPage models
   */
  async createLayoutAndBody(meta: (SectionMeta | SectionVariantMeta)[]) {
    this.layout = new Layout(this, meta);

    await this.html.prepareSection({ documentPageIndex: this.index });
    const buffer = await this.html.pdf({
      width: this.width,
      height: this.layout.bodyHeight,
      transparentBg: this.layout.hasBackgroundElement,
    });
    const pdf = await PDFDocument.load(buffer);
    await this.html.resetVisibility();

    this.body = { pdf, buffer };
  }

  get previousDocumentPages() {
    return this.parent.documentPages.slice(0, this.index);
  }

  get pageCount() {
    const count = this.body!.pdf.getPageCount();

    if (count < 1) {
      throw new Error(
        `Body generated for document page ${this.index} has no pages`
      );
    }

    return count;
  }

  get pageCountOffset() {
    const offset = this.previousDocumentPages.reduce(
      (acc, doc) => acc + doc.pageCount,
      0
    );

    if (offset < this.previousDocumentPages.length) {
      throw new Error(
        'Page count offset is less than number of document pages'
      );
    }

    return offset;
  }

  get totalPagesNumber() {
    return this.parent.totalPagesNumber;
  }

  async process() {
    if (!this.layout) throw new Error('Layout is not initialized');
    this.layout.createLayoutPages();

    // there is nothing to process, so bail out
    if (!this.layout.needsProcessing) return;

    // process every page that needs processing in sequence
    for (const page of this.layout.pagesForProcessing) {
      await page.process();
    }
  }
}
