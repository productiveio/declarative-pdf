/**
 * @jest-environment jsdom
 */
import evalTemplateSettings from '../../src/evaluators/template-settings';
import { config } from '../../src/config';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalTemplateSettings', () => {
  test('it works with valid document-page elements', () => {
    document.body.innerHTML = `
      <document-page format="letter"> ... </document-page>
      <document-page format="a4" ppi="300"> ... </document-page>
      <document-page size="600x800"> ... </document-page>
      <document-page> ... </document-page>
    `;
    const result = evalTemplateSettings(config.paper);

    expect(result).toEqual([
      { index: 0, width: 612, height: 791 },
      { index: 1, width: 2480, height: 3508 },
      { index: 2, width: 600, height: 800 },
      { index: 3, width: 595, height: 842 },
    ]);
  });

  test('it defaults to A4 when attributes are invalid', () => {
    document.body.innerHTML = `
      <document-page size="invalid"> ... </document-page>
      <document-page format="invalid"> ... </document-page>
      <document-page ppi="invalid"> ... </document-page>
      <document-page size="invalid" ppi="invalid"> ... </document-page>
      <document-page format="invalid" ppi="invalid"> ... </document-page>
      <document-page format="invalid" size="invalid"> ... </document-page>
      <document-page format="invalid" size="invalid" ppi="invalid"> ... </document-page>
    `;
    const result = evalTemplateSettings(config.paper);

    expect(result).toEqual([
      { index: 0, width: 595, height: 842 },
      { index: 1, width: 595, height: 842 },
      { index: 2, width: 595, height: 842 },
      { index: 3, width: 595, height: 842 },
      { index: 4, width: 595, height: 842 },
      { index: 5, width: 595, height: 842 },
      { index: 6, width: 595, height: 842 },
    ]);
  });

  test('it defaults to A4 when width is invalid', () => {
    document.body.innerHTML = `
      <document-page size="invalidx800"> ... </document-page>
    `;
    const result = evalTemplateSettings(config.paper);

    expect(result).toEqual([{ index: 0, width: 595, height: 842 }]);
  });

  test('it defaults A4 height to width when height is invalid', () => {
    document.body.innerHTML = `
      <document-page size="600xinvalid"> ... </document-page>
    `;
    const result = evalTemplateSettings(config.paper);

    expect(result).toEqual([{ index: 0, width: 600, height: 600 }]);
  });

  test('it uses format and ppi before size', () => {
    document.body.innerHTML = `
      <document-page format="letter" size="600x800"> ... </document-page>
    `;
    const result = evalTemplateSettings(config.paper);

    expect(result).toEqual([{ index: 0, width: 612, height: 791 }]);
  });

  test('it fallbacks to size if format is invalid', () => {
    document.body.innerHTML = `
      <document-page format="invalid" size="600x800"> ... </document-page>
    `;
    const result = evalTemplateSettings(config.paper);

    expect(result).toEqual([{ index: 0, width: 600, height: 800 }]);
  });
});
