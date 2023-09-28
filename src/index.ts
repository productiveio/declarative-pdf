import {PDFDocument} from 'pdf-lib';
import puppeteer from 'puppeteer';
import {BrowserPage} from './browserPage.js';
import {config} from './config.js';
import writeBuffer from './utils/writeBuffer.js';

import type {Browser} from 'puppeteer';
import type {IDocumentPagePhase3, IPDFGeneratorOpts} from './types/index.js';
// TODO: setup emiter -> handle puppeteer errors, handle pdf-generator errors

class PDFGenerator {
  declare debug: boolean;
  declare debugFilename: string;
  declare keepAlive: boolean;
  declare page: BrowserPage;
  declare browser: Browser;
  declare totalPages: number;
  declare pdf: PDFDocument; // await PDFDocument.create();
  declare pdfBuffer: Uint8Array; // pdf.save();
  declare docs: IDocumentPagePhase3[];

  get isBrowserReady() {
    return this.browser && this.browser.isConnected();
  }

  log(str: string) {
    if (this.debug) {
      const date = new Date();
      console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] ${str}`);
    }
  }

  public async generate(html: string, opts?: IPDFGeneratorOpts) {
    this.debug = Boolean(opts?.debug);
    this.debugFilename = opts?.debugFilename ?? 'declarative-pdf';
    this.keepAlive = Boolean(opts?.keepAlive);

    await this.init();

    await this.loadHtml(html);

    this.docs = await this.page.getDocumentPages();

    await this.dispose();
    await this.generatePDFDocument();

    return this.pdfBuffer;
  }

  private async init() {
    if (!this.isBrowserReady) {
      this.log('Launching new browser');
      this.browser = await puppeteer.launch({...config.browser});
      await this.closeBrowserTabs();
    }

    this.log('Opening new tab');
    this.page = new BrowserPage({browser: this.browser, debug: this.debug, debugFilename: this.debugFilename});
    await this.page.init();
  }

  private async dispose() {
    await this.closeBrowserTabs();

    if (!this.keepAlive) {
      this.log('Closing browser');
      await this.browser.close();
    }
  }

  private async closeBrowserTabs() {
    const pages = await this.browser.pages();
    this.log(`Closing all (${pages.length}) browser pages`);

    for (const page of pages) {
      await page.close();
    }
  }

  private async loadHtml(html: string) {
    await this.page.setContent(html);
    await this.page.normalize();
  }

  private async generatePDFDocument() {
    this.pdf = await PDFDocument.create();

    for (const doc of this.docs) {
      this.log(`Generating PDF doc[${doc.index}]`);
      const docPdf = await PDFDocument.create();

      if (!doc.body.pdf) {
        throw new Error(`this.docs[${doc.index}].body.pdf was not initialized`);
      }

      const bodyPages = doc.body.pdf.getPages();
      for (const bodyPage of bodyPages) {
        const docPdfCurrentPage = docPdf.addPage([doc.width, doc.height]);
        const pageIndex = bodyPages.indexOf(bodyPage);
        this.log(`Generating PDF doc[${doc.index}] page[${pageIndex}]`);

        for (const section of ['background', 'header', 'footer'] as const) {
          if (doc[section].pdfs.length === 0) continue;
          this.log(`Generating PDF doc[${doc.index}] page[${pageIndex}] section '${section}': h${doc[section].height} y${doc[section].y} x0`);

          const sectionPage = doc[section].pdfs[pageIndex].getPage(0);
          const embeddedPage = await docPdf.embedPage(sectionPage);
          if (!embeddedPage) continue; // TODO: se moze desit da embedanje faila?

          docPdfCurrentPage.drawPage(embeddedPage, {
            width: doc.width,
            height: doc[section].height,
            x: 0,
            y: doc[section].y
          });
        }

        this.log(`Generating PDF doc[${doc.index}] page[${pageIndex}] body: h${doc.body.height} y${doc.body.y} x0`);
        const embeddedPage = await docPdf.embedPage(bodyPage);
        if (!embeddedPage) continue; // TODO: se moze desit da embedanje faila?

        docPdfCurrentPage.drawPage(embeddedPage, {
          width: doc.width,
          height: doc.body.height,
          x: 0,
          y: doc.body.y
        });
      }

      const copiedPages = await this.pdf.copyPages(docPdf, docPdf.getPageIndices());
      copiedPages.forEach((page) => this.pdf.addPage(page));

      if (this.debug) {
        const docPdfBuffer = await docPdf.save();
        const filename = `generated/${this.debugFilename}-doc-${doc.index}.pdf`
        this.log(`Writing file ${filename}`);
        writeBuffer(docPdfBuffer, filename);
      }
    }

    this.pdfBuffer = await this.pdf.save();
  }
}

const pdfGenerator = new PDFGenerator();
export default (html: string, opts?: IPDFGeneratorOpts) => pdfGenerator.generate(html, opts);
