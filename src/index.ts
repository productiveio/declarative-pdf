import { PDFDocument } from 'pdf-lib';
import { DocumentPage } from '@app/models/document-page';
import { normalizeSetting } from '@app/utils/normalize-setting';
import { PaperDefaults, type PaperOpts } from '@app/utils/paper-defaults';
import HTMLAdapter, { type MinimumBrowser } from '@app/utils/adapter-puppeteer';
import logger from '@app/models/debug-time-log';

interface DebugOptions {
  /** Do we want to log debug information */
  log?: boolean;
  /** Do we want to aggregate logs */
  aggregated?: boolean;
  /** Which filename to use for PDF */
  pdfName?: string;
}

interface DeclarativePDFOpts {
  /** Override for paper defaults (A4 / 72ppi) */
  defaults?: PaperOpts;
  /** Debug options (attaches parts, logs timings) */
  debug?: DebugOptions;
}

export default class DeclarativePDF {
  declare html: HTMLAdapter;
  declare defaults: PaperDefaults;
  declare debug: DebugOptions;

  documentPages: DocumentPage[] = [];

  /**
   *
   * @param browser A puupeteer browser instance, prepared for use
   * @param opts Various options for the PDF generator
   */
  constructor(browser: MinimumBrowser, opts?: DeclarativePDFOpts) {
    this.html = new HTMLAdapter(browser);
    this.defaults = new PaperDefaults(opts?.defaults);
    this.debug = opts?.debug ?? {};

    logger.setOptions({
      aggregated: !!this.debug.aggregated,
      active: !!this.debug.log,
    });
  }

  get totalPagesNumber() {
    return this.documentPages.reduce((acc, doc) => acc + doc.pageCount, 0);
  }

  /**
   * Generates a pdf buffer from string containing html template.
   *
   * When calling this method, it is expected that:
   * - the browser is initialized and ready
   * - template you pass in is string containing valid HTML
   *
   * @param template A string containing valid HTML document
   */
  async generate(template: string) {
    const JOB0 = `[Σ] Total time for ${this.debug.pdfName ?? 'PDF'}`;
    const JOB1 = '[1] Opening new tab';
    const JOB2 = '[2] Setting content and loading html';
    const JOB3 = '[3] Normalizing content';
    const JOB4 = '[4] Creating document page models';
    const JOB5 = '[5] Initializing document page models';
    const JOB6 = '[6] Processing document page models';
    const JOB7 = '[7] Closing tab';
    const JOB8 = '[8] Building PDF';
    const JOBx = '[x] Closing tab after error';

    logger.startSession(JOB0);
    /** (re)set documentPages */
    this.documentPages = [];

    try {
      /** open new tab in browser */
      logger.add(JOB1);
      await this.html.newPage();
      logger.end(JOB1);

      /** send template to tab and normalize it */
      logger.add(JOB2);
      await this.html.setContent(template);
      logger.end(JOB2);
      logger.add(JOB3);
      await this.html.normalize();
      logger.end(JOB3);

      /** get from DOM index, width and height for every document-page element */
      logger.add(JOB4);
      await this.createDocumentPageModels();
      logger.end(JOB4);
      /** for every document page model, get from DOM what that document-page contains */
      logger.add(JOB5);
      await this.initializeDocumentPageModels();
      logger.end(JOB5);

      /** for every document page model, process any element they might have */
      logger.add(JOB6);
      await this.processDocumentPageModels();
      logger.end(JOB6);

      /** close the tab in browser */
      logger.add(JOB7);
      await this.html.close();
      logger.end(JOB7);

      /** we should have everything, time to build pdf */
      logger.add(JOB8);
      const result = await this.buildPDF();
      logger.end(JOB8);

      logger.end(JOB0);
      logger.endSession();
      return result;
    } catch (error) {
      /** always close opened tab in the browser to avoid memory leaks */
      logger.add(JOBx);
      await this.html.close();
      logger.end(JOBx);

      logger.end(JOB0);
      logger.endSession();
      /** rethrow the error */
      throw error;
    }
  }

  /**
   * Creates the document page models.
   *
   * This method will evaluate the template settings and create a new
   * document page model for each setting parsed from the HTML template.
   */
  private async createDocumentPageModels() {
    const documentPageSettings = await this.html.getTemplateSettings({
      width: this.defaults.width,
      height: this.defaults.height,
      ppi: this.defaults.ppi,
    });

    documentPageSettings.forEach((setting) => {
      this.documentPages.push(
        new DocumentPage({ parent: this, ...normalizeSetting(setting) })
      );
    });
  }

  get needsLayouting() {
    if (!this.documentPages?.length) throw new Error('No document pages found');

    return this.documentPages.some((doc) => doc.layout?.hasMeta);
  }

  /**
   * Initializes the document page models.
   *
   * For every created document page model, this method sets desired
   * viewport and evaluates document page settings from which it
   * initializes that document page model.
   */
  private async initializeDocumentPageModels() {
    if (!this.documentPages?.length) throw new Error('No document pages found');

    for (const [index, doc] of this.documentPages.entries()) {
      await this.html.setViewport(doc.viewPort);
      const settings = await this.html.getDocumentPageSettings({ index });
      await doc.createLayoutAndBody(settings);
    }
  }

  private async processDocumentPageModels() {
    if (!this.documentPages?.length) throw new Error('No document pages found');

    for (const doc of this.documentPages) {
      await doc.process();
    }
  }

  private async buildPDF() {
    if (!this.documentPages?.length) throw new Error('No document pages found');

    if (
      this.documentPages.length === 1 &&
      !this.documentPages[0].layout!.pages?.length
    ) {
      // flow 1: nemamo headere i footere, imamo samo jedan body
      // - vracamo vec postojeci buffer i izlazimo iz funkcije
      return this.documentPages[0].body!.buffer;
    } else {
      // flow 2: imamo headere i/ili footere, imamo jedan body ili vise njih
      // - kreiramo bazni doc, embedamo elemente, placeamo na stranice, vracamo buffer
      const outputPDF = await PDFDocument.create();

      for (const doc of this.documentPages) {
        if (!doc.layout!.pages?.length) {
          // case 1 - we only have a body, we can copy pages
          const copiedPages = await outputPDF.copyPages(
            doc.body!.pdf,
            doc.body!.pdf.getPageIndices()
          );
          copiedPages.forEach((page) => outputPDF.addPage(page));
        } else {
          // case 2 - we have sections, need to place them on pages
          for (const page of doc.layout!.pages!) {
            const currentOutputPage = outputPDF.addPage([
              doc.width,
              doc.height,
            ]);

            for (const section of [
              'background',
              'header',
              'footer',
              'body',
            ] as const) {
              const el = page[section];
              if (!el) continue;

              const sectionPage = el.pdfPage;
              if (!sectionPage) {
                throw new Error(
                  `No PDF page found for section ${section} on document page ${doc.index}`
                );
              }

              const embeddedPage = await outputPDF.embedPage(sectionPage);
              if (!embeddedPage) {
                throw new Error(
                  `Failed to embed PDF page for section ${section} on document page ${doc.index}`
                );
              }

              currentOutputPage.drawPage(embeddedPage, {
                width: el.width,
                height: el.height,
                x: el.x,
                y: el.y,
              });
            }
          }
        }
      }

      return outputPDF.save();
    }
  }
}
