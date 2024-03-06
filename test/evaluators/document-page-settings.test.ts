/**
 * @jest-environment jsdom
 */
import evalDocumentPageSettings from '@app/evaluators/document-page-settings';
import Variant from '@app/consts/physical-page.js';

jest.mock('puppeteer');
jest.mock('jsdom');

const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetHeight'
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetWidth'
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 20,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 20,
  });
});

afterAll(() => {
  if (originalOffsetHeight)
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetHeight',
      originalOffsetHeight
    );

  if (originalOffsetWidth)
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth
    );
});

describe('evalDocumentPageSettings', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns empty array when no document-page elements exist', () => {
    const result = evalDocumentPageSettings(0);
    expect(result).toEqual([]);
  });

  test('returns empty array when specified index does not exist', () => {
    document.body.innerHTML = `
      <document-page> ... </document-page>
    `;
    const result = evalDocumentPageSettings(1);
    expect(result).toEqual([]);
  });

  test('returns settings for each section', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header> ... </page-header>
        <page-footer>
          <physical-page select="first"> ... </physical-page>
          <physical-page select="last">
            <current-page-number> ... </current-page-number>
          </physical-page>
          <physical-page select="even">
            <total-pages-number> ... </total-pages-number>
          </physical-page>
          <physical-page select="odd">
            <current-page-number> ... </current-page-number>
            <total-pages-number> ... </total-pages-number>
          </physical-page>
        </page-footer>
        <page-background>
          <physical-page> ... </physical-page>
          <physical-page select="invalid"> ... </physical-page>
        </page-background>
      </document-page>
    `;
    const result = evalDocumentPageSettings(0);

    console.log(Variant);
    expect(result).toEqual([
      {
        index: 0,
        type: 'header',
        height: 20,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: false,
        subSelector: undefined,
      },
      {
        index: 0,
        type: 'footer',
        height: 20,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: false,
        subSelector: Variant.FIRST,
      },
      {
        index: 1,
        type: 'footer',
        height: 20,
        hasCurrentPageNumber: true,
        hasTotalPagesNumber: false,
        subSelector: Variant.LAST,
      },
      {
        index: 2,
        type: 'footer',
        height: 20,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: true,
        subSelector: Variant.EVEN,
      },
      {
        index: 3,
        type: 'footer',
        height: 20,
        hasCurrentPageNumber: true,
        hasTotalPagesNumber: true,
        subSelector: Variant.ODD,
      },
      {
        index: 0,
        type: 'background',
        height: 20,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: false,
        subSelector: Variant.DEFAULT,
      },
      {
        index: 1,
        type: 'background',
        height: 20,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: false,
        subSelector: Variant.DEFAULT,
      },
    ]);
  });

  test('it ignores outside elements when physical-page exists', () => {
    document.body.innerHTML = `
      <document-page>
        <page-footer>
          <physical-page> ... </physical-page>
          <current-page-number> ... </current-page-number>
          <div>
            <total-pages-number> ... </total-pages-number>
          </div>
        </page-footer>
      </document-page>
    `;
    const result = evalDocumentPageSettings(0);
    expect(result).toEqual([
      {
        index: 0,
        type: 'footer',
        height: 20,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: false,
        subSelector: Variant.DEFAULT,
      },
    ]);
  });
});
