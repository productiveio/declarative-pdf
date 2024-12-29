import { selectSection } from '@app/utils/select-section';
import { LayoutPage } from '@app/models/layout-page';

import type { DocumentPage } from '@app/models/document-page';
import type {
  SectionSetting,
  SectionSettings,
} from '@app/evaluators/section-settings';

const getMaxHeight = (els: SectionSetting[]) => {
  return els.reduce((x, s) => Math.max(x, s.height), 0);
};

const pickMeta = (
  ss: SectionSetting[],
  index: number,
  offset: number,
  count: number
): SectionSetting | undefined => {
  if (!ss.length) return undefined;

  if (ss[0].physicalPageIndex !== undefined) {
    return selectSection(ss, index, offset, count);
  }

  return ss[0];
};

export class Layout {
  declare documentPage: DocumentPage;

  declare headersMeta: SectionSetting[];
  declare footersMeta: SectionSetting[];
  declare backgroundsMeta: SectionSetting[];

  declare headerHeight: number;
  declare footerHeight: number;
  declare bodyHeight: number;
  declare backgroundHeight: number;
  declare headerY: number;
  declare footerY: number;
  declare bodyY: number;
  declare backgroundY: number;

  declare pages?: LayoutPage[];

  constructor(documentPage: DocumentPage, ss: SectionSettings) {
    this.documentPage = documentPage;
    this.headersMeta = ss.headers;
    this.footersMeta = ss.footers;
    this.backgroundsMeta = ss.backgrounds;
    this.setHeights();
  }

  get pageHeight() {
    return this.documentPage.height;
  }

  get pageWidth() {
    return this.documentPage.width;
  }

  get hasMeta() {
    return (
      this.headersMeta.length ||
      this.footersMeta.length ||
      this.backgroundsMeta.length
    );
  }

  get hasBackgroundElement() {
    return !!this.pages?.some((p) => p.hasBackgroundElement);
  }

  get needsProcessing() {
    return !!this.pages?.some((p) => p.needsProcessing);
  }

  get pagesForProcessing() {
    return this.pages?.filter((p) => p.needsProcessing) ?? [];
  }

  private setHeights() {
    this.headerHeight = getMaxHeight(this.headersMeta);
    this.footerHeight = getMaxHeight(this.footersMeta);
    this.bodyHeight = this.pageHeight - this.headerHeight - this.footerHeight;
    this.backgroundHeight = this.pageHeight;
    this.headerY = this.pageHeight - this.headerHeight;
    this.footerY = 0;
    this.bodyY = this.footerHeight + 1;
    this.backgroundY = 0;

    if (this.bodyHeight < this.pageHeight / 3) {
      throw new Error(
        `Header/footer too big. Page height: ${this.pageHeight}px, header: ${this.headerHeight}px, footer: ${this.footerHeight}px, body: ${this.bodyHeight}px.`
      );
    }
  }

  /**
   * This method will create layout pages only if there are some elements
   * that must be used to construct a final page (headers, footers, backgrounds)
   *
   * It will throw errors if it is called before the body is printed to pdf
   * because only after that will the page count be available
   */
  createLayoutPages() {
    // Do not create layout pages if there are no elements
    // TODO: simplify this, layout should know if it needs to create pages
    if (!this.documentPage.parent.needsLayouting) return;

    const count = this.documentPage.pageCount;
    if (typeof count !== 'number' || count < 1) {
      throw new Error('Layout unable to create page, invalid page count');
    }

    const offset = this.documentPage.pageCountOffset;
    if (typeof offset !== 'number' || offset < 0) {
      throw new Error(
        'Layout unable to create page, invalid page count offset'
      );
    }

    const total = this.documentPage.totalPagesNumber;
    if (typeof total !== 'number' || total < count) {
      throw new Error(
        'Layout unable to create page, invalid total page number'
      );
    }

    this.pages = Array.from({ length: count }, (_, i) => {
      return new LayoutPage({
        layout: this,
        pageIndex: i,
        currentPageNumber: i + 1 + offset,
        totalPagesNumber: total,
        headerMeta: pickMeta(this.headersMeta, i, offset, count),
        footerMeta: pickMeta(this.footersMeta, i, offset, count),
        backgroundMeta: pickMeta(this.backgroundsMeta, i, offset, count),
      });
    });
  }
}
