import { PAPER_SIZE } from '@app/consts/paper-size';

/** Asserts that obj.format is a valid format */
const hasFormat = (
  obj: PaperOpts | undefined
): obj is { format: keyof typeof PAPER_SIZE } =>
  !!obj &&
  'format' in obj &&
  typeof obj.format === 'string' &&
  Object.keys(PAPER_SIZE).includes(obj.format);

/** Asserts that obj.ppi is a valid ppi (pixels per inch) */
const hasPpi = (obj: PaperOpts | undefined): obj is { ppi: number } =>
  !!obj &&
  'ppi' in obj &&
  typeof obj?.ppi === 'number' &&
  !isNaN(obj.ppi) &&
  obj.ppi > 18 &&
  obj.ppi < 42_000;

/** Asserts that obj.width is a valid width */
const hasWidth = (obj: PaperOpts | undefined): obj is { width: number } =>
  !!obj &&
  'width' in obj &&
  typeof obj?.width === 'number' &&
  !isNaN(obj.width) &&
  obj.width > 1 &&
  obj.width <= 420_000;

/** Asserts that obj.height is a valid height */
const hasHeight = (obj: PaperOpts | undefined): obj is { height: number } =>
  !!obj &&
  'height' in obj &&
  typeof obj?.height === 'number' &&
  !isNaN(obj.height) &&
  obj.height > 1 &&
  obj.height <= 420_000;

/**
 * Converts millimeters to pixels
 *
 * @param mm Millimeter value
 * @param ppi Pixels per inch
 * @returns Pixel value
 */
const convertMmToPx = (mm: number, ppi: number) =>
  Math.round(mm * (ppi / 25.4));

type PaperOpts =
  | {
      ppi?: number;
      format?: keyof typeof PAPER_SIZE;
    }
  | {
      ppi?: number;
      width?: number;
      height?: number;
    };

export const DEFAULT_FORMAT = 'a4';
export const DEFAULT_PPI = 72;
export const DEFAULT_WIDTH = 595;
export const DEFAULT_HEIGHT = 842;

export class PaperDefaults {
  readonly ppi: number;
  readonly format: keyof typeof PAPER_SIZE | undefined;
  readonly width: number;
  readonly height: number;

  constructor(opts?: PaperOpts) {
    this.ppi = hasPpi(opts) ? opts.ppi : DEFAULT_PPI;

    if (hasFormat(opts)) {
      this.format = opts.format;
      this.width = convertMmToPx(PAPER_SIZE[this.format].width, this.ppi);
      this.height = convertMmToPx(PAPER_SIZE[this.format].height, this.ppi);
    } else if (hasWidth(opts) && hasHeight(opts)) {
      this.format = undefined;
      this.width = opts.width;
      this.height = opts.height;
    } else if (hasWidth(opts)) {
      this.format = undefined;
      this.width = opts.width;
      this.height = DEFAULT_HEIGHT;
    } else if (hasHeight(opts)) {
      this.format = undefined;
      this.width = DEFAULT_WIDTH;
      this.height = opts.height;
    } else {
      this.format = DEFAULT_FORMAT;
      this.width = DEFAULT_WIDTH;
      this.height = DEFAULT_HEIGHT;
    }
  }
}
