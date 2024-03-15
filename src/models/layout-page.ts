import { LayoutPageElement } from '@app/models/layout-page-element';

import type {
  SectionMeta,
  SectionVariantMeta,
} from '@app/models/document-page';
import { Layout } from '@app/models/layout';

export type LayoutPageMeta = SectionMeta | SectionVariantMeta | undefined;

export type LayoutPageOpts = {
  layout: Layout;
  pageIndex: number;
  currentPageNumber: number;
  totalPagesNumber: number;
  headerMeta: LayoutPageMeta;
  footerMeta: LayoutPageMeta;
  backgroundMeta: LayoutPageMeta;
};

/**
 * Represents a single page in a layout
 *
 * This class should exist only if sections (header, footer, background)
 * are defined in this layout and there is a need to create output PDF
 * by placing various elements on the page
 */
export class LayoutPage {
  declare layout: Layout;

  declare pageIndex: number;
  declare currentPageNumber: number;
  declare totalPagesNumber: number;

  declare header: LayoutPageElement | undefined;
  declare footer: LayoutPageElement | undefined;
  declare background: LayoutPageElement | undefined;
  declare body: LayoutPageElement;

  constructor(opts: LayoutPageOpts) {
    this.layout = opts.layout;

    this.pageIndex = opts.pageIndex;
    this.currentPageNumber = opts.currentPageNumber;
    this.totalPagesNumber = opts.totalPagesNumber;

    if (opts.headerMeta) {
      this.header = new LayoutPageElement({
        layoutPage: this,
        ...opts.headerMeta,
      });
    }

    if (opts.footerMeta) {
      this.footer = new LayoutPageElement({
        layoutPage: this,
        ...opts.footerMeta,
      });
    }

    if (opts.backgroundMeta) {
      this.background = new LayoutPageElement({
        layoutPage: this,
        ...opts.backgroundMeta,
      });
    }

    this.body = new LayoutPageElement({
      layoutPage: this,
      sectionHeight: this.layout.bodyHeight,
      sectionType: 'body',
      hasCurrentPageNumber: false,
      hasTotalPagesNumber: false,
    });
  }

  get html() {
    return this.layout.documentPage.html;
  }

  get hasBackgroundElement() {
    return !!this.background;
  }

  get needsProcessing() {
    return (
      (this.header && !this.header.pdfPage) ||
      (this.footer && !this.footer.pdfPage) ||
      (this.background && !this.background.pdfPage)
    );
  }

  get bodyPdf() {
    return this.layout.documentPage.body!.pdf.getPage(this.pageIndex);
  }

  async process() {
    await this.background?.process();
    await this.header?.process();
    await this.footer?.process();
  }
}
