import { PAPER_SIZE } from '@app/consts/paper-size';

/**
 * Asserts that a string is a valid format
 *
 * @param format A format name: 'a4' or 'letter'
 * @returns true if format is a valid format
 */
const isFormat = (format: unknown): format is keyof typeof PAPER_SIZE =>
  typeof format === 'string' && Object.keys(PAPER_SIZE).includes(format);

/**
 * Asserts that a number is a valid ppi (pixels per inch)
 *
 * @param ppi a valid number
 * @returns true if ppi is a valid number
 */
const isPpi = (ppi: unknown): ppi is number =>
  typeof ppi === 'number' && !isNaN(ppi) && ppi > 42 && ppi < 1642;

/**
 * Converts millimeters to pixels
 *
 * @param mm Millimeter value
 * @param ppi Pixels per inch
 * @returns Pixel value
 */
const convertMmToPx = (mm: number, ppi: number) =>
  Math.round(mm * (ppi / 25.4));

type PaperOpts = {
  ppi?: number;
  format?: keyof typeof PAPER_SIZE;
  width?: number;
  height?: number;
};

export const DEFAULT_FORMAT = 'a4';
export const DEFAULT_PPI = 72;
export const DEFAULT_WIDTH = 595;
export const DEFAULT_HEIGHT = 842;

export class PaperDefaults {
  readonly ppi: NonNullable<PaperOpts['ppi']>;
  readonly format: PaperOpts['format'];
  readonly width: NonNullable<PaperOpts['width']>;
  readonly height: NonNullable<PaperOpts['height']>;

  constructor(opts?: PaperOpts) {
    this.ppi = isPpi(opts?.ppi) ? opts.ppi : DEFAULT_PPI;

    if (isFormat(opts?.format)) {
      this.format = opts.format;
      this.width = convertMmToPx(PAPER_SIZE[this.format].width, this.ppi);
      this.height = convertMmToPx(PAPER_SIZE[this.format].height, this.ppi);
    } else if (opts?.width && opts?.height) {
      this.format = undefined;
      this.width = opts.width;
      this.height = opts.height;
    } else if (opts?.width || opts?.height) {
      this.format = undefined;
      this.width = opts?.width ?? DEFAULT_WIDTH;
      this.height = opts?.height ?? DEFAULT_HEIGHT;
    } else {
      this.format = DEFAULT_FORMAT;
      this.width = DEFAULT_WIDTH;
      this.height = DEFAULT_HEIGHT;
    }
  }
}
