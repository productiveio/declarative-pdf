import { PDFDocument, type PDFPage } from 'pdf-lib';
import type { LayoutPage } from '@app/models/layout-page';

type TPhysicalPageType = 'first' | 'last' | 'even' | 'odd' | 'default';

type LayoutPageElementOpts = {
  layoutPage: LayoutPage;
  sectionHeight: number;
  sectionType: 'header' | 'footer' | 'background' | 'body';
  hasCurrentPageNumber: boolean;
  hasTotalPagesNumber: boolean;
  physicalPageIndex?: number;
  physicalPageType?: TPhysicalPageType;
};

export class LayoutPageElement {
  declare layoutPage: LayoutPage;

  declare private _pdfPage?: PDFPage;

  declare readonly height: number;
  declare readonly type: 'header' | 'footer' | 'background' | 'body';
  declare readonly hasCurrentPageNumber: boolean;
  declare readonly hasTotalPagesNumber: boolean;
  declare readonly physicalPageIndex?: number;
  declare readonly physicalPageType?: TPhysicalPageType;

  constructor(opts: LayoutPageElementOpts) {
    this.layoutPage = opts.layoutPage;
    this.height = opts.sectionHeight;
    this.type = opts.sectionType;
    this.hasCurrentPageNumber = opts.hasCurrentPageNumber;
    this.hasTotalPagesNumber = opts.hasTotalPagesNumber;
    this.physicalPageIndex = opts.physicalPageIndex;
    this.physicalPageType = opts.physicalPageType;

    if (this.type === 'body') {
      const index = this.layoutPage.pageIndex;
      const pdf = this.layoutPage.layout.documentPage.body!.pdf;
      this._pdfPage = pdf.getPage(index);
    }
  }

  get isPhysicalPageVariant() {
    return this.physicalPageIndex !== undefined;
  }

  get isReusable() {
    return !this.hasCurrentPageNumber;
  }

  get html() {
    return this.layoutPage.html;
  }

  get pdfPage() {
    return this._pdfPage;
  }

  get x() {
    return 0;
  }

  get y() {
    return this.layoutPage.layout[`${this.type}Y`];
  }

  get width() {
    return this.layoutPage.layout.documentPage.width;
  }

  get currentPageNumber() {
    return this.hasCurrentPageNumber
      ? this.layoutPage.currentPageNumber
      : undefined;
  }

  get totalPagesNumber() {
    return this.hasTotalPagesNumber
      ? this.layoutPage.totalPagesNumber
      : undefined;
  }

  /**
   * This method will either create PDFPage or connect to existing one.
   * Body is handled separately, because its pdf should already exist.
   */
  async process() {
    const reusableElement = this.findResuableElement();

    if (reusableElement instanceof LayoutPageElement) {
      this._pdfPage = reusableElement._pdfPage;
      return;
    }

    this._pdfPage = await this.renderPDFPage();
  }

  private async renderPDFPage() {
    if (this.type === 'body') return;

    await this.html.prepareSection({
      documentPageIndex: this.layoutPage.layout.documentPage.index,
      sectionType: this.type,
      physicalPageIndex: this.physicalPageIndex,
      currentPageNumber: this.currentPageNumber,
      totalPagesNumber: this.totalPagesNumber,
    });

    const buffer = await this.html.pdf({
      width: this.width,
      height: this.height,
      transparentBg:
        this.layoutPage.hasBackgroundElement && this.type !== 'background',
    });

    const pdfDoc = await PDFDocument.load(buffer);

    // Until we figure out why is this happening, let's just log the error and not throw it
    const count = pdfDoc.getPageCount();
    if (count !== 1) {
      console.error(
        `While generating ${this.type} section PDF with ${this.height} height, instead of a single page, we got ${count} instead`
      );
    }

    return pdfDoc.getPage(0);
  }

  private findResuableElement() {
    if (!this.isReusable) return;

    const matchingPage = this.layoutPage.layout.pages?.find(
      (p) =>
        p[this.type] !== undefined &&
        p[this.type]!.isReusable &&
        p[this.type]!.physicalPageIndex === this.physicalPageIndex &&
        p[this.type]!.physicalPageType === this.physicalPageType &&
        p[this.type]!.pdfPage
    );

    return matchingPage?.[this.type];
  }
}
