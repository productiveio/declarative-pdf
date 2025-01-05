import type {PAPER_SIZE} from '@app/consts/paper-size';

type TemplateSettingOpts = {
  default: {
    width: number;
    height: number;
    ppi: number;
  };
  size: typeof PAPER_SIZE;
};

export default function evalTemplateSettings(opts: TemplateSettingOpts) {
  /**
   * Guards a string to be a valid format
   * @param format A format name: 'a4' or 'letter'
   * @returns true if format is a valid format
   */
  const isFormat = (format: unknown): format is keyof typeof opts.size =>
    typeof format === 'string' && Object.keys(opts.size).includes(format);

  /**
   * Converts millimeters to pixels
   * @param mm Millimeter value
   * @param ppi Pixels per inch
   * @returns Pixel value
   */
  const convertMmToPx = (mm: number, ppi: number) => Math.round(mm * (ppi / 25.4));

  /**
   * Gets width and height from a size string
   * @param str A size string: '300' or '300x600'
   * @returns Two numbers or two undefines if nothing valid found
   */
  const getWxH = (str: string) => {
    const guard = (x: number) => (x && !isNaN(x) ? x : undefined);
    const [w, h] = str.split('x').map((x) => guard(Number(x)));
    return [w, h ?? w];
  };

  /**
   * Gets settings for a document-page element (width, height, index)
   * @param docPageEl a document-page element
   * @param index location of the document-page element in the DOM
   * @returns settings for the document-page element
   */
  const getPageSettings = (docPageEl: HTMLElement, index: number) => {
    const attrFormat = docPageEl.getAttribute('format');
    const attrPpi = Number(docPageEl.getAttribute('ppi'));
    const attrSize = docPageEl.getAttribute('size');
    const [attrWidth, attrHeight] = attrSize ? getWxH(attrSize) : [];

    const ppi = attrPpi && attrPpi > 0 ? attrPpi : opts.default.ppi;

    const hasSections = !!docPageEl.querySelector('page-header, page-footer, page-background');

    let bodyMarginBottom = 0;
    let bodyMarginTop = 0;

    const pageBodyEl = docPageEl.querySelector('page-body');
    if (pageBodyEl) {
      const pageBodyStyle = window.getComputedStyle(pageBodyEl);
      const marginTop = parseFloat(pageBodyStyle.marginTop);
      const marginBottom = parseFloat(pageBodyStyle.marginBottom);
      // empty string will be parsed to NaN
      bodyMarginTop = isNaN(marginTop) ? 0 : Math.ceil(marginTop);
      bodyMarginBottom = isNaN(marginBottom) ? 0 : Math.ceil(marginBottom);
    }

    let width, height;

    if (isFormat(attrFormat)) {
      const size = opts.size[attrFormat];
      width = convertMmToPx(size.width, ppi);
      height = convertMmToPx(size.height, ppi);
    } else if (attrWidth && attrHeight) {
      width = attrWidth;
      height = attrHeight;
    } else {
      width = opts.default.width;
      height = opts.default.height;
    }

    return {
      index,
      width,
      height,
      bodyMarginTop,
      bodyMarginBottom,
      hasSections,
    };
  };

  const docPageEls = Array.from(document.querySelectorAll<HTMLElement>('document-page'));

  return docPageEls.map(getPageSettings);
}
