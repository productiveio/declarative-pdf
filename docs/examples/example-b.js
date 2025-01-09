import puppeteer from 'puppeteer';
import DeclarativePDF from '../../dist/index.js';
import {read, write} from './utils.js';

(async () => {
  const html = await read('example-simple-bgcolor.html');
  const browser = await puppeteer.launch();

  const pdf = new DeclarativePDF(browser, {debug: {timeLog: true, attachSegments: true, pdfName: 'example-b.pdf'}});
  const pdfBuffer = await pdf.generate(html);
  await write('example-b.pdf', pdfBuffer);

  await browser.close();
})();
