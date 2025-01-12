import puppeteer from 'puppeteer';
import DeclarativePDF from '../../dist/index.js';
import {read, write} from './utils.js';

(async () => {
  const html = await read('example-simple.html');
  const browser = await puppeteer.launch();

  const pdf = new DeclarativePDF(browser);
  const pdfBuffer = await pdf.generate(html);
  await write('example-a.pdf', pdfBuffer);

  await browser.close();
})();
