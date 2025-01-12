import puppeteer from 'puppeteer';
import DeclarativePDF from '../../dist/index.js';
import {read, write} from './utils.js';

(async () => {
  const browser = await puppeteer.launch();
  const pdf = new DeclarativePDF(browser);

  for (const name of ['a4-72-multipage', 'a4-72-standard', 'a4-297-standard']) {
    const html = await read(`${name}.html`);
    const pdfBuffer = await pdf.generate(html);

    await write(`${name}.pdf`, pdfBuffer);
  }

  await browser.close();
})();
