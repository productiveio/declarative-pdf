import puppeteer from 'puppeteer';
import DeclarativePDF from '../../dist/index.js';
import {read, write} from './utils.js';

// Demonstrates the `dynamic-header` attribute: the first page's header can be
// taller (QR block above the company header) while later pages keep a normal
// header flush to the body — no reserved gap. Build first with `pnpm build:lib`.
(async () => {
  const html = await read('dynamic-header.html');
  const browser = await puppeteer.launch();

  const pdf = new DeclarativePDF(browser);
  const pdfBuffer = await pdf.generate(html);
  await write('dynamic-header.pdf', pdfBuffer);

  await browser.close();
})();
