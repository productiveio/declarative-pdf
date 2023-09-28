import physicalPageVariant from './consts/physicalPageVariant.js';

// deprecated
export enum sectionType {
  FIRST = 'first',
  LAST = 'last',
  EVEN = 'even',
  ODD = 'odd',
  DEFAULT = 'default'
}

// Paper size for known formats in millimeters
const paper = {
  size: {
    a0: { width: 841, height: 1189 },
    a1: { width: 594, height: 841 },
    a2: { width: 420, height: 594 },
    a3: { width: 297, height: 420 },
    a4: { width: 210, height: 297 },
    a5: { width: 148, height: 210 },
    a6: { width: 105, height: 148 },
    letter: { width: 216, height: 279 },
    legal: { width: 216, height: 356 },
    tabloid: { width: 279, height: 432 },
    ledger: { width: 432, height: 279 },
  },
  default: {
    ppi: 72, // some common ppi are: 72, 96, 150, 300, etc...
    format: 'a4',
    width: 595,
    height: 842,
  },
  util: {
    /**
     * Converts millimeters to pixels
     * @param mm Millimeter value
     * @param ppi Pixels per inch
     * @returns Pixel value
     */
    convertMmToPx(mm: number, ppi: number) {
      const INCH_TO_MM_RATIO = 25.4;
      return Math.round(mm * (ppi / INCH_TO_MM_RATIO));
    },
    /**
     * Gets width and height from a size string
     * @param str A size string: '300' or '300x600'
     * @returns Two numbers or two undefines if nothing valid found
     */
    getWxH(str: string) {
      const guard = (x: number) => x && !isNaN(x) ? x : undefined;
      const [w, h] = str.split('x').map((x) => guard(Number(x)));
      return [w, h ?? w];
    },
    /**
     * Calculates which section type should be used for pageNumber, given available types
     * @param pageNumber current page number
     * @param totalPages total number of pages
     * @param availableVariants array of section types (first, last, even, odd, default)
     * @returns section type (first, last, even, odd, default)
     */
    getSectionType(pageNumber: number, totalPages: number, availableVariants: sectionType[]) {
      const isFirst = pageNumber === 1;
      const isLast = pageNumber === totalPages;
      const isOdd = Boolean(pageNumber % 2);
      const isEven = !isOdd;
      const lastPageType = isOdd ? sectionType.ODD : sectionType.EVEN;
      const hasFirstType = availableVariants.includes(sectionType.FIRST);
      const hasLastType = availableVariants.includes(sectionType.LAST);
      const hasLastEvenOddType = availableVariants.includes(lastPageType);
      const hasOddType = availableVariants.includes(sectionType.ODD);
      const hasEvenType = availableVariants.includes(sectionType.EVEN);

      if (isFirst && (hasFirstType || hasOddType)) {
        return hasFirstType ? sectionType.FIRST : sectionType.ODD;
      } else if (isLast && (hasLastType || hasLastEvenOddType)) {
        return hasLastType ? sectionType.LAST : lastPageType;
      } else if (isOdd && hasOddType) {
        return sectionType.ODD;
      } else if (isEven && hasEvenType) {
        return sectionType.EVEN;
      }

      return sectionType.DEFAULT;
    }
  },
  sectionType, // deprecated
  physicalPageVariant,
} as const;

const debug = true;
const browser = {
  pipe: true,
  headless: !debug,
  devtools: debug,
  slowMo: 250,
  args: [
    '--no-sandbox',
    '--disable-web-security',
    // '--disable-font-subpixel-positioning',
    '--font-render-hinting=none'
  ]
}

// Viewport and puppeteer tab settings
const page = {
  width: paper.util.convertMmToPx(paper.size[paper.default.format].width, paper.default.ppi),
  height: paper.util.convertMmToPx(paper.size[paper.default.format].height, paper.default.ppi),
  deviceScaleFactor: 1,
  defaultNavigationTimeout: 10000, // takes priority over defaultTimeout
  defaultTimeout: 4000, // for general stuff like waitForSelector
  allowedRequestExtensions: ['png', 'jpg', 'jpeg', 'svg', 'ttf', 'woff', 'woff2', 'otf']
} as const;

export const config = {
  paper,
  browser,
  page,
}
