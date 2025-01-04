import { PDFDocument } from 'pdf-lib';
import { DocumentPage } from '@app/models/document-page';
import { normalizeSetting } from '@app/utils/normalize-setting';
import { PaperDefaults, type PaperOpts } from '@app/utils/paper-defaults';
import HTMLAdapter, { type MinimumBrowser } from '@app/utils/adapter-puppeteer';
import TimeLogger from '@app/models/debug-time-log';
import { buildPages } from '@app/utils/layout/build-pages';

interface DebugOptions {
  /** Do we want to log debug information */
  log?: boolean;
  /** Do we want to aggregate logs */
  aggregated?: boolean;
  /** Which filename to use for PDF */
  pdfName?: string;
}

// TODO: add more normalization options (maybe we want to do a part of standard normalization)
interface DeclarativePDFOpts {
  /** Should we normalize the content (remove excess elements, wrap content to tags) */
  normalize?: boolean;
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
  }

  get totalPagesNumber() {
    return this.documentPages.reduce((acc, doc) => acc + doc.pageCount, 0);
  }

  /**
   * Generates a pdf buffer from string containing html template.
   * TODO: add another method that creates pdf from puppeteer page (already loaded content)
   *
   * When calling this method, it is expected that:
   * - the browser is initialized and ready
   * - template you pass in is string containing valid HTML
   *
   * @param template A string containing valid HTML document
   */
  async generate(template: string) {
    const logger = this.debug.log
      ? new TimeLogger({ aggregated: this.debug.aggregated })
      : undefined;

    const JOB0 = `[Σ] Total time for ${this.debug.pdfName ?? 'PDF'}`;
    logger?.startSession(JOB0);
    /** (re)set documentPages */
    this.documentPages = [];

    try {
      /** open a new tab in the browser */
      const JOB1 = '[1] Opening new tab';
      logger?.add(JOB1);
      await this.html.newPage();
      logger?.end(JOB1);

      /** send the template to the tab and normalize it */
      const JOB2 = '[2] Setting content and loading html';
      logger?.add(JOB2);
      await this.html.setContent(template);
      logger?.end(JOB2);
      const JOB3 = '[3] Normalizing content';
      logger?.add(JOB3);
      await this.html.normalize();
      logger?.end(JOB3);

      /** get from DOM index, width and height for every document-page element */
      const JOB4 = '[4] Getting document page settings from DOM';
      logger?.add(JOB4);
      await this.getDocumentPageSettings();
      logger?.end(JOB4);
      /** for every document page model, get from DOM what that document-page contains */
      const JOB5 = '[5] Build page layout and body';
      logger?.add(JOB5);
      await this.buildLayoutForEachDocumentPage();
      logger?.end(JOB5);

      /**
       * Return early for only one document page with only a body element.
       *
       * This is a special case where we can return the body buffer directly
       * because there are no headers, footers or sections to process. So,
       * resulting PDF will be the same as the body buffer.
       */
      if (
        this.documentPages.length === 1 &&
        !this.documentPages[0].hasSections
      ) {
        return this.documentPages[0].body!.buffer;
      }

      /**
       * We either have multiple document pages or some section elements,
       * so we need to process them to build the final PDF.
       */
      const JOB6 = '[6] Process sections and build final PDF';
      logger?.add(JOB6);
      const result = await this.buildPDF();
      logger?.end(JOB6);

      return result;
    } catch (error) {
      /** cleanup - always close opened tab in the browser to avoid memory leaks */
      const JOBx = '[x] Closing tab after error';
      logger?.add(JOBx);
      await this.html.close();
      logger?.end(JOBx);

      /** cleanup - always close the logger session */
      logger?.end(JOB0);
      logger?.endSession();

      /** rethrow the error (this will skip the finally block) */
      throw error;
    } finally {
      /** cleanup - close the tab in browser */
      const JOB7 = '[7] Closing tab';
      logger?.add(JOB7);
      await this.html.close();
      logger?.end(JOB7);

      /** cleanup - close the logger session */
      logger?.end(JOB0);
      logger?.endSession();
    }
  }

  /**
   * Creates the document page models.
   *
   * This method will evaluate the template settings and create a new
   * document page model for each setting parsed from the HTML template.
   */
  private async getDocumentPageSettings() {
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

  // TODO: remove this getter
  get needsLayouting() {
    if (!this.documentPages.length) throw new Error('No document pages found');

    return this.documentPages.some((doc) => doc.hasSections);
  }

  /**
   * Initializes the document page models.
   *
   * For every created document page model, this method sets desired
   * viewport and gets section settings from the DOM to create layout
   * (heights and positions). It then convert to pdf the body element
   * from which we get the number of pages and finally have all the
   * information needed to build the final PDF.
   */
  private async buildLayoutForEachDocumentPage() {
    if (!this.documentPages.length) throw new Error('No document pages found');

    for (const [index, doc] of this.documentPages.entries()) {
      await this.html.setViewport(doc.viewPort);

      let settings;
      if (doc.hasSections) {
        settings = await this.html.getSectionSettings({ index });
      }

      await doc.createLayoutAndBody(settings);
    }
  }

  private async buildPDF() {
    if (!this.documentPages?.length) throw new Error('No document pages found');

    const outputPDF = await PDFDocument.create();

    for (const doc of this.documentPages) {
      await buildPages({
        documentPageIndex: doc.index,
        pageCountOffset: doc.pageCountOffset,
        totalPagesNumber: this.totalPagesNumber,
        layout: doc.layout!,
        body: doc.body!,
        target: outputPDF,
        html: this.html,
      });
    }

    return outputPDF.save();
  }
}
