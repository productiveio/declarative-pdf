import { areSectionVariants, selectVariant } from '@app/utils/physical-pages';
import { LayoutPage, type LayoutPageMeta } from '@app/models/layout-page';

import type { DocumentPage } from '@app/models/document-page';

const getMaxHeight = (els: NonNullable<LayoutPageMeta>[]) => {
  return els.reduce((x, s) => Math.max(x, s.sectionHeight), 0);
};

const pickMeta = (
  collection: NonNullable<LayoutPageMeta>[],
  offset: number,
  count: number
): LayoutPageMeta => {
  if (!collection.length) return undefined;

  if (areSectionVariants(collection)) {
    return selectVariant(collection, 0, offset, count);
  }

  if (collection.length > 1) {
    throw new Error('More than one setting for a regular section');
  }

  return collection[0];
};

export class Layout {
  declare documentPage: DocumentPage;

  declare headersMeta: NonNullable<LayoutPageMeta>[];
  declare footersMeta: NonNullable<LayoutPageMeta>[];
  declare backgroundsMeta: NonNullable<LayoutPageMeta>[];

  declare headerHeight: number;
  declare footerHeight: number;
  declare bodyHeight: number;
  declare backgroundHeight: number;
  declare headerY: number;
  declare footerY: number;
  declare bodyY: number;
  declare backgroundY: number;

  declare pages?: LayoutPage[];

  constructor(documentPage: DocumentPage, meta: NonNullable<LayoutPageMeta>[]) {
    this.documentPage = documentPage;
    this.headersMeta = meta.filter((s) => s.sectionType === 'header');
    this.footersMeta = meta.filter((s) => s.sectionType === 'footer');
    this.backgroundsMeta = meta.filter((s) => s.sectionType === 'background');
    this.setHeights();
  }

  get pageHeight() {
    return this.documentPage.height;
  }

  get pageWidth() {
    return this.documentPage.width;
  }

  get needsLayoutPages() {
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
    if (!this.needsLayoutPages) return;

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
        headerMeta: pickMeta(this.headersMeta, offset, count),
        footerMeta: pickMeta(this.footersMeta, offset, count),
        backgroundMeta: pickMeta(this.backgroundsMeta, offset, count),
      });
    });
  }
}
