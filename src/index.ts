import { PDFDocument } from 'pdf-lib';
import { Store } from '@app/services/store';
import { normalizeSetting } from '@app/utils/normalize-setting';
import { PaperDefaults } from '@app/utils/paper-defaults';
import HTMLAdapter from '@app/services/adapter-puppeteer';

import type { PAPER_SIZE } from '@app/consts/paper-size';
import type { DocumentPage } from '@app/models/document-page';
import type { Browser } from 'puppeteer';

type DeclarativePDFOpts =
  | {
      ppi?: number;
      format?: keyof typeof PAPER_SIZE;
    }
  | {
      width?: number;
      height?: number;
    };

export default class DeclarativePDF {
  declare store: Store;
  declare html: HTMLAdapter;
  declare defaults: PaperDefaults;

  documentPages: DocumentPage[] = [];

  /**
   *
   * @param browser A puupeteer browser instance, prepared for use
   * @param opts Various options for the PDF generator
   */
  constructor(browser: Browser, opts?: DeclarativePDFOpts) {
    this.html = new HTMLAdapter(browser);

    if (opts && 'format' in opts) {
      this.defaults = new PaperDefaults({
        ppi: opts?.ppi,
        format: opts?.format,
      });
    } else if (opts && ('width' in opts || 'height' in opts)) {
      this.defaults = new PaperDefaults({
        width: opts?.width,
        height: opts?.height,
      });
    } else {
      this.defaults = new PaperDefaults();
    }
  }

  // TODO: treba neka validacija za ovo
  // - broj ne smije biti manji od broja documentPagesa
  declare _totalPagesNumber: number;
  get totalPagesNumber() {
    return (this._totalPagesNumber ??= this.documentPages.reduce(
      (acc, doc) => acc + doc.pageCount,
      0
    ));
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
    /** (re)set everything */
    this.documentPages = [];
    this.store = new Store(this);

    /** open new tab in browser */
    await this.html.newPage();

    /** send template to tab and normalize it */
    await this.html.setContent(template);
    await this.html.normalize();

    /** get from DOM index, width and height for every document-page element */
    await this.createDocumentPageModels();
    /** for every document page model, get from DOM what that document-page contains  */
    await this.initializeDocumentPageModels();

    /** for every document page model, process any element they might have */
    await this.processDocumentPageModels();

    /** close the tab in browser */
    await this.html.close();

    /** we should have everything, time to build pdf */
    return await this.buildPDF();
  }

  /**
   * Creates the document page models.
   *
   * This method will evaluate the template settings and create a new
   * document page model for each setting parsed from the HTML template.
   */
  private async createDocumentPageModels() {
    const documentPageSettings = await this.html.templateSettings({
      width: this.defaults.width,
      height: this.defaults.height,
      ppi: this.defaults.ppi,
    });

    documentPageSettings.forEach((setting) => {
      this.documentPages.push(
        this.store.createModel('page', normalizeSetting(setting))
      );
    });
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
      const settings = await this.html.documentPageSettings({ index });
      // TODO: treba li nam neka normalizacija settinga ovdje?
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
      !this.documentPages[0].layout!.hasConfig
    ) {
      // flow 1: nemamo headere i footere, imamo samo jedan body
      // - vracamo vec postojeci buffer i izlazimo iz funkcije
      return this.documentPages[0].body!.buffer;
    } else {
      // flow 2: imamo headere i/ili footere, imamo jedan body ili vise njih
      // - kreiramo bazni doc, embedamo elemente, placeamo na stranice, vracamo buffer
      const outputPDF = await PDFDocument.create();

      for (const doc of this.documentPages) {
        if (!doc.layout!.hasConfig) {
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

            for (const section of ['background', 'header', 'footer'] as const) {
              const elementName = `${section}Element` as const;
              const settingName = `${section}Setting` as const;
              if (!page[elementName]?.pdf) continue;

              const sectionPage = page[elementName]?.pdf.getPage(0);
              if (!sectionPage) continue;

              const embeddedPage = await outputPDF.embedPage(sectionPage);
              if (!embeddedPage) continue;

              currentOutputPage.drawPage(embeddedPage, {
                width: page.layout.pageWidth,
                height: page[settingName]?.sectionHeight,
                x: 0,
                y: page.layout[`${section}Y`],
              });
            }

            const bodyPage = page.bodyPdf;
            const embeddedPage = await outputPDF.embedPage(bodyPage);
            currentOutputPage.drawPage(embeddedPage, {
              width: page.layout.pageWidth,
              height: page.layout.bodyHeight,
              x: 0,
              y: page.layout.bodyY,
            });
          }
        }
      }

      return outputPDF.save();
    }
  }
}
