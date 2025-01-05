/**
 * @jest-environment jsdom
 */
import evalSectionSettings from '@app/evaluators/section-settings';
import Variant from '@app/consts/physical-page';

jest.mock('puppeteer');
jest.mock('jsdom');

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

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
  if (originalOffsetHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);

  if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
});

describe('evalSectionSettings', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns empty settings object when no document-page elements exist', () => {
    const result = evalSectionSettings(0);
    expect(result).toEqual({
      headers: [],
      footers: [],
      backgrounds: [],
    });
  });

  test('returns empty settings object when specified index does not exist', () => {
    document.body.innerHTML = `
      <document-page> ... </document-page>
    `;
    const result = evalSectionSettings(1);
    expect(result).toEqual({
      headers: [],
      footers: [],
      backgrounds: [],
    });
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
            <span class="total-pages"> ... </span>
            <span class="page-number"> ... </span>
          </physical-page>
        </page-footer>
        <page-background>
          <physical-page> ... </physical-page>
          <physical-page select="invalid"> ... </physical-page>
        </page-background>
      </document-page>
    `;
    const result = evalSectionSettings(0);

    expect(result).toEqual({
      headers: [
        {
          height: 20,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
          physicalPageIndex: undefined,
          physicalPageType: undefined,
        },
      ],
      footers: [
        {
          height: 20,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
          physicalPageIndex: 0,
          physicalPageType: Variant.FIRST,
        },
        {
          height: 20,
          hasCurrentPageNumber: true,
          hasTotalPagesNumber: false,
          physicalPageIndex: 1,
          physicalPageType: Variant.LAST,
        },
        {
          height: 20,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: true,
          physicalPageIndex: 2,
          physicalPageType: Variant.EVEN,
        },
        {
          height: 20,
          hasCurrentPageNumber: true,
          hasTotalPagesNumber: true,
          physicalPageIndex: 3,
          physicalPageType: Variant.ODD,
        },
      ],
      backgrounds: [
        {
          height: 20,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
          physicalPageIndex: 0,
          physicalPageType: Variant.DEFAULT,
        },
        {
          height: 20,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
          physicalPageIndex: 1,
          physicalPageType: Variant.DEFAULT,
        },
      ],
    });
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
    const result = evalSectionSettings(0);
    expect(result).toEqual({
      headers: [],
      footers: [
        {
          height: 20,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
          physicalPageIndex: 0,
          physicalPageType: Variant.DEFAULT,
        },
      ],
      backgrounds: [],
    });
  });
});
