import { PDFDocument } from 'pdf-lib';
import {
  areSectionVariants,
  selectVariant,
  isSectionVariantSetting,
} from '@app/utils/physical-pages';

import type { PageElement } from '@app/models/page-element';
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
    if (!count || count < 1) {
      throw new Error('Layout unable to create page, invalid page count');
    }

    const offset = this.documentPage.pageCountOffset;
    if (!offset || offset < 0) {
      throw new Error(
        'Layout unable to create page, invalid page count offset'
      );
    }

    const total = this.documentPage.owner.totalPagesNumber;
    if (!total || total < count) {
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

type LayoutPageSetting = SectionSetting | SectionVariantSetting | undefined;

type LayoutPageOpts = {
  layout: Layout;
  pageIndex: number;
  currentPageNumber: number;
  totalPagesNumber: number;
  headerSetting: LayoutPageSetting;
  footerSetting: LayoutPageSetting;
  backgroundSetting: LayoutPageSetting;
};

class LayoutPage {
  declare layout: Layout;
  declare pageIndex: number;

  declare currentPageNumber: number;
  declare totalPagesNumber: number;

  declare headerSetting: LayoutPageSetting;
  declare headerElement?: PageElement | undefined;

  declare footerSetting: LayoutPageSetting;
  declare footerElement?: PageElement | undefined;

  declare backgroundSetting: LayoutPageSetting;
  declare backgroundElement?: PageElement | undefined;

  constructor(opts: LayoutPageOpts) {
    this.layout = opts.layout;

    this.pageIndex = opts.pageIndex;
    this.currentPageNumber = opts.currentPageNumber;
    this.totalPagesNumber = opts.totalPagesNumber;

    this.headerSetting = opts.headerSetting;
    this.footerSetting = opts.footerSetting;
    this.backgroundSetting = opts.backgroundSetting;
  }

  get store() {
    return this.layout.documentPage.owner.store;
  }

  get html() {
    return this.layout.documentPage.owner.html;
  }

  get hasElements() {
    return !!(
      this.headerSetting ||
      this.footerSetting ||
      this.backgroundSetting
    );
  }

  get hasBackgroundElement() {
    return !!this.backgroundSetting;
  }

  get needsProcessing() {
    return (
      (this.headerSetting && !this.headerElement) ||
      (this.footerSetting && !this.footerElement) ||
      (this.backgroundSetting && !this.backgroundElement)
    );
  }

  get bodyPdf() {
    return this.layout.documentPage.body!.pdf.getPage(this.pageIndex);
  }

  async process() {
    if (this.hasElements) {
      await this.processElement('header');
      await this.processElement('footer');
      await this.processElement('background');
    }
  }

  private async processElement(type: 'header' | 'footer' | 'background') {
    const settingName = `${type}Setting` as const;
    const elementName = `${type}Element` as const;

    const setting = this[settingName];
    if (!setting) return;

    if (this[elementName]) {
      throw new Error('Trying to process already processed element');
    }

    const isReusable = !!setting.hasCurrentPageNumber;
    const isVariant = isSectionVariantSetting(setting);

    let matchingPage: LayoutPage | undefined;
    if (isReusable && !isVariant) {
      // for regular sections, match only by type
      matchingPage = this.layout.pages!.find(
        (page) => !page.needsProcessing && page[elementName]
      );
    } else if (isReusable && isVariant) {
      // for variant sections, match by type and physical page index
      matchingPage = this.layout.pages!.find((page) => {
        if (page.needsProcessing) return false;

        const targetSetting = page[settingName];
        if (!isSectionVariantSetting(targetSetting)) return false;

        return targetSetting.physicalPageIndex === setting.physicalPageIndex;
      });
    }

    if (matchingPage) {
      this[elementName] = matchingPage[elementName];
      return;
    }

    // we can't reuse any existing element, so we need to create a new one
    await this.html.prepareSection({
      documentPageIndex: this.layout.documentPage.index,
      sectionType: setting.sectionType,
      physicalPageIndex:
        'physicalPageIndex' in setting ? setting.physicalPageIndex : undefined,
      currentPageNumber: setting.hasCurrentPageNumber
        ? this.currentPageNumber
        : undefined,
      totalPagesNumber: setting.hasTotalPagesNumber
        ? this.totalPagesNumber
        : undefined,
    });

    const buffer = await this.html.pdf({
      width: this.layout.pageWidth,
      height: setting.sectionHeight,
      transparentBg:
        this.hasBackgroundElement && setting.sectionType !== 'background',
    });
    const pdf = await PDFDocument.load(buffer);

    this[elementName] = this.store.createModel(setting.sectionType, {
      pdf,
      buffer,
    });
  }
}
