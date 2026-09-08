import puppeteer from 'puppeteer';
import DeclarativePDF from '../../dist/index.js';
import {read, write} from './utils.js';

// Links in the body and in repeating sections stay clickable in the generated PDF.
// Open the output and click through: the footer link repeats on both pages, and the
// body links land on the page they were rendered on. Build first with `pnpm build:lib`.
(async () => {
  const html = await read('links.html');
  const browser = await puppeteer.launch();

  const pdf = new DeclarativePDF(browser);
  const pdfBuffer = await pdf.generate(html);
  await write('links.pdf', pdfBuffer);

  await browser.close();
})();
