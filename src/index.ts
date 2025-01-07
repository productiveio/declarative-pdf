import {PDFDocument, StandardFonts, PageSizes, rgb} from 'pdf-lib';
import {DocumentPage} from '@app/models/document-page';
import {normalizeSetting} from '@app/utils/normalize-setting';
import {PaperDefaults, type PaperOpts} from '@app/utils/paper-defaults';
import HTMLAdapter, {type MinimumBrowser} from '@app/utils/adapter-puppeteer';
import TimeLogger from '@app/utils/debug/time-logger';
import {buildPages} from '@app/utils/layout/build-pages';

interface DebugOptions {
  /** Do we want to log debug information */
  timeLog?: boolean;
  // TODO: pdfName in debug options? do we need it in main opts?
  /** Which filename to use for PDF */
  pdfName?: string;
  /** Do we want to attach generated segments to the PDF */
  attachSegments?: boolean;
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
    return this.documentPages.reduce((acc, doc) => acc + doc.layout!.pageCount, 0);
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
    const logger = this.debug.timeLog ? new TimeLogger() : undefined;

    logger?.session().start(`Total time for ${this.debug.pdfName ?? 'PDF'}`);
    /** (re)set documentPages */
    this.documentPages = [];

    try {
      /** open a new tab in the browser */
      logger?.level1().start('[1] Opening new tab');
      await this.html.newPage();

      /** send the template to the tab and normalize it */
      logger?.level1().start('[2] Setting content and loading html');
      await this.html.setContent(template);

      logger?.level1().start('[3] Normalising content');
      await this.html.normalize();

      /** get from DOM index, width and height for every document-page element */
      logger?.level1().start('[4] Getting document page settings from DOM');
      await this.getDocumentPageSettings();

      /**
       * At this point we should have all the document page settings.
       * If the template is malformed or doesn't contain any document-page
       * elements, we throw an error.
       */
      if (!this.documentPages.length) throw new Error('No document pages found');

      /** for every document page model, get from DOM what that document-page contains */
      logger?.level1().start('[5] Build page layout and body');
      await this.buildLayoutForEachDocumentPage(logger);
      logger?.level1().end();

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
      logger?.level1().start('[6] Process sections and build final PDF');
      const pdf = await this.buildPDF(logger);
      logger?.level1().end();

      /** cleanup - close the tab in browser */
      logger?.level1().start('[7] Closing tab');
      await this.html.close();

      /** cleanup - close the logger session */
      logger?.session().end();
      const report = logger?.getReport();
      if (report) {
        console.log(report);
        const reportPdf = await PDFDocument.create();
        const font = await reportPdf.embedFont(StandardFonts.Courier);
        const page = reportPdf.addPage(PageSizes.A4);
        page.setFont(font);
        report.split('\n').forEach((line, index) => {
          let color = rgb(0, 0, 0.8);
          if (line.includes('|   [')) color = rgb(0.6, 0.6, 0.6);
          else if (line.includes('|     [')) color = rgb(0.8, 0.8, 0.8);
          page.drawText(line, {x: 50, y: 750 - index * 12, size: 10, color});
        });
        const reportBytes = await reportPdf.save();

        pdf.attach(reportBytes, 'time-log.pdf', {
          mimeType: 'application/pdf',
          description: 'Time log report',
          creationDate: new Date(),
          modificationDate: new Date(),
        });
      }

      return await pdf.save();
    } catch (error) {
      /** cleanup - always close opened tab in the browser to avoid memory leaks */
      logger?.level1().start('[x] Closing tab after error');
      await this.html.close();

      /** cleanup - always close the logger session */
      logger?.session().end();
      const report = logger?.getReport();

      // TODO: add a way to return the report
      if (report) console.log(report);
      // console.error(error);

      /** rethrow the error (this will skip the finally block) */
      throw error;
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
    for (const [index, doc] of this.documentPages.entries()) {
      logger?.level2().start('[5.1] Set viewport');
      await this.html.setViewport(doc.viewPort);
      logger?.level2().end();

      let settings;
      if (doc.hasSections) {
        logger?.level2().start('[5.2] Get section settings');
        settings = await this.html.getSectionSettings({index});
        logger?.level2().end();
      }

      logger?.level2().start('[5.3] Create layout and body');
      await doc.createLayoutAndBody(settings, logger);
      logger?.level2().end();
    }
  }

  private async buildPDF(logger?: TimeLogger) {
    const outputPDF = await PDFDocument.create();

    for (const doc of this.documentPages) {
      // TODO: do we need to return anything from buildPages?
      await buildPages({
        documentPageIndex: doc.index,
        pageCountOffset: doc.pageCountOffset,
        totalPagesNumber: this.totalPagesNumber,
        layout: doc.layout!,
        body: doc.body!,
        target: outputPDF,
        html: this.html,
        logger,
        attachSegmentsForDebugging: this.debug.attachSegments,
      });
    }

    return outputPDF;
  }
}
