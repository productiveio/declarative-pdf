import {PDFDocument} from 'pdf-lib';
import {DocumentPage} from '@app/models/document-page';
import {normalizeSetting} from '@app/utils/normalize-setting';
import {PaperDefaults, type PaperOpts} from '@app/utils/paper-defaults';
import HTMLAdapter, {type MinimumBrowser} from '@app/utils/adapter-puppeteer';
import TimeLogger from '@app/utils/debug/time-logger';
import {buildPages} from '@app/utils/layout/build-pages';

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
    const logger = this.debug.log ? new TimeLogger() : undefined;

    logger?.session().start(`[Σ] Total time for ${this.debug.pdfName ?? 'PDF'}`);
    /** (re)set documentPages */
    this.documentPages = [];

    try {
      /** open a new tab in the browser */
      logger?.group().start('[1] Opening new tab');
      await this.html.newPage();

      /** send the template to the tab and normalize it */
      logger?.group().start('[2] Setting content and loading html');
      await this.html.setContent(template);

      logger?.group().start('[3] Normalizing content');
      await this.html.normalize();

      /** get from DOM index, width and height for every document-page element */
      logger?.group().start('[4] Getting document page settings from DOM');
      await this.getDocumentPageSettings();

      /** for every document page model, get from DOM what that document-page contains */
      logger?.group().start('[5] Build page layout and body');
      await this.buildLayoutForEachDocumentPage(logger);
      logger?.group().end();

      /**
       * Return early for only one document page with only a body element.
       *
       * This is a special case where we can return the body buffer directly
       * because there are no headers, footers or sections to process. So,
       * resulting PDF will be the same as the body buffer.
       */
      if (this.documentPages.length === 1 && !this.documentPages[0].hasSections) {
        return this.documentPages[0].body!.buffer;
      }

      /**
       * We either have multiple document pages or some section elements,
       * so we need to process them to build the final PDF.
       */
      logger?.group().start('[6] Process sections and build final PDF');
      const result = await this.buildPDF(logger);
      logger?.group().end();

      return result;
    } catch (error) {
      /** cleanup - always close opened tab in the browser to avoid memory leaks */
      logger?.group().start('[x] Closing tab after error');
      await this.html.close();

      /** cleanup - always close the logger session */
      logger?.session().end();
      const report = logger?.getReport();

      // TODO: add a way to return the report
      if (report) console.log(report);
      // console.error(error);

      /** rethrow the error (this will skip the finally block) */
      throw error;
    } finally {
      /** cleanup - close the tab in browser */
      logger?.group().start('[7] Closing tab');
      await this.html.close();

      /** cleanup - close the logger session */
      logger?.session().end();
      const report = logger?.getReport();
      if (report) console.log(report);
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
      this.documentPages.push(new DocumentPage({parent: this, ...normalizeSetting(setting)}));
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
  private async buildLayoutForEachDocumentPage(logger?: TimeLogger) {
    if (!this.documentPages.length) throw new Error('No document pages found');

    for (const [index, doc] of this.documentPages.entries()) {
      logger?.subgroup().start('[5.1] Set viewport');
      await this.html.setViewport(doc.viewPort);
      logger?.subgroup().end();

      let settings;
      if (doc.hasSections) {
        logger?.subgroup().start('[5.2] Get section settings');
        settings = await this.html.getSectionSettings({index});
        logger?.subgroup().end();
      }

      logger?.subgroup().start('[5.3] Create layout and body');
      await doc.createLayoutAndBody(settings, logger);
      logger?.subgroup().end();
    }
  }

  private async buildPDF(logger?: TimeLogger) {
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
        logger,
      });
    }

    return outputPDF.save();
  }
}
