import { areSectionVariants, selectVariant } from '@app/utils/physical-pages';
import { LayoutPage, type LayoutPageSetting } from '@app/models/layout-page';

import type {
  DocumentPage,
  SectionSetting,
  SectionVariantSetting,
} from '@app/models/document-page';

const getMaxHeight = (els: (SectionSetting | SectionVariantSetting)[]) => {
  return els.reduce((x, s) => Math.max(x, s.sectionHeight), 0);
};

export class Layout {
  declare documentPage: DocumentPage;
  declare headerSettings: (SectionSetting | SectionVariantSetting)[];
  declare footerSettings: (SectionSetting | SectionVariantSetting)[];
  declare backgroundSettings: (SectionSetting | SectionVariantSetting)[];

  declare headerHeight: number;
  declare footerHeight: number;
  declare bodyHeight: number;
  declare backgroundHeight: number;
  declare headerY: number;
  declare footerY: number;
  declare bodyY: number;
  declare backgroundY: number;

  declare pages?: LayoutPage[];

  constructor(
    documentPage: DocumentPage,
    settings: (SectionSetting | SectionVariantSetting)[]
  ) {
    this.documentPage = documentPage;
    this.headerSettings = settings.filter((s) => s.sectionType === 'header');
    this.footerSettings = settings.filter((s) => s.sectionType === 'footer');
    this.backgroundSettings = settings.filter(
      (s) => s.sectionType === 'background'
    );
    this.setHeights();
  }

  get pageHeight() {
    return this.documentPage.height;
  }

  get pageWidth() {
    return this.documentPage.width;
  }

  get hasConfig() {
    return (
      this.headerSettings.length ||
      this.footerSettings.length ||
      this.backgroundSettings.length
    );
  }

  get hasBackgroundElement() {
    return !!this.backgroundSettings.length;
  }

  get needsProcessing() {
    return (
      !this.pages || this.pages.some((p) => p.hasElements && p.needsProcessing)
    );
  }

  get pagesForProcessing() {
    return this.pages?.filter((p) => p.needsProcessing);
  }

  private setHeights() {
    this.headerHeight = getMaxHeight(this.headerSettings);
    this.footerHeight = getMaxHeight(this.footerSettings);
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

  createLayoutPages() {
    // Do not create layout pages if there are no elements
    if (!this.hasConfig) return;

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

    const total = this.documentPage.owner.totalPagesNumber;
    if (typeof total !== 'number' || total < count) {
      throw new Error(
        'Layout unable to create page, invalid total page number'
      );
    }

    const pickSetting = (
      settings: (SectionSetting | SectionVariantSetting)[]
    ): LayoutPageSetting => {
      if (!settings.length) return undefined;

      if (areSectionVariants(settings)) {
        return selectVariant(settings, 0, offset, count);
      }

      if (settings.length > 1) {
        throw new Error('More than one setting for a regular section');
      }

      return settings[0] as SectionSetting;
    };

    this.pages = Array.from({ length: count }, (_, i) => {
      const headerSetting = pickSetting(this.headerSettings);
      const footerSetting = pickSetting(this.footerSettings);
      const backgroundSetting = pickSetting(this.backgroundSettings);

      return new LayoutPage({
        layout: this,
        pageIndex: i,
        currentPageNumber: i + 1 + offset,
        totalPagesNumber: total,
        headerSetting,
        footerSetting,
        backgroundSetting,
      });
    });

    // ovdje sad znam za svaku stranicu koji header, footer i background treba koristiti
  }
}
