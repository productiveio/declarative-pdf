import { PAPER_SIZE } from '@app/consts/paper-size';
import evalDocumentPageSettings from '@app/evaluators/document-page-settings';
import evalPrepareSection from '@app/evaluators/prepare-section';
import evalTemplateNormalize from '@app/evaluators/template-normalize';
import evalTemplateSettings from '@app/evaluators/template-settings';
import evalResetVisibility from '@app/evaluators/reset-visibility';

import type { Browser, Page } from 'puppeteer';

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
    if (!this.browser) throw new Error('Browser not set');
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

  setViewport(opts: { width: number; height: number }) {
    return this.page.setViewport(opts);
  }

  normalize() {
    return this.page.evaluate(evalTemplateNormalize);
  }

  templateSettings(opts: { width: number; height: number; ppi: number }) {
    return this.page.evaluate(evalTemplateSettings, {
      default: opts,
      size: PAPER_SIZE,
    });
  }

  documentPageSettings(opts: { index: number }) {
    return this.page.evaluate(evalDocumentPageSettings, opts.index);
  }

  prepareSection(opts: {
    documentPageIndex: number;
    sectionType?: 'header' | 'footer' | 'background';
    physicalPageIndex?: number;
    currentPageNumber?: number;
    totalPagesNumber?: number;
  }) {
    return this.page.evaluate(evalPrepareSection, opts);
  }

  resetVisibility() {
    return this.page.evaluate(evalResetVisibility);
  }

  pdf(opts: {
    width: number;
    height: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    transparentBg?: boolean;
  }) {
    return this.page.pdf({
      width: opts.width,
      height: opts.height,
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
