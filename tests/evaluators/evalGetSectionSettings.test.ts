/**
 * @jest-environment jsdom
 */
import evalGetSectionSettings from '../../src/evaluators/evalGetSectionSettings';
import { config } from '../../src/config';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalGetSectionSettings', () => {
  test('it works', () => {
    document.body.innerHTML = `
      <document-page format="letter">
        <page-background> ... </page-background>
        <page-header>
          <total-pages-number></total-pages-number>
        </page-header>
        <page-body> ... </page-body>
        <page-footer>
          <current-page-number></current-page-number>
        </page-footer>
      </document-page>
    `;

    // in tests, HTMLElement.clientHeight is 0, so we need to mock it
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 20,
    });

    const result = evalGetSectionSettings(
      JSON.stringify(config.paper),
      JSON.stringify({ index: 0, width: 612, height: 791 })
    );

    expect(result).toEqual({
      index: 0,
      width: 612,
      height: 791,
      header: {
        height: 20,
        hasPageNumber: true,
        collection: [],
      },
      footer: {
        height: 20,
        hasPageNumber: true,
        collection: [],
      },
      background: {
        height: 791,
        hasPageNumber: false,
        collection: [],
      },
    });
  });

  test('it works with physical pages', () => {
    document.body.innerHTML = `
      <document-page>
        <page-background>
          <physical-page select="first"> ... </physical-page>
          <physical-page> ... </physical-page>
          <physical-page select="last"> ... </physical-page>
        </page-background>
        <page-header>
          <physical-page select="first"> ... </physical-page>
          <physical-page> ... </physical-page>
          <physical-page select="last"> ... </physical-page>
        </page-header>
        <page-body> ... </page-body>
        <page-footer>
          <physical-page select="first"> ... </physical-page>
          <physical-page> ... </physical-page>
          <physical-page select="last"> ... </physical-page>
        </page-footer>
      </document-page>
    `;

    // in tests, HTMLElement.clientHeight is 0, so we need to mock it
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 20,
    });

    const result = evalGetSectionSettings(
      JSON.stringify(config.paper),
      JSON.stringify({ index: 0, width: 595, height: 842 })
    );

    expect(result).toEqual({
      index: 0,
      width: 595,
      height: 842,
      header: {
        height: -20, // this is because of mocking -> everything is 20, so math works
        hasPageNumber: false,
        collection: [
          { index: 0, height: 20, type: 'first' },
          { index: 1, height: 20, type: 'default' },
          { index: 2, height: 20, type: 'last' },
        ],
      },
      footer: {
        height: -20, // this is because of mocking -> everything is 20, so math works
        hasPageNumber: false,
        collection: [
          { index: 0, height: 20, type: 'first' },
          { index: 1, height: 20, type: 'default' },
          { index: 2, height: 20, type: 'last' },
        ],
      },
      background: {
        height: 842,
        hasPageNumber: false,
        collection: [
          { index: 0, height: 20, type: 'first' },
          { index: 1, height: 20, type: 'default' },
          { index: 2, height: 20, type: 'last' },
        ],
      },
    });
  });
});
