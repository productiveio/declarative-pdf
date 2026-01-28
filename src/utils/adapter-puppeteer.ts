import {PAPER_SIZE} from '@app/consts/paper-size';
import evalSectionSettings from '@app/evaluators/section-settings';
import evalPrepareSection from '@app/evaluators/prepare-section';
import evalTemplateNormalize from '@app/evaluators/template-normalize';
import evalTemplateSettings from '@app/evaluators/template-settings';
import evalResetVisibility from '@app/evaluators/reset-visibility';

import type {Browser, Page, HTTPRequest, HTTPResponse} from 'puppeteer';
import type {PrepareSection} from '@app/evaluators/prepare-section';
import type {NormalizeOptions} from '@app/index';

type AnyFunction = (...args: any[]) => any;
export type MinimumBrowser = {
  newPage: AnyFunction;
  isConnected?: AnyFunction;
  connected?: boolean;
};
export type MinimumPage = {
  setContent: AnyFunction;
  setViewport: AnyFunction;
  evaluate: AnyFunction;
  pdf: AnyFunction;
  close: AnyFunction;
  isClosed: AnyFunction;
  on?: AnyFunction;
  off?: AnyFunction;
};

interface TrackedRequest {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  status?: 'pending' | 'completed' | 'failed';
  statusCode?: number;
  failureReason?: string;
}

function formatNetworkReport(requests: Map<string, TrackedRequest>): string {
  const pending: TrackedRequest[] = [];
  const completed: TrackedRequest[] = [];
  const failed: TrackedRequest[] = [];
  const now = Date.now();

  for (const req of requests.values()) {
    if (req.status === 'pending') pending.push(req);
    else if (req.status === 'completed') completed.push(req);
    else if (req.status === 'failed') failed.push(req);
  }

  const lines: string[] = ['', '=== Network Request Report ===', ''];

  if (pending.length > 0) {
    lines.push(`PENDING REQUESTS (${pending.length}):`);
    for (const req of pending) {
      const elapsed = now - req.startTime;
      lines.push(`  - [${req.method}] ${req.url} (waiting ${elapsed}ms)`);
    }
    lines.push('');
  }

  if (failed.length > 0) {
    lines.push(`FAILED REQUESTS (${failed.length}):`);
    for (const req of failed) {
      lines.push(`  - [${req.method}] ${req.url} - ${req.failureReason || 'unknown error'}`);
    }
    lines.push('');
  }

  if (completed.length > 0) {
    lines.push(`COMPLETED REQUESTS (${completed.length}):`);
    for (const req of completed) {
      const duration = (req.endTime || now) - req.startTime;
      lines.push(`  - [${req.method}] ${req.url} (${duration}ms, status: ${req.statusCode})`);
    }
    lines.push('');
  }

  lines.push('=== End Report ===', '');
  return lines.join('\n');
}

export default class HTMLAdapter {
  declare private _browser?: MinimumBrowser;
  declare private _page?: MinimumPage;

  constructor(browser: MinimumBrowser) {
    this._browser = browser;
  }

  get browser(): Browser {
    if (!this._browser) throw new Error('Browser not set');
    if ('connected' in this._browser) {
      if (!this._browser.connected) throw new Error('Browser not connected');
    } else {
      if (!this._browser?.isConnected?.()) throw new Error('Browser not connected');
    }

    return this._browser as Browser;
  }

  get page(): Page {
    if (!this._page) throw new Error('Page not set');
    if (this._page.isClosed()) throw new Error('Page is closed');

    return this._page as Page;
  }

  async newPage() {
    if (this._page) throw new Error('Page already set');

    this._page = await this.browser.newPage();
  }

  setPage(page: MinimumPage) {
    if (this._page) throw new Error('Page already set');

    this._page = page;
  }

  releasePage() {
    this._page = undefined;
  }

  async setContent(content: string) {
    const page = this.page;

    // Only track requests if the page supports event listeners
    if (!page.on || !page.off) {
      return page.setContent(content, {
        waitUntil: ['load', 'networkidle0'],
      });
    }

    const requests = new Map<string, TrackedRequest>();

    const onRequest = (request: HTTPRequest) => {
      const id = `${request.method()}-${request.url()}`;
      requests.set(id, {
        url: request.url(),
        method: request.method(),
        startTime: Date.now(),
        status: 'pending',
      });
    };

    const onResponse = (response: HTTPResponse) => {
      const request = response.request();
      const id = `${request.method()}-${request.url()}`;
      const tracked = requests.get(id);
      if (tracked) {
        tracked.status = 'completed';
        tracked.endTime = Date.now();
        tracked.statusCode = response.status();
      }
    };

    const onRequestFailed = (request: HTTPRequest) => {
      const id = `${request.method()}-${request.url()}`;
      const tracked = requests.get(id);
      if (tracked) {
        tracked.status = 'failed';
        tracked.endTime = Date.now();
        tracked.failureReason = request.failure()?.errorText || 'unknown';
      }
    };

    page.on('request', onRequest);
    page.on('response', onResponse);
    page.on('requestfailed', onRequestFailed);

    try {
      await page.setContent(content, {
        waitUntil: ['load', 'networkidle0'],
      });
    } catch (error) {
      const report = formatNetworkReport(requests);
      console.error('setContent failed with error:', (error as Error).message);
      console.error(report);

      // Enhance error message with summary
      const pending = [...requests.values()].filter((r) => r.status === 'pending');
      const failed = [...requests.values()].filter((r) => r.status === 'failed');

      const enhancedMessage = [
        (error as Error).message,
        `Network: ${pending.length} pending, ${failed.length} failed`,
        pending.length > 0 ? `Pending: ${pending.map((r) => r.url).join(', ')}` : '',
        failed.length > 0 ? `Failed: ${failed.map((r) => `${r.url} (${r.failureReason})`).join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const enhancedError = new Error(enhancedMessage);
      enhancedError.name = (error as Error).name;
      enhancedError.stack = (error as Error).stack;
      throw enhancedError;
    } finally {
      page.off('request', onRequest);
      page.off('response', onResponse);
      page.off('requestfailed', onRequestFailed);
    }
  }

  setViewport(opts: {width: number; height: number}) {
    return this.page.setViewport(opts);
  }

  normalize(opts?: NormalizeOptions) {
    return this.page.evaluate(evalTemplateNormalize, opts);
  }

  async getTemplateSettings(opts: {width: number; height: number; ppi: number}) {
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
      this._page = undefined;
    }
  }
}
