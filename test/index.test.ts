/**
 * @jest-environment node
 */
import fs from 'fs';
import puppeteer, {type Browser, type Page} from 'puppeteer';
import DeclarativePDF from '@app/index';
import HTMLAdapter from '@app/utils/adapter-puppeteer';
import {PaperDefaults} from '@app/utils/paper-defaults';
import {PDFDocument} from 'pdf-lib';

describe('DeclarativePDF', () => {
  let browser: Browser;
  let testHtml: string;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      pipe: true,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--font-render-hinting=none'],
    });
    testHtml = fs.readFileSync('./test/examples/standard.html', {encoding: 'utf8'});
  });

  afterAll(async () => {
    await browser.close();
  });

  test('initializes with default options', () => {
    const pdf = new DeclarativePDF(browser);

    expect(pdf.html).toBeInstanceOf(HTMLAdapter);
    expect(pdf.defaults).toBeInstanceOf(PaperDefaults);
    expect(pdf.debug).toEqual({});
    expect(pdf.documentPages).toEqual([]);
  });

  test('initializes with custom options', () => {
    const pdf = new DeclarativePDF(browser, {
      defaults: {width: 100, height: 200},
      debug: {timeLog: true},
    });

    expect(pdf.html).toBeInstanceOf(HTMLAdapter);
    expect(pdf.defaults).toBeInstanceOf(PaperDefaults);
    expect(pdf.defaults.width).toEqual(100);
    expect(pdf.defaults.height).toEqual(200);
    expect(pdf.debug).toEqual({timeLog: true});
    expect(pdf.documentPages).toEqual([]);
  });

  test('initializes with debugging options', () => {
    const pdf = new DeclarativePDF(browser, {
      debug: {timeLog: true},
    });

    expect(pdf.html).toBeInstanceOf(HTMLAdapter);
    expect(pdf.defaults).toBeInstanceOf(PaperDefaults);
    expect(pdf.debug).toEqual({timeLog: true});
    expect(pdf.documentPages).toEqual([]);
  });

  test('builds a PDF from string', async () => {
    const pdf = new DeclarativePDF(browser);
    const buffer = await pdf.generate(testHtml);

    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('builds a PDF from string with valid template and without normalization', async () => {
    const pdf = new DeclarativePDF(browser, {
      normalize: {
        addPdfClass: false,
        setBodyMargin: false,
        setBodyPadding: false,
        setBodyTransparent: false,
        normalizeBody: false,
        normalizeDocumentPage: false,
      },
    });
    const buffer = await pdf.generate(testHtml);

    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('builds multiple PDFs from string in single instance', async () => {
    const pdf = new DeclarativePDF(browser);
    const buffer1 = await pdf.generate(testHtml);
    const buffer2 = await pdf.generate(testHtml);

    expect(buffer1).toBeInstanceOf(Buffer);
    expect(buffer2).toBeInstanceOf(Buffer);
  });

  test('builds a PDF from Page', async () => {
    // spy on console.log
    const pdf = new DeclarativePDF(browser, {debug: {timeLog: true}});
    const page = await browser.newPage();
    await page.setContent(testHtml);
    const buffer = await pdf.generate(page);
    await page.close();

    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('builds multiple PDFs from Page in single instance', async () => {
    const pdf = new DeclarativePDF(browser);
    const page = await browser.newPage();
    await page.setContent(testHtml);
    const buffer1 = await pdf.generate(page);
    const buffer2 = await pdf.generate(page);
    await page.close();

    expect(buffer1).toBeInstanceOf(Buffer);
    expect(buffer2).toBeInstanceOf(Buffer);
  });

  test('builds a PDF and reports on time log', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const pdf = new DeclarativePDF(browser, {debug: {timeLog: true, pdfName: 'Test PDF', attachSegments: true}});
    const buffer = await pdf.generate(testHtml);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  test('builds a PDF from body only', async () => {
    const pdf = new DeclarativePDF(browser);
    const buffer = await pdf.generate('<html><body><h1>Test</h1></body></html>');

    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('throws an error if the browser is faulty', () => {
    const fakeBrowser = {} as unknown as Browser;
    const pdf = new DeclarativePDF(fakeBrowser);

    expect(() => pdf.generate(testHtml)).rejects.toThrow('Browser not connected');
  });

  test('throws an error if the page is faulty', async () => {
    const pdf = new DeclarativePDF(browser);
    const page = {} as unknown as Page;

    expect(() => pdf.generate(page)).rejects.toThrow('this._page.isClosed is not a function');
  });

  test('throws an error if the template is faulty', async () => {
    const pdf = new DeclarativePDF(browser);
    const faultyHtml = '<html><body></body></html>';
    const closeSpy = jest.spyOn(pdf.html, 'close');

    await expect(pdf.generate(faultyHtml)).rejects.toThrow('No document pages found');
    expect(closeSpy).toHaveBeenCalled();

    closeSpy.mockRestore();
  });

  test('throws an error in a shitshow, but is able to continue in the same instance', async () => {
    const pdf = new DeclarativePDF(browser);

    await expect(pdf.generate('')).rejects.toThrow();
    const page = await browser.newPage();
    await expect(pdf.generate(page)).rejects.toThrow();
    await page.close();

    const buffer = await pdf.generate(testHtml);
    expect(buffer).toBeInstanceOf(Buffer);

    const page2 = await browser.newPage();
    await page2.setContent(testHtml);
    const buffer2 = await pdf.generate(page2);
    await page2.close();
    expect(buffer2).toBeInstanceOf(Buffer);
  });

  test('initializes with a custom document title', async () => {
    const customTitle = 'Test Document Title';
    const pdf = new DeclarativePDF(browser, {
      documentTitle: customTitle,
    });

    const buffer = await pdf.generate(testHtml);

    const generatedPdf = await PDFDocument.load(buffer);

    expect(generatedPdf.getTitle()).toBe(customTitle);
  });
});
