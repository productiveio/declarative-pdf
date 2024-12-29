import { LayoutPageElement } from '@app/models/layout-page-element';

import { Layout } from '@app/models/layout';
import type { SectionSetting } from '@app/evaluators/section-settings';

export type LayoutPageOpts = {
  layout: Layout;
  pageIndex: number;
  currentPageNumber: number;
  totalPagesNumber: number;
  headerSettings: SectionSetting | undefined;
  footerSettings: SectionSetting | undefined;
  backgroundSettings: SectionSetting | undefined;
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

    if (opts.headerSettings) {
      this.header = new LayoutPageElement({
        layoutPage: this,
        type: 'header',
        ...opts.headerSettings,
      });
    }

    if (opts.footerSettings) {
      this.footer = new LayoutPageElement({
        layoutPage: this,
        type: 'footer',
        ...opts.footerSettings,
      });
    }

    if (opts.backgroundSettings) {
      this.background = new LayoutPageElement({
        layoutPage: this,
        type: 'background',
        ...opts.backgroundSettings,
      });
    }

    this.body = new LayoutPageElement({
      layoutPage: this,
      height: this.layout.bodyHeight,
      type: 'body',
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
