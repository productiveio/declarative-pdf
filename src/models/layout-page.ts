import { PDFDocument } from 'pdf-lib';
import { isSectionVariantSetting } from '@app/utils/physical-pages';

import type {
  SectionSetting,
  SectionVariantSetting,
} from '@app/models/document-page';
import type { PageElement } from '@app/models/page-element';
import type { Layout } from '@app/models/layout';

export type LayoutPageSetting =
  | SectionSetting
  | SectionVariantSetting
  | undefined;

export type LayoutPageOpts = {
  layout: Layout;
  pageIndex: number;
  currentPageNumber: number;
  totalPagesNumber: number;
  headerSetting: LayoutPageSetting;
  footerSetting: LayoutPageSetting;
  backgroundSetting: LayoutPageSetting;
};

export class LayoutPage {
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

    // TODO: implement this error throwing
    // const count = pdf.getPageCount();
    // if (count !== 1) {
    //   throw new Error(
    //     `While generating ${type} section PDF with ${setting.sectionHeight} height, instead of a single page, we got ${count} instead`
    //   );
    // }

    this[elementName] = this.store.createModel(setting.sectionType, {
      pdf,
      buffer,
    });
  }
}
