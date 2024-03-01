/**
 * @jest-environment jsdom
 */
import evalGetDocumentPageSettings from '../../src/evaluators/evalGetDocumentPageSettings';
import { config } from '../../src/config';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalGetDocumentPageSettings', () => {
  test('it works', () => {
    document.body.innerHTML = `
      <document-page format="letter"> ... </document-page>
      <document-page format="a4" ppi="300"> ... </document-page>
      <document-page size="600x800"> ... </document-page>
      <document-page> ... </document-page>
    `;
    const result = evalGetDocumentPageSettings(config.paper);

    expect(result).toEqual([
      { index: 0, width: 612, height: 791 },
      { index: 1, width: 2480, height: 3508 },
      { index: 2, width: 600, height: 800 },
      { index: 3, width: 595, height: 842 },
    ]);
  });
});
