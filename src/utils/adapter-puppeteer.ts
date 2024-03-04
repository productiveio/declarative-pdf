import { PAPER_SIZE } from '@app/consts/paper-size';
import evalTemplateNormalize from '@app/evaluators/template-normalize';
import evalTemplateSettings from '@app/evaluators/template-settings';
import evalIsolateSection from '@app/evaluators/isolate-section';
import evalDocumentPageSettings from '@app/evaluators/document-page-settings';

import type { Browser, Page } from 'puppeteer';

export default class HTMLAdapter {
  private declare _browser: Browser;
  private declare _page: Page;

  constructor(browser: Browser) {
    this._browser = browser;
  }

  get browser(): Browser {
    if (!this._browser) throw new Error('Browser not set');
    if (!this._browser.isConnected()) throw new Error('Browser not connected');

    return this._browser;
  }

  get page(): Page {
    if (!this.browser.isConnected()) throw new Error('Browser not connected');
    if (!this._page) throw new Error('Page not set');
    if (this._page.isClosed()) throw new Error('Page is closed');

    return this._page;
  }

  newPage() {
    return this.browser.newPage();
  }

  setContent(content: string) {
    return this.page.setContent(content);
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

  isolate(opts: {
    index: number;
    type?: 'header' | 'footer' | 'background';
    subIndex?: number;
  }) {
    return opts.type
      ? this.page.evaluate(
          evalIsolateSection,
          opts.index,
          opts.type,
          opts.subIndex
        )
      : this.page.evaluate(evalIsolateSection, opts.index);
  }

  pdf(opts: { width: number; height: number; transparentBg?: boolean }) {
    return this.page.pdf({
      width: opts.width,
      height: opts.height,
      omitBackground: opts.transparentBg,
      printBackground: true,
    });
  }

  close() {
    return this.page.close();
  }
}