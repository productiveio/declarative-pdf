import {PDFDocument} from 'pdf-lib';
import {config, sectionType} from './config.js';
import {
  evalNormalizeHtmlBody,
  evalGetDocumentPageSettings,
  evalGetSectionSettings,
  evalShowOnlyPageWithSection,
  evalInjectTotalPageCount,
  evalInjectCurrentPageNumber,
} from './evaluators/index.js';
import determineActivePhysicalPage from './utils/determineActivePhysicalPage.js';
import writeBuffer from './utils/writeBuffer.js';

import type {Page, Browser} from 'puppeteer';
import type {
  IDocumentPagePhase1,
  IDocumentPagePhase2,
  IDocumentPagePhase3,
  ISectionPartial,
} from './types/index.js';

interface IBrowserPageOpts {
  browser: Browser
  debug: boolean
  debugFilename: string
  height?: number
  width?: number
  scale?: number
  defaultTimeout?: number
}

interface IViewport {
  width: number
  height: number
  deviceScaleFactor: number
}

export class BrowserPage {
  declare page: Page;
  declare browser: Browser;
  declare width: number;
  declare height: number;
  declare deviceScaleFactor: number;
  declare defaultTimeout: number;
  declare debug: boolean;
  declare debugFilename: string;

  constructor(opts: IBrowserPageOpts) {
    this.browser = opts.browser;
    this.debug = opts.debug;
    this.debugFilename = opts.debugFilename;
    this.width = opts.width ?? config.page.width;
    this.height = opts.height ?? config.page.height;
    this.deviceScaleFactor = opts.scale ?? config.page.deviceScaleFactor;
    this.defaultTimeout = opts.defaultTimeout ?? config.page.defaultTimeout;
  }

  log(str: string) {
    if (this.debug) {
      const date = new Date();
      console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] ${str}`);
    }
  }

  async init() {
    this.page = await this.browser.newPage();

    // await page.setOfflineMode(true);
    await this.page.emulateMediaType('screen');
    await this.page.setViewport({
      width: this.width,
      height: this.height,
      deviceScaleFactor: this.deviceScaleFactor,
    });
    await this.page.setJavaScriptEnabled(true);
    await this.page.setRequestInterception(true);
    this.page.setDefaultNavigationTimeout(config.page.defaultNavigationTimeout);
    this.page.setDefaultTimeout(config.page.defaultTimeout);

    // this.page.on('dialog', () => this.log('page.on dialog'));
    // this.page.on('error', () => this.log('page.on error'));
    // this.page.on('frameattached', () => this.log('page.on frameattached'));
    // this.page.on('framedetached', () => this.log('page.on framedetached'));
    // this.page.on('framenavigated', () => this.log('page.on framenavigated'));
    // this.page.on('pageerror', () => this.log('page.on pageerror'));
    // this.page.on('popup', () => this.log('page.on popup'));

    // this.page.on('requestfailed', (req) => {
    //   this.log(`page.request failed for ${req.url()}`);
    // });

    // this.page.on('requestfinished', (req) => {
    //   this.log(`page.request finished: ${req.url()}`);
    // });

    // this.page.on('response', (res) => {
    //   this.log(`page.response: ${res.url()}`);
    // });

    this.page.on('request', (req) => {
      // this.log(`page.request: ${}req.url()`);

      if (config.page.allowedRequestExtensions.some((ex) => req.url().toLowerCase().includes(`.${ex}`))) {
        req.continue()
      } else {
        this.log(`Aborting not allowed request: ${req.url()}`);
        req.abort();
      }
    });
  }

  close() {
    return this.page.close();
  }

  setContent(html: string) {
    this.log('Setting HTML content');
    return this.page.setContent(html, {waitUntil: 'load'});
  }

  normalize() {
    this.log('Normalizing HTML body');
    return this.page.evaluate(evalNormalizeHtmlBody);
  }

  setViewport(viewport: IViewport) {
    this.width = viewport.width;
    this.height = viewport.height;
    this.deviceScaleFactor = viewport.deviceScaleFactor;
    return this.page.setViewport(viewport);
  }

  async getDocumentPages() {
    this.log('Collecting document pages and their settings');
    const docs1: IDocumentPagePhase1[] = await this.page.evaluate(evalGetDocumentPageSettings, config.paper);

    const docs2: IDocumentPagePhase2[] = [];
    for (const documentPage of docs1) {
      this.log(`Collecting sections and their settings for document page ${documentPage.index}`);

      await this.setViewport({width: documentPage.width, height: documentPage.height, deviceScaleFactor: 1});
      const doc = await this.page.evaluate(evalGetSectionSettings, JSON.stringify(config.paper), JSON.stringify(documentPage));

      this.log(`Finalizing body construction for document page ${documentPage.index}`);
      const bodyHeight = doc.height - doc.header.height - doc.footer.height;
      const bodyY = doc.footer.height + 1; // TODO: check if height + 1 is needed

      if (bodyHeight < (doc.height / 3)) {
        throw new Error(`Header/footer too big. Page height: ${doc.height}px, header: ${doc.header.height}px, footer: ${doc.footer.height}px`);
      }

      const body = await this.getBodyForDocumentPage(documentPage, bodyHeight, bodyY);
      const pageCount = body.pdf.getPageCount();
      const previousDocumentPage = docs2.length ? docs2[docs2.length - 1] : undefined;
      const pageOffset = previousDocumentPage ? previousDocumentPage.pageOffset + previousDocumentPage.pageCount : 0;

      docs2.push({
        ...doc,
        pageCount,
        pageOffset,
        body,
      });
    }

    const totalPageCount = docs2.reduce((acc, doc) => acc + doc.pageCount, 0);
    const hasAnyPageNumber = docs2.some((doc) => doc.background.hasPageNumber || doc.header.hasPageNumber || doc.footer.hasPageNumber);
    this.log(hasAnyPageNumber ? `Injecting total page count: ${totalPageCount}` : `Total page count: ${totalPageCount}, no injection container found`);

    if (hasAnyPageNumber) {
      this.page.evaluate(evalInjectTotalPageCount, totalPageCount);
    }

    const docs3: IDocumentPagePhase3[] = [];
    for (const documentPage of docs2) {
      this.log(`Finalizing document page ${documentPage.index}`)
      await this.setViewport({width: documentPage.width, height: documentPage.height, deviceScaleFactor: 1});

      const background = await this.getSectionForDocumentPage(documentPage, 'page-background' as const, documentPage.background);
      const header = await this.getSectionForDocumentPage(documentPage, 'page-header' as const, documentPage.header);
      const footer = await this.getSectionForDocumentPage(documentPage, 'page-footer' as const, documentPage.footer);

      docs3.push({
        ...documentPage,
        background: {
          ...documentPage.background,
          ...background,
          y: 0,
        },
        header: {
          ...documentPage.header,
          ...header,
          y: documentPage.height - documentPage.header.height,
        },
        footer: {
          ...documentPage.footer,
          ...footer,
          y: 0,
        },
      });
    }

    return docs3;
  }

  async getBodyForDocumentPage(documentPage: IDocumentPagePhase1, height: number, y: number) {
    const width = documentPage.width;

    await this.page.evaluate(evalShowOnlyPageWithSection, documentPage.index, 'page-body' as const);
    // TODO: check if height + 1 is needed
    const pdfBuffer = await this.page.pdf({
      width,
      height: height > 0 ? height : 1,
      format: undefined,
      omitBackground: true,
      printBackground: true,
      scale: 1
    });
    const pdf = await PDFDocument.load(pdfBuffer);

    if (this.debug) {
      const filename = `generated/${this.debugFilename}-parts-page-body.pdf`;
      this.log(`Writing debug file: ${filename}`);
      await writeBuffer(pdfBuffer, filename);
    }

    return {height, y, pdfBuffer, pdf};
  }

  async getSectionForDocumentPage(
    documentPage: IDocumentPagePhase2,
    sectionName: 'page-background' | 'page-header' | 'page-footer',
    section: ISectionPartial
  ) {
    const pdfBuffers: Buffer[] = [];
    const pdfs: PDFDocument[] = [];
    const hasPhysicalPages = section.collection.length > 0;
    const pageCountArray = Array(documentPage.pageCount).fill(0).map((_, i) => i);
    let isVisibilitySet = false;

    for (const pageIndex of pageCountArray) {
      const currentPageNumber = documentPage.pageOffset + pageIndex + 1;

      this.log(`Injecting current page number: ${currentPageNumber}`);

      if (section.hasPageNumber) {
        await this.page.evaluate(evalInjectCurrentPageNumber, documentPage.index, sectionName, currentPageNumber);
      }

      if (hasPhysicalPages) {
        const col = determineActivePhysicalPage(pageIndex + 1, documentPage.pageCount, section.collection);
        const colIndex = col ? col.index : -1;

        if (colIndex === -1) {
          this.log(`Showing only section ${sectionName} and hiding all physical pages`);
        } else {
          this.log(`Showing only section ${sectionName} with physical page index ${colIndex}`);
        }
        await this.page.evaluate(evalShowOnlyPageWithSection, documentPage.index, sectionName, colIndex);
      } else if (!isVisibilitySet) {
        this.log(`Showing only section ${sectionName}`);
        await this.page.evaluate(evalShowOnlyPageWithSection, documentPage.index, sectionName);
        isVisibilitySet = true;
      }

      // TODO: figure out a way not to generate pdf for 0 heights
      // height must be positive integer, else pdf throws error
      const omitBackground = sectionName !== 'page-background' && section.height > 0;
      this.log(`Generating buffer for section ${sectionName} for page ${pageIndex + 1} [w${documentPage.width} h${section.height}]`);
      const pdfBuffer = await this.page.pdf({
        width: documentPage.width,
        height: section.height > 0 ? section.height : 1,
        format: undefined,
        omitBackground,
        printBackground: true,
        scale: 1
      });
      const pdf = await PDFDocument.load(pdfBuffer);

      if (this.debug) {
        const filename = `generated/${this.debugFilename}-parts-${sectionName}-${pageIndex + 1}.pdf`;
        this.log(`Writing debug file: ${filename}`);
        await writeBuffer(pdfBuffer, filename);
      }

      pdfBuffers.push(pdfBuffer);
      pdfs.push(pdf);
    }

    return {pdfBuffers, pdfs};
  }
}
