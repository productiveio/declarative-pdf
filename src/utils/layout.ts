import { PDFDocument } from 'pdf-lib';
import Variant from '../consts/physicalPageVariant';
import type { PageElement } from '@app/models/page-element';
import type { DocumentPage, ElementSettings } from '../models/document-page';

const getMaxHeight = (els: ElementSettings) => {
  return els.reduce((x, s) => Math.max(x, s.height), 0);
};

const findVariant = (variants: ElementSettings, condition: Variant) => {
  const res = variants.find((variant) => variant.subSelector === condition);
  if (!res && condition === Variant.DEFAULT) {
    return variants.find((variant) => !variant.subSelector);
  }
  return res;
};

export const selectVariant = (
  variants: ElementSettings,
  index: number,
  offset: number,
  count: number
) => {
  if (!variants.length) return;

  const isFirst = index === 0;
  const isLast = index === count - 1;
  const isOdd = (index + 1 + offset) % 2 === 1;
  const isEven = (index + 1 + offset) % 2 === 0;

  if (isLast) {
    return (
      findVariant(variants, Variant.LAST) ||
      findVariant(variants, isOdd ? Variant.ODD : Variant.EVEN) ||
      findVariant(variants, Variant.DEFAULT)
    );
  }

  if (isFirst) {
    return (
      findVariant(variants, Variant.FIRST) ||
      findVariant(variants, isOdd ? Variant.ODD : Variant.EVEN) ||
      findVariant(variants, Variant.DEFAULT)
    );
  }

  if (isOdd) {
    return (
      findVariant(variants, Variant.ODD) ||
      findVariant(variants, Variant.DEFAULT)
    );
  }

  if (isEven) {
    return (
      findVariant(variants, Variant.EVEN) ||
      findVariant(variants, Variant.DEFAULT)
    );
  }

  return findVariant(variants, Variant.DEFAULT);
};

export class Layout {
  declare documentPage: DocumentPage;
  declare settings: ElementSettings;

  declare headerHeight: number;
  declare footerHeight: number;
  declare bodyHeight: number;
  declare headerY: number;
  declare footerY: number;
  declare bodyY: number;

  declare pages?: LayoutPage[];

  constructor(documentPage: DocumentPage, settings: ElementSettings) {
    this.documentPage = documentPage;
    this.settings = settings;
    this.setHeights();
  }

  get headers() {
    return this.settings.filter((s) => s.type === 'header');
  }

  get footers() {
    return this.settings.filter((s) => s.type === 'footer');
  }

  get backgrounds() {
    return this.settings.filter((s) => s.type === 'background');
  }

  get height() {
    return this.documentPage.height;
  }

  get width() {
    return this.documentPage.width;
  }

  get hasBackgroundElement() {
    return !!this.backgrounds.length;
  }

  get needsProcessing() {
    return !!this.pages?.some((p) => p.hasElements);
  }

  get pagesForProcessing() {
    return this.pages?.filter((p) => p.needsProcessing);
  }

  private setHeights() {
    this.headerHeight = getMaxHeight(this.headers);
    this.footerHeight = getMaxHeight(this.footers);
    this.bodyHeight = this.height - this.headerHeight - this.footerHeight;
    this.headerY = this.height - this.headerHeight;
    this.footerY = 0;
    this.bodyY = this.footerHeight + 1;

    if (this.bodyHeight < this.height / 3) {
      throw new Error(
        `Header/footer too big. Page height: ${this.height}px, header: ${this.headerHeight}px, footer: ${this.footerHeight}px, body: ${this.bodyHeight}px.`
      );
    }
  }

  createLayoutPages() {
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

    this.pages = Array.from({ length: count }, (_, i) => {
      const settings = [
        selectVariant(this.headers, i, offset, count),
        selectVariant(this.footers, i, offset, count),
        selectVariant(this.backgrounds, i, offset, count),
      ].filter((el): el is ElementSettings[number] => !!el);

      return new LayoutPage({
        layout: this,
        pageIndex: i,
        currentPageNumber: i + 1 + offset,
        totalPagesNumber: total,
        settings,
      });
    });

    // ovdje sad znam za svaku stranicu koji header, footer i background treba koristiti
  }

  process() {
    if (!this.pages) {
      throw new Error('Unable to process layout, no pages found');
    }

    const forProcessing = this.pages.filter((p) => p.needsProcessing);

    if (forProcessing.length) {
      // TODO: run process for every page that needs processing
      // this includes: dom isolation, injection of numbers, printing pdf
      // we also need to populate document-page with elements or something
      // or maybe just keep it here, so that it is linked
      // or maybe just do the processing from document-page?
    }
  }

  // async process() {
  //   if (!this.pageCount) throw new Error('Page count not set');
  //   if (!this.pages) throw new Error('Layout pages not set');

  //   for (const page of this.pages) {
  //     if (page.needsSectionProcessing) {
  //       await this.processPage(page);
  //     }
  //   }

  // }
}

type LayoutPageOpts = {
  layout: Layout;
  pageIndex: number;
  currentPageNumber: number;
  totalPagesNumber: number;
  settings: ElementSettings;
};

class LayoutPage {
  declare layout: Layout;
  declare pageIndex: number;

  declare currentPageNumber: number;
  declare totalPagesNumber: number;

  declare settings: ElementSettings;
  declare elements: PageElement[];

  constructor(opts: LayoutPageOpts) {
    this.layout = opts.layout;
    this.pageIndex = opts.pageIndex;
    this.currentPageNumber = opts.currentPageNumber;
    this.totalPagesNumber = opts.totalPagesNumber;
    this.settings = opts.settings;
    this.elements = [];
  }

  get store() {
    return this.layout.documentPage.owner.store;
  }

  get html() {
    return this.layout.documentPage.owner.html;
  }

  get hasElements() {
    return this.settings.length;
  }

  get hasBackgroundElement() {
    return this.settings.some((s) => s.type === 'background');
  }

  get needsProcessing() {
    return this.settings.length !== this.elements.length;
  }

  addElement(element: PageElement) {
    // TODO: check if element is already added
    // check if by adding this element we have too many elements
    this.elements.push(element);
  }

  async process() {
    for (const setting of this.settings) {
      if (this.elements.some((el) => el.type === setting.type)) {
        throw new Error('Trying to process already processed element');
      }

      // check if we can reuse the element and if it is already processed
      if (!setting.hasCurrentPageNumber) {
        const matchingElement = this.layout.pages?.reduce<
          PageElement | undefined
        >((found, page) => {
          if (found) return found;

          const matchingPage = page.settings.find(
            (s) => s.type === setting.type && s.index === setting.index
          );

          return matchingPage
            ? page.elements.find((el) => el.type === setting.type)
            : undefined;
        }, undefined);

        if (matchingElement) {
          this.addElement(matchingElement);
          continue;
        }
      }

      // we either can't reuse the element or it is not processed
      await this.html.prepareSection({
        documentPageIndex: this.layout.documentPage.index,
        sectionType: setting.type,
        physicalPageIndex: setting.index,
        currentPageNumber: setting.hasCurrentPageNumber
          ? this.currentPageNumber
          : undefined,
        totalPagesNumber: setting.hasTotalPagesNumber
          ? this.totalPagesNumber
          : undefined,
      });

      // generate the element
      const buffer = await this.html.pdf({
        width: this.layout.width,
        height: setting.height,
        transparentBg:
          this.hasBackgroundElement && setting.type !== 'background',
      });

      const pdf = await PDFDocument.load(buffer);
      const element = this.store.createModel(setting.type, { pdf, buffer });
      this.addElement(element);
    }
  }
}
