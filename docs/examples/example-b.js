import puppeteer from 'puppeteer';
import DeclarativePDF from '../../dist/index.js';
import {read, write} from './utils.js';

(async () => {
  const html = await read('example-b.html');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = new DeclarativePDF(browser);
  const pdfBuffer = await pdf.generate(page);
  await write('example-b.pdf', pdfBuffer);

  await browser.close();
})();
