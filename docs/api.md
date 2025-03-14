# API Reference

The main class for generating PDFs from HTML templates.

## Table of contents

- [Constructor](#constructor)
  - [Parameters](#parameters)
- [Methods](#methods)
  - [generate()](#generate)
    - [Parameters](#parameters)
    - [Returns](#returns)
    - [Behavior](#behavior)
    - [Example](#example)

## Constructor

```typescript
constructor(browser: MinimumBrowser, opts?: DeclarativePDFOpts)
```

### Parameters

- `browser` - a puppeteer browser instance that must be initialized and ready to use (must have `newPage()` and `close()` methods and `connected` getter)
- `opts` - optional configuration object

```typescript
export interface DocumentMeta {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface DocumentOptions {
  /** If exists, will be used to set available metadata fields on the pdf document */
  meta?: DocumentMeta;
  /**
   * Controls the minimum space the body section must occupy on each page.
   * Value is a decimal factor of the total page height (0.0 to 1.0).
   * - Default: 1/3 (a third of the page)
   * - Example: 0.25 means body must be at least 25% of page height
   */
  bodyHeightMinimumFactor?: number;
}

interface DeclarativePDFOpts {
  /** Normalize HTML content options */
  normalize?: {
    /** Add 'pdf' to document body classList (default: true) */
    addPdfClass?: boolean;
    /** Set document body margin to 0 (default: true) */
    setBodyMargin?: boolean;
    /** Set document body padding to 0 (default: true) */
    setBodyPadding?: boolean;
    /** Set document body background to transparent (default: true) */
    setBodyTransparent?: boolean;
    /** Remove any body child that is not 'document-page', 'script' or 'style' (default: true) */
    normalizeBody?: boolean;
    /** Remove any document-page child that is not 'document-page', 'script' or 'style' (default: true) */
    normalizeDocumentPage?: boolean;
  };

  /** Paper defaults override (A4 / 72ppi by default) */
  defaults?:
    /** You can either define a width and height in px */
    | {
        width?: number;
        height?: number;
      }
    /** Or you can give it a format/ppi combination
     * and let the lib calculate width and height */
    | {
        format?: 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'letter' | 'legal' | 'tabloid' | 'ledger';
        ppi?: number;
      };

  /** Debug options */
  debug?: {
    /** Enable time logging (default: false) */
    timeLog?: boolean;
    /** Name to use in time log header (default: PDF) */
    pdfName?: string;
    /** Attach generated PDF segments for debugging (default: false) */
    attachSegments?: boolean;
  };

  /** Override for pdf document metadata and rules */
  document?: DocumentOptions;
}
```

## Methods

There is only one public method in the class.

### generate()

```typescript
async generate(input: string | MinimumPage): Promise<Buffer>
```

#### Parameters

- `input` - either:
  - a string containing the HTML content to generate the PDF from
  - a Puppeteer page instance (must have `setContent()`, `setViewport()`, `evaluate()`, `pdf()`, `close()`, and `isClosed()` methods)

#### Returns

- `Promise<Buffer>` - the generated PDF as a buffer

#### Behavior

1. if input is string:
    - opens new browser tab
    - sets content and normalizes it
    - closes tab after completion
2. if input is page:
    - uses provided page directly
    - does not close the page after completion
3. in both cases:
    - parses document pages from template
    - creates layouts and sections
    - generates final PDF
    - attaches debug information if enabled

#### Example

```typescript
import puppeteer from 'puppeteer';
import DeclarativePDF from 'declarative-pdf';

const browser = await puppeteer.launch();
const pdf = new DeclarativePDF(browser, {
  debug: {timeLog: true},
  document: {meta: {title: 'Document title'}}
});

// From string
const buffer = await pdf.generate('<html>...</html>');

// From page
const page = await browser.newPage();
await page.setContent('<html>...</html>');
const buffer = await pdf.generate(page);

// Don't forget to release the resources
await browser.close();
```
