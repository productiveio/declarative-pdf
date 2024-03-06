import { Store } from './store';
import { validateTemplateSetting } from '@app/utils/validators';
import { PaperDefaults } from '@app/utils/paper-defaults';
import HTMLAdapter from '@app/utils/adapter-puppeteer';

import type { PAPER_SIZE } from '@app/consts/paper-size';
import type { DocumentPage } from './document-page';
import type { Browser } from 'puppeteer';

type DeclarativePDFOpts = {
  debug?: boolean;
  ppi?: number;
  format?: keyof typeof PAPER_SIZE;
  width?: number;
  height?: number;
};

export default class DeclarativePDF {
  declare debug: boolean;
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
    this.defaults = new PaperDefaults({
      ppi: opts?.ppi,
      format: opts?.format,
      width: opts?.width,
      height: opts?.height,
    });
    this.debug = opts?.debug ?? false;
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

    /** we should have everything, time to build pdf */
    await this.buildPDF();

    // zato sto sad znamo sirinu i visinu, mozemo izracunati ostale visine i dohvatiti ostale podatke
    // ovdje dovrsavamo inicijalizaciju documentPage modela
    // oni sad imaju svoj body, te meta podatke za header, footer i background
    // moramo prvo sve bodye dohvatiti, zbog total page numbera
    // await this.initializePageElementModels();

    // sad imamo i total page number, mozemo izgenerirati sve elemente i injectati brojeve stranica ako treba
    // ovdje dovrsavamo posao i trebali bi imat u pdf-u sve, pa mozemo u fazu konstrukcije pdf-a
    // await this.processPageElements();
  }

  /**
   * Creates the document page models.
   *
   * This method will evaluate the template settings and create a new
   * document page model for each setting parsed from the HTML template.
   */
  private async createDocumentPageModels() {
    const settings = await this.html.templateSettings({
      width: this.defaults.width,
      height: this.defaults.height,
      ppi: this.defaults.ppi,
    });

    settings.forEach((setting) => {
      validateTemplateSetting(setting);

      this.documentPages.push(this.store.createModel('page', setting));
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
      doc.createLayoutAndBody(settings);
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

    // flow 1: nemamo headere i footere, imamo samo jedan body
    // - vracamo vec postojeci buffer i izlazimo iz funkcije
    // flow 2: nemamo headere i footere, imamo vise bodya
    // - mergamo kroz pdf-lib i vracamo buffer (ima neki flow za to)
    // flow 3: imamo headere i/ili footere, imamo jedan body ili vise njih
    // - kreiramo bazni doc, embedamo elemente, placeamo na stranice, vracamo buffer
    // await this.buildPDFDocument();
    // - await buildPDFWithoutPageElements();
    // - await buildPDFWithPageElements();

    return true;
  }
}
