/**
 * @jest-environment jsdom
 */
import evalTemplateSettings from '@app/evaluators/template-settings';
import {PAPER_SIZE} from '@app/consts/paper-size';
import {DEFAULT_HEIGHT, DEFAULT_WIDTH, DEFAULT_PPI} from '@app/utils/paper-defaults';

const templateDefaults = {
  default: {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    ppi: DEFAULT_PPI,
  },
  size: PAPER_SIZE,
};

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalTemplateSettings', () => {
  test('it returns empty array when no document-page elements are found', () => {
    document.body.innerHTML = '';
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([]);
  });

  test('it works with valid document-page elements', () => {
    document.body.innerHTML = `
      <document-page format="letter"> ... </document-page>
      <document-page format="a4" ppi="300"> ... </document-page>
      <document-page size="600x800"> ... </document-page>
      <document-page> ... </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 612,
        height: 791,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 1,
        width: 2480,
        height: 3508,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 2,
        width: 600,
        height: 800,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 3,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
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
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 1,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 2,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 3,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 4,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 5,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
      {
        index: 6,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
    ]);
  });

  test('it defaults to A4 when width is invalid', () => {
    document.body.innerHTML = `
      <document-page size="invalidx800"> ... </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
    ]);
  });

  test('it defaults A4 height to width when height is invalid', () => {
    document.body.innerHTML = `
      <document-page size="600xinvalid"> ... </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 600,
        height: 600,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
    ]);
  });

  test('it uses format and ppi before size', () => {
    document.body.innerHTML = `
      <document-page format="letter" size="600x800"> ... </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 612,
        height: 791,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
    ]);
  });

  test('it fallbacks to size if format is invalid', () => {
    document.body.innerHTML = `
      <document-page format="invalid" size="600x800"> ... </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 600,
        height: 800,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
    ]);
  });

  test('it correctly reads page-body margins', () => {
    document.body.innerHTML = `
      <document-page>
        <page-body style="margin-top: 10px; margin-bottom: 20px"> ... </page-body>
      </document-page>
      <document-page>
        <page-body style="margin-top: 30px; margin-bottom: 40px"> ... </page-body>
      </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 595,
        height: 842,
        bodyMarginTop: 10,
        bodyMarginBottom: 20,
        hasSections: false,
      },
      {
        index: 1,
        width: 595,
        height: 842,
        bodyMarginTop: 30,
        bodyMarginBottom: 40,
        hasSections: false,
      },
    ]);
  });

  test('it correctly detects sections', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header> ... </page-header>
        <page-footer> ... </page-footer>
        <page-background> ... </page-background>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-header> ... </page-header>
        <page-footer> ... </page-footer>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-header> ... </page-header>
        <page-background> ... </page-background>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-footer> ... </page-footer>
        <page-background> ... </page-background>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-header> ... </page-header>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-footer> ... </page-footer>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-background> ... </page-background>
        <page-body> ... </page-body>
      </document-page>
      <document-page>
        <page-body> ... </page-body>
      </document-page>
    `;
    const result = evalTemplateSettings(templateDefaults);

    expect(result).toEqual([
      {
        index: 0,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 1,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 2,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 3,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 4,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 5,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 6,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: true,
      },
      {
        index: 7,
        width: 595,
        height: 842,
        bodyMarginTop: 0,
        bodyMarginBottom: 0,
        hasSections: false,
      },
    ]);
  });
});
