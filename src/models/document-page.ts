import { PDFDocument } from 'pdf-lib';
import { Model, type TModel } from '@app/models/model';
import { Layout } from '@app/utils/layout';

import type { PageElement } from '@app/models/page-element';

type DocumentPageOpts = {
  /** index of document-page element in DOM */
  index: number;
  /** whole page width in pixels */
  width: number;
  /** whole page height in pixels */
  height: number;
} & TModel;

export type ElementSettings = {
  index: number;
  type: 'header' | 'footer' | 'background';
  subSelector?: 'first' | 'last' | 'even' | 'odd' | 'default';
  height: number;
  hasCurrentPageNumber: boolean;
  hasTotalPagesNumber: boolean;
}[];

export class DocumentPage extends Model {
  declare height: number;
  declare width: number;
  declare index: number;

  declare settings?: ElementSettings;
  declare layout?: Layout;
  declare body?: PageElement;

  constructor(opts: DocumentPageOpts) {
    super(opts);
    this.index = opts.index;
    this.width = opts.width;
    this.height = opts.height;
  }

  get viewPort() {
    return {
      width: this.width,
      height: this.height,
    };
  }

  get html() {
    return this.owner.html;
  }

  get store() {
    return this.owner.store;
  }

  /**
   * Create the layout and body element.
   *
   * This method creates the body PDF and sets the number
   * of pages this document-page have.
   *
   * At this point, layout knows only of heights and what
   * page elements exist. To finish the layouting, we need
   * number of pages for this doc and total number of pages
   * across all documentPage models
   *
   * @throws {Error} If the settings is not valid
   */
  async createLayoutAndBody(settings: ElementSettings) {
    // TODO: validirati settinge?
    this.layout = new Layout(this, settings);

    await this.html.prepareSection({ documentPageIndex: this.index });
    const buffer = await this.html.pdf({
      width: this.width,
      height: this.layout.bodyHeight,
      transparentBg: this.layout.hasBackgroundElement,
    });
    const pdf = await PDFDocument.load(buffer);

    this.body = this.store.createModel('body', { pdf, buffer });
  }

  get previousDocumentPages() {
    return this.owner.documentPages.slice(0, this.index);
  }

  // TODO: ovdje treba neka validacija
  // broj mora biti veci od 0
  // body mora postojati
  declare _pageCount: number;
  get pageCount() {
    return (this._pageCount ??= this.body!.pdf.getPageCount());
  }

  // TODO: ovdje isto treba neka validacija
  // broj ne smije biti manji od broja documentPagesa
  declare _pageCountOffset: number;
  get pageCountOffset() {
    return (this._pageCountOffset ??= this.previousDocumentPages.reduce(
      (acc, doc) => acc + doc.pageCount,
      0
    ));
  }

  get totalPagesNumber() {
    return this.owner.totalPagesNumber;
  }

  /** Initializes this model. - deprecated, remove it */
  async initialize(settings: ElementSettings) {
    this.settings = settings;
    // TODO: validirati settingse?

    // flow:
    // - trebamo inicijalizirati layout i dohvatiti sve visine
    // - zatim trebamo body isprocesirati i dohvatiti broj stranica
    // - zatim nam treba total broj stranica (suma svih document-page elemenata) -> parent klasa

    // - zatim parent klasa treba izvrtiti sve sto je potrebno i dovrsiti prikupljanje pdf-ova
    // - zatim parent klasa treba od svega pripremljenoga napraviti pdf

    // this.layout = new Layout(this, settings);
    // await this.processBody();

    // this.layout.processSettings(2);

    // u ovom trenutku imamo samo body, ne znamo jos totalni broj stranica
    // mozda samo trebamo odrediti ima li ovdje necega za postProcessing

    // ovo govno treba nacrtati
    // now we have to create header, footer and background
    // if they exist and place them in correct order, by id
    // flow per element type:
    // - check if this type have any elements (skip if no)
    // - if yes, for each page determine which element to use
    // - check
    // - create a new element, link to settings index
    //
    // - check if there are injectables (fork)
    // flow for injectables:
    //
  }

  async process() {
    if (!this.layout) throw new Error('Layout is not initialized');
    this.layout.createLayoutPages();

    // there is nothing to process, so bail out
    if (!this.layout.needsProcessing) return;

    // at this point we should have some pages for processing
    if (!this.layout.pagesForProcessing) {
      throw new Error('Unable to find pages for processing');
    }

    // process every page that needs processing in sequence
    for (const page of this.layout.pagesForProcessing) {
      await page.process();
    }

    // there is something to process, we need to build those pdf's
    // we need to check if those pages are reusable
  }

  // processLayout() {
  //   const pageCount = this.pageCount ?? 0;

  // }

  // async processElements() {
  //   // for every page we will create or link an element

  //   const pageCount = this.pageCount ?? 0;

  //   // index: number;
  //   // type: "footer" | "header" | "background";
  //   // subSelector?: "first" | "last" | "even" | "odd" | "default" | undefined;
  //   // height: number;
  //   // hasCurrentPageNumber: boolean;
  //   // hasTotalPagesNumber: boolean;

  // }
}
