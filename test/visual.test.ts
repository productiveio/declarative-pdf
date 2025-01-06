/**
 * @jest-environment jest-environment-node
 */
import puppeteer, {type Browser} from 'puppeteer';
import PDF from '@app/index';
import fs from 'fs';
import writeBuffer from '@app/utils/write-buffer';
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

const testRunner = async (htmlPath: string, pdfName: string) => {
  const html = fs.readFileSync(htmlPath, {
    encoding: 'utf8',
  });
  const debug = {
    timeLog: true,
    pdfName: pdfName === 'standard.pdf' ? undefined : pdfName,
    attachSegments: true,
  };
  const actualPdfBuffer = await new PDF(browser, {debug}).generate(html);
  await writeBuffer(actualPdfBuffer, `${config.paths.actualPdfRootFolder}/${pdfName}`);

  const comparePdf = new ComparePdf(config);
  const result = await comparePdf.actualPdfFile(pdfName).baselinePdfFile(pdfName).compare();

  expect(result?.status).toBe('passed');
};

let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    pipe: true,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--font-render-hinting=none'],
  });
});

afterAll(async () => {
  await browser.close();
});

describe('PDF visual regression test', () => {
  test('standard template', async () => {
    await testRunner('./test/examples/standard.html', `standard.pdf`);
  });

  test('elegant template', async () => {
    await testRunner('./test/examples/elegant.html', `elegant.pdf`);
  });

  test('a4 72 standard template', async () => {
    await testRunner('./test/examples/a4-72-standard.html', `a4-72-standard.pdf`);
  });

  test('a4 72 multipage template', async () => {
    await testRunner('./test/examples/a4-72-multipage.html', `a4-72-multipage.pdf`);
  });

  test.skip('a4 297 standard template', async () => {
    await testRunner('./test/examples/a4-297-standard.html', `a4-297-standard.pdf`);
  });
});
