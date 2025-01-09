import {PAPER_SIZE} from '@app/consts/paper-size';
import evalSectionSettings from '@app/evaluators/section-settings';
import evalPrepareSection from '@app/evaluators/prepare-section';
import evalTemplateNormalize from '@app/evaluators/template-normalize';
import evalTemplateSettings from '@app/evaluators/template-settings';
import evalResetVisibility from '@app/evaluators/reset-visibility';

import type {Browser, Page} from 'puppeteer';
import type {PrepareSection} from '@app/evaluators/prepare-section';
import type {NormalizeOptions} from '@app/index';

export type MinimumBrowser = Pick<Browser, 'newPage' | 'connected'>;

export default class HTMLAdapter {
  declare private _browser?: MinimumBrowser;
  declare private _page?: Page;

  constructor(browser: MinimumBrowser) {
    this._browser = browser;
  }

  get browser(): MinimumBrowser {
    if (!this._browser) throw new Error('Browser not set');
    if ('connected' in this._browser) {
      if (!this._browser.connected) throw new Error('Browser not connected');
    } else {
      // @ts-expect-error - handle old puppeteer versions
      if (this._browser.isConnected()) throw new Error('Browser not connected');
    }

    return this._browser;
  }

  get page(): Page {
    if (!this._page) throw new Error('Page not set');
    if (this._page.isClosed()) throw new Error('Page is closed');

    return this._page;
  }

  async newPage() {
    if (this._page) throw new Error('Page already set');

    this._page = await this.browser.newPage();
  }

  setContent(content: string) {
    return this.page.setContent(content, {
      waitUntil: ['load', 'networkidle0'],
    });
  }

  setViewport(opts: {width: number; height: number}) {
    return this.page.setViewport(opts);
  }

  normalize(opts?: NormalizeOptions) {
    return this.page.evaluate(evalTemplateNormalize, opts);
  }

  getTemplateSettings(opts: {width: number; height: number; ppi: number}) {
    return this.page.evaluate(evalTemplateSettings, {
      default: opts,
      size: PAPER_SIZE,
    });
  }

  getSectionSettings(opts: {index: number}) {
    return this.page.evaluate(evalSectionSettings, opts.index);
  }

  prepareSection(opts: PrepareSection) {
    return this.page.evaluate(evalPrepareSection, opts);
  }

  resetVisibility() {
    return this.page.evaluate(evalResetVisibility);
  }

  /**
   * There is some bug in the PDF generation process, where the height and
   * the width of the resulting PDF page get smaller by approximate factor
   * of 0.75. During this process, some rounding issues occur and sometimes,
   * we end up with 2 pages instead of 1. Also, backgrounds sometimes get
   * a narrow white line at the bottom.
   *
   * To mitigate this, we scale up the width and height by 0.75, as well as
   * the scale, to keep the same appearance.
   */
  pdf(opts: {
    width: number;
    height: number;
    margin?: {top?: number; right?: number; bottom?: number; left?: number};
    transparentBg?: boolean;
  }): Promise<Uint8Array> {
    return this.page.pdf({
      width: opts.width / 0.75,
      height: opts.height / 0.75,
      scale: 1 / 0.75,
      margin: opts.margin,
      omitBackground: opts.transparentBg,
      printBackground: true,
    });
  }

  async close() {
    if (this._page && !this._page.isClosed()) {
      await this._page?.close();
    }
  }
}
