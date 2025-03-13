import {PDFDocument} from 'pdf-lib';
import {BodyElement} from '@app/models/element';
import {createPageLayoutSettings} from '@app/utils/layout/create-page-layout-settings';

import type TimeLogger from '@app/utils/debug/time-logger';
import type DeclarativePDF from '@app/index';
import type {SectionSettings} from '@app/evaluators/section-settings';
import type {SectionElement} from '@app/models/element';
import type {PageLayout} from '@app/utils/layout/create-page-layout-settings';

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
  async createLayoutAndBody(sectionSettings?: SectionSettings, logger?: TimeLogger) {
    this.layout = createPageLayoutSettings(sectionSettings, this.height, this.width);

    await this.html.prepareSection({documentPageIndex: this.index});

    logger?.level3().start('[5.3.1] Print body to pdf buffer');
    const uint8Array = await this.html.pdf({
      width: this.layout.width,
      height: this.layout.body.height,
      margin: {
        top: this.bodyMarginTop,
        bottom: this.bodyMarginBottom,
      },
      transparentBg: this.layout.body.transparentBg,
    });
    logger?.level3().end();

    const buffer = Buffer.from(uint8Array);

    logger?.level3().start('[5.3.2] Load body pdf as PDFDocument');
    const pdf = await PDFDocument.load(uint8Array);
    logger?.level3().end();

    await this.html.resetVisibility();

    this.layout.pageCount = pdf.getPageCount();
    this.body = new BodyElement({
      buffer,
      pdf,
      layout: this.layout.body,
    });
  }

  get previousDocumentPages() {
    return this.parent.documentPages.slice(0, this.index);
  }

  get pageCountOffset() {
    return this.previousDocumentPages.reduce((acc, doc) => acc + doc.layout!.pageCount, 0);
  }
}
