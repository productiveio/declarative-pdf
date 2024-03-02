import Variant from '../consts/physicalPageVariant';
import type { DocumentPage, ElementSettings } from '../models/document-page';

const getMaxHeight = (els: ElementSettings) => {
  return els.reduce((x, s) => Math.max(x, s.height), 0);
};

class Layout {
  declare documentPage: DocumentPage;
  declare headers: ElementSettings;
  declare footers: ElementSettings;
  declare backgrounds: ElementSettings;

  declare headerHeight: number;
  declare footerHeight: number;
  declare bodyHeight: number;
  declare headerY: number;
  declare footerY: number;
  declare bodyY: number;

  declare pageCount?: number;
  declare layoutPages?: LayoutPage[];

  constructor(documentPage: DocumentPage, settings: ElementSettings) {
    this.documentPage = documentPage;
    this.headers = settings.filter((s) => s.type === 'header');
    this.footers = settings.filter((s) => s.type === 'footer');
    this.backgrounds = settings.filter((s) => s.type === 'background');
    this.processHeights();
  }

  get height() {
    return this.documentPage.height;
  }

  get width() {
    return this.documentPage.width;
  }

  get pageCountOffset() {
    return this.documentPage.pageCountOffset;
  }

  processHeights() {
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

  processPages(count: number) {
    this.pageCount = count;
    const pageCountOffset = this.pageCountOffset;
    if (!pageCountOffset) throw new Error('Page count offset not set');

    this.layoutPages = Array.from({ length: count }, (_, i) => {
      const start = pageCountOffset;
      const end = pageCountOffset + count;
      const layoutPage = new LayoutPage({
        layout: this,
        pageIndex: i,
        pageNumber: i + 1 + pageCountOffset,
        header: selectVariant(this.headers, i, start, end),
        footer: selectVariant(this.footers, i, start, end),
        background: selectVariant(this.backgrounds, i, start, end),
      });

      return layoutPage;
    });
  }
}

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
  end: number
) => {
  if (!variants.length) return;

  const currentInSet = index + 1;
  const currentInDocs = currentInSet + offset;

  const isFirst = currentInSet === 1;
  const isLast = currentInSet === end;
  const isOdd = currentInDocs % 2 === 1;
  const isEven = currentInDocs % 2 === 0;

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

type LayoutPageOpts = {
  layout: Layout;
  pageIndex: number;
  pageNumber: number;
  header?: ElementSettings[number];
  footer?: ElementSettings[number];
  background?: ElementSettings[number];
};

class LayoutPage {
  declare layout: Layout;
  declare pageIndex: number;
  declare pageNumber: number;

  declare header?: ElementSettings[number];
  declare footer?: ElementSettings[number];
  declare background?: ElementSettings[number];

  constructor(opts: LayoutPageOpts) {
    this.layout = opts.layout;
    this.pageIndex = opts.pageIndex;
    this.pageNumber = opts.pageNumber;
    this.header = opts.header;
    this.footer = opts.footer;
    this.background = opts.background;
  }
}

class LayoutElement {
  declare LayoutPage: LayoutPage;
  declare settingsId: number;
  declare type: 'header' | 'footer' | 'background';
  declare subSelector: string;
  declare hasCurrentPageNumber: boolean;
  declare hasTotalPagesNumber: boolean;
}
