/**
 * @jest-environment jest-environment-node
 */
import puppeteer, { type Browser } from 'puppeteer';
import DeclarativePDF from '@app/index';
import fs from 'fs';
import writeBuffer from '@app/utils/writeBuffer.js';
import ComparePdf from 'compare-pdf';

jest.useRealTimers();
jest.setTimeout(60_000);

const config = {
  paths: {
    actualPdfRootFolder: process.cwd() + '/test/data/actualPdfs',
    baselinePdfRootFolder: process.cwd() + '/test/data/baselinePdfs',
    actualPngRootFolder: process.cwd() + '/test/data/actualPngs',
    baselinePngRootFolder: process.cwd() + '/test/data/baselinePngs',
    diffPngRootFolder: process.cwd() + '/test/data/diffPngs',
  },
  settings: {
    imageEngine: 'graphicsMagick',
    density: 100,
    quality: 70,
    tolerance: 0,
    threshold: 0.05,
    cleanPngPaths: true,
    matchPageCount: true,
    disableFontFace: true,
    verbosity: 0,
  },
};

let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    pipe: true,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-web-security',
      '--font-render-hinting=none',
    ],
  });
});

afterAll(async () => {
  await browser.close();
});

describe('PDF visual regression test', () => {
  test('standard template', async () => {
    const html = fs.readFileSync(`./test/examples/standard.html`, {
      encoding: 'utf8',
    });
    const declarativePDF = new DeclarativePDF(browser);
    const actualPdfBuffer = await declarativePDF.generate(html);
    await writeBuffer(
      actualPdfBuffer,
      `${config.paths.actualPdfRootFolder}/standard.pdf`
    );

    const comparePdf = new ComparePdf(config);
    const result = await comparePdf
      .actualPdfFile('standard.pdf')
      .baselinePdfFile('standard.pdf')
      .compare();
    expect(result?.status).toBe('passed');
  });

  test('elegant template', async () => {
    const html = fs.readFileSync(`./test/examples/elegant.html`, {
      encoding: 'utf8',
    });
    const declarativePDF = new DeclarativePDF(browser);
    const actualPdfBuffer = await declarativePDF.generate(html);
    await writeBuffer(
      actualPdfBuffer,
      `${config.paths.actualPdfRootFolder}/elegant.pdf`
    );

    const comparePdf = new ComparePdf(config);
    const result = await comparePdf
      .actualPdfFile('elegant.pdf')
      .baselinePdfFile('elegant.pdf')
      .compare();
    expect(result?.status).toBe('passed');
  });
});
