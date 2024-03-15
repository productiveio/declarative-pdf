import type { LayoutPage } from '@app/models/layout-page';
import { PDFDocument, type PDFPage } from 'pdf-lib';

type LayoutPageElementOpts = {
  layoutPage: LayoutPage;
  sectionHeight: number;
  sectionType: 'header' | 'footer' | 'background' | 'body';
  hasCurrentPageNumber: boolean;
  hasTotalPagesNumber: boolean;
  physicalPageIndex?: number;
};

export class LayoutPageElement {
  declare layoutPage: LayoutPage;

  private declare _pdfPage?: PDFPage;

  declare readonly height: number;
  declare readonly type: 'header' | 'footer' | 'background' | 'body';
  declare readonly hasCurrentPageNumber: boolean;
  declare readonly hasTotalPagesNumber: boolean;
  declare readonly physicalPageIndex?: number;

  constructor(opts: LayoutPageElementOpts) {
    this.layoutPage = opts.layoutPage;
    this.height = opts.sectionHeight;
    this.type = opts.sectionType;
    this.hasCurrentPageNumber = opts.hasCurrentPageNumber;
    this.hasTotalPagesNumber = opts.hasTotalPagesNumber;
    this.physicalPageIndex = opts.physicalPageIndex;

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

    /**
     * There is some bug in the PDF generation process, where the height and
     * the width of the resulting PDF page get smaller by approximate factor
     * of 0.75. During this process, some rounding issues occur and we end
     * up with 2 pages instead of 1. To mitigate this, we add 1 to the height
     * for the elements that are expected to have only 1 page.
     */
    const buffer = await this.html.pdf({
      width: this.width,
      height: this.height + (this.type === 'background' ? 0 : 1),
      transparentBg:
        this.layoutPage.hasBackgroundElement && this.type !== 'background',
    });

    const pdfDoc = await PDFDocument.load(buffer);

    const count = pdfDoc.getPageCount();

    if (count !== 1 && this.type !== 'background') {
      throw new Error(
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
        p[this.type]!.pdfPage
    );

    return matchingPage?.[this.type];
  }
}
