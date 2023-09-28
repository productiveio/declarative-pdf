import type {PDFDocument} from 'pdf-lib';
import type Variant from '../consts/physicalPageVariant.js';

/** metadata for &lt;physical-page&gt; */
export interface ISectionCollection {
  /** position of &lt;physical-page&gt; in the DOM */
  index: number
  /** how much space this section takes on the page */
  height: number
  /** placement on physical page */
  type: Variant
}

/**
 * metadata for &lt;page-header&gt;, &lt;page-footer&gt; & &lt;page-background&gt; during phase 1
 * we can't yet construct pdf because there might be some page numbers
 * that need injection and we don't know the total page count yet
 */
export interface ISectionPartial {
  /** how much total space this section can take on the page */
  height: number
  /** does this section have container for page number injection */
  hasPageNumber: boolean
  /** metadata for &lt;physical-page&gt; that belongs to this section */
  collection: ISectionCollection[]
}

/**
 * metadata for &lt;page-header&gt;, &lt;page-footer&gt; & &lt;page-background&gt; during phase 3
 * we now have all the data we need for construction
 */
export interface ISection extends ISectionPartial {
  /** position on pdf page for placement in final pdf document */
  y: number
  /** buffer that puppeteer created - page.pdf() */
  pdfBuffers: Buffer[]
  /** pdf loaded from the buffer via pdf-lib */
  pdfs: PDFDocument[]
}

/** metadata for &lt;page-body&gt; */
export interface IBody {
  /** how much space &lt;page-body&gt; has left (doc height - header - footer) */
  height: number
  /** position on pdf page for placement in final pdf document */
  y: number
  /** buffer that puppeteer created - page.pdf() */
  pdfBuffer: Buffer
  /** pdf loaded from the buffer via pdf-lib */
  pdf: PDFDocument
}

/**
 * metadata for &lt;document-page&gt; during phase 1 od data collection
 * here we only know the position of &lt;document-page&gt; in the DOM
 */
export interface IDocumentPagePhase1 {
  /** position of &lt;document-page&gt; in the DOM */
  index: number
  /** template defined width of the pdf document */
  width: number
  /** template defined height of the pdf document */
  height: number
}

/**
 * metadata for &lt;document-page&gt; during phase 2 od data collection
 * here we know the width and the height od the document page
 * so we can set the viewport for puppeteer
 *
 * we can now collect all of the metadata for repeating sections
 * which includes their height (which we read from the dom)
 * and we can fully construct the body section and get # of pages
 */
export interface IDocumentPagePhase2 extends IDocumentPagePhase1 {
  /** medatada for &lt;page-header&gt; of this &lt;document-page&gt; */
  header: ISectionPartial
  /** medatada for &lt;page-footer&gt; of this &lt;document-page&gt; */
  footer: ISectionPartial
  /** medatada for &lt;page-background&gt; of this &lt;document-page&gt; */
  background: ISectionPartial
  /** medatada for &lt;page-body&gt; of this &lt;document-page&gt; */
  body: IBody
  /** number of pages this &lt;document-page&gt; has */
  pageCount: number
  /** starting page number for this &lt;document-page&gt; */
  pageOffset: number
}

/**
 * metadata for &lt;document-page&gt; during phase 3 od data collection
 * here we know total pages count so we can inject it
 *
 * we can now fully construct repeating sections
 */
export interface IDocumentPagePhase3 extends IDocumentPagePhase2 {
  /** medatada for &lt;page-header&gt; of this &lt;document-page&gt; */
  header: ISection
  /** medatada for &lt;page-footer&gt; of this &lt;document-page&gt; */
  footer: ISection
  /** medatada for &lt;page-background&gt; of this &lt;document-page&gt; */
  background: ISection
  /** pdf loaded from the buffer via pdf-lib */
  // pdf?: PDFDocument
  /** buffer that puppeteer created - page.pdf() */
  // pdfBuffer?: Buffer
}

export interface IPDFGeneratorOpts {
  debug?: boolean
  debugFilename?: string
  keepAlive?: boolean
}

// type ae = Prettify<ISectionPhase2>

// type Prettify<T> = {
//   [K in keyof T]: T[K]
// } & {}
