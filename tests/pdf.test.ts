/**
 * @jest-environment jest-environment-node
 */
import generate from '../src/index';
import fs from 'fs';
import writeBuffer from '../src/utils/writeBuffer.js';
import ComparePdf from 'compare-pdf';

jest.useRealTimers();
jest.setTimeout(60_000);

const config = {
  paths: {
    actualPdfRootFolder: process.cwd() + '/tests/data/actualPdfs',
    baselinePdfRootFolder: process.cwd() + '/tests/data/baselinePdfs',
    actualPngRootFolder: process.cwd() + '/tests/data/actualPngs',
    baselinePngRootFolder: process.cwd() + '/tests/data/baselinePngs',
    diffPngRootFolder: process.cwd() + '/tests/data/diffPngs',
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

describe('PDF visual regression test', () => {
  test('standard template', async () => {
    const html = fs.readFileSync(`./tests/examples/standard.html`, {
      encoding: 'utf8',
    });
    const actualPdfBuffer = await generate(html);
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
    const html = fs.readFileSync(`./tests/examples/elegant.html`, {
      encoding: 'utf8',
    });
    const actualPdfBuffer = await generate(html);
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
