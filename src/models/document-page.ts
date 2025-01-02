import { PDFDocument } from 'pdf-lib';
import { BodyElement } from '@app/models/element';
import {
  createPageLayoutSettings,
  type PageLayout,
} from '@app/utils/layout/create-page-layout';

import type DeclarativePDF from '@app/index';
import type { SectionSettings } from '@app/evaluators/section-settings';
import type { SectionElement } from '@app/models/element';

export type DocumentPageOpts = {
  parent: DeclarativePDF;
  /** index of document-page element in DOM */
  index: number;
  /** whole page width in pixels */
  width: number;
  /** whole page height in pixels */
  height: number;
  /** top margin of the page-body element */
  bodyMarginTop: number;
  /** bottom margin of the page-body element */
  bodyMarginBottom: number;
  /** do we have any sections other than page-body */
  hasSections: boolean;
};

export class DocumentPage {
  declare parent: DeclarativePDF;
  declare height: number;
  declare width: number;
  declare index: number;
  declare bodyMarginTop: number;
  declare bodyMarginBottom: number;
  declare hasSections: boolean;

  /** These two will exist after createLayoutAndBody() method */
  declare layout?: PageLayout;
  declare body?: BodyElement;

  sectionElements: SectionElement[] = [];

  constructor(opts: DocumentPageOpts) {
    this.parent = opts.parent;
    this.index = opts.index;
    this.width = opts.width;
    this.height = opts.height;
    this.bodyMarginTop = opts.bodyMarginTop;
    this.bodyMarginBottom = opts.bodyMarginBottom;
    this.hasSections = opts.hasSections;
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
   * This method will figure out heights and positions of
   * all existing elements on this page and create a body
   * element which will, in turn, give us a total page
   * count for this document page.
   *
   * We need to know the number of pages to be able to
   * construct other elements that might need to display
   * current page / total page number.
   */
  async createLayoutAndBody(sectionSettings?: SectionSettings) {
    this.layout = createPageLayoutSettings(
      sectionSettings,
      this.height,
      this.width
    );

    await this.html.prepareSection({ documentPageIndex: this.index });
    const uint8Array = await this.html.pdf({
      width: this.layout.width,
      height: this.layout.body.height,
      margin: {
        top: this.bodyMarginTop,
        bottom: this.bodyMarginBottom,
      },
      transparentBg: this.layout.body.transparentBg,
    });
    const buffer = Buffer.from(uint8Array);
    const pdf = await PDFDocument.load(uint8Array);
    await this.html.resetVisibility();

    this.layout.pageCount = pdf.getPageCount();
    this.body = new BodyElement({ buffer, pdf });
  }

  get hasPageNumbers() {
    return !!this.layout?.hasPageNumbers;
  }

  get isLayoutingNeeded() {
    return this.layout?.hasAnySection;
  }

  get previousDocumentPages() {
    return this.parent.documentPages.slice(0, this.index);
  }

  get pageCount() {
    if (!this.layout?.pageCount) {
      throw new Error(
        `Body generated for document page ${this.index} has no pages`
      );
    }

    return this.layout.pageCount;
  }

  // TODO: push this to layout somehow
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
    // TODO: rename this method - we are processing layout and sections, not document pages
    // this.layout.createLayoutPages();

    // there is nothing to process, so bail out
    // if (!this.layout.needsProcessing) return;

    // process every page that needs processing in sequence
    // for (const page of this.layout.pagesForProcessing) {
    //   await page.process();
    // }
  }
}
