/**
 * @jest-environment node
 */
import {PDFDocument} from 'pdf-lib';
import {BodyElement} from '@app/models/element';
import {buildPages} from '@app/utils/layout/build-pages';
import {createPageLayoutSettings} from '@app/utils/layout/create-page-layout-settings';

import type {SectionSetting} from '@app/evaluators/section-settings';
import type HTMLAdapter from '@app/utils/adapter-puppeteer';

/**
 * We are mocking the pdf Buffer in the test, so PDFDocument.load()
 * would throw an error because it expects the proper pdf buffer.
 * We can mock the pdf-lib module to avoid this error.
 */
jest.mock('pdf-lib', () => {
  const mockDocument = {
    embedPdf: jest.fn().mockResolvedValue([{}]),
    getPageCount: () => 1,
    getPageIndices: () => [0],
    getPage: () => ({}),
    copyPages: () => [],
  };

  const mockPage = {
    get doc() {
      return mockDocument;
    },
    drawPage: jest.fn(),
  };

  return {
    PDFDocument: {
      load: jest.fn().mockResolvedValue(mockDocument),
      create: jest.fn().mockResolvedValue({
        ...mockDocument,
        addPage: jest.fn().mockReturnValue(mockPage),
      }),
    },
  };
});

type MockSectionSettingOpts = Partial<SectionSetting>;

interface MockLayoutOpts {
  settings?: {
    headers?: SectionSetting[];
    footers?: SectionSetting[];
    backgrounds?: SectionSetting[];
  };
  height?: number;
  width?: number;
  bodyHeightMinimumFactor?: number;
  pageCount?: number;
}

interface MockBuildPagesOpts {
  documentPageIndex?: number;
  pageCountOffset?: number;
  totalPagesNumber?: number;
  layout?: MockLayoutOpts;
}

describe('buildPages', () => {
  const mockHTML = () =>
    ({
      prepareSection: jest.fn(),
      pdf: jest.fn().mockResolvedValue(new Uint8Array()),
      resetVisibility: jest.fn(),
    }) as unknown as HTMLAdapter;

  const mockSectionSetting = (opts?: MockSectionSettingOpts) =>
    ({
      height: 50,
      hasCurrentPageNumber: false,
      hasTotalPagesNumber: false,
      ...opts,
    }) as SectionSetting;

  const mockBodyElement = async () => {
    return new BodyElement({
      buffer: Buffer.from(''),
      pdf: await PDFDocument.create(),
      layout: {
        width: 200,
        height: 200,
        x: 0,
        y: 0,
      },
    });
  };

  const mockLayout = (opts?: MockLayoutOpts) => {
    const layout = createPageLayoutSettings(
      {
        headers: [],
        footers: [],
        backgrounds: [],
        ...opts?.settings,
      },
      {
        pageHeight: opts?.height ?? 200,
        pageWidth: opts?.width ?? 200,
        bodyHeightMinimumFactor: opts?.bodyHeightMinimumFactor ?? 1 / 3,
      }
    );
    if (opts?.pageCount) layout.pageCount = opts.pageCount;
    return layout;
  };

  const mockBuildPagesOpts = async (opts?: MockBuildPagesOpts) => {
    const html = mockHTML();
    const target = await PDFDocument.create();
    const body = await mockBodyElement();
    const layout = mockLayout(opts?.layout);

    return {
      documentPageIndex: opts?.documentPageIndex ?? 0,
      pageCountOffset: opts?.pageCountOffset ?? 0,
      totalPagesNumber: opts?.totalPagesNumber ?? 0,
      layout,
      body,
      target,
      html,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws error when document page has no pages', async () => {
    const opts = await mockBuildPagesOpts();

    await expect(buildPages(opts)).rejects.toThrow('Document page has no pages');
  });

  test('throws error when target PDF is not provided', async () => {
    const opts = await mockBuildPagesOpts({
      totalPagesNumber: 1,
      layout: {pageCount: 1},
    });
    // @ts-expect-error Mocking missing property
    opts.target = undefined;

    await expect(buildPages(opts)).rejects.toThrow('No target PDF document provided');
  });

  test('creates correct number of pages without settings', async () => {
    const opts = await mockBuildPagesOpts({
      totalPagesNumber: 2,
      layout: {pageCount: 2},
    });

    const {pages, elements} = await buildPages(opts);
    expect(pages).toHaveLength(0);
    expect(elements).toHaveLength(0);
  });

  test('calculates correct page numbers with offset', async () => {
    const header = mockSectionSetting();
    const opts = await mockBuildPagesOpts({
      documentPageIndex: 1,
      pageCountOffset: 2,
      totalPagesNumber: 4,
      layout: {
        settings: {
          headers: [header],
        },
        pageCount: 2,
      },
    });

    const {pages} = await buildPages(opts);
    expect(pages[0].currentPageNumber).toBe(3);
    expect(pages[1].currentPageNumber).toBe(4);
  });

  test('reuses existing section elements when possible', async () => {
    const header = mockSectionSetting();
    const footer = mockSectionSetting({hasCurrentPageNumber: true});
    const background = mockSectionSetting();

    const opts = await mockBuildPagesOpts({
      layout: {
        settings: {
          headers: [header],
          footers: [footer],
          backgrounds: [background],
        },
        pageCount: 2,
      },
      documentPageIndex: 1,
      pageCountOffset: 2,
      totalPagesNumber: 4,
    });

    const {pages, elements} = await buildPages(opts);

    expect(elements).toHaveLength(4);
    expect(pages[0].header).toBe(elements[0]);
    expect(pages[0].footer).toBe(elements[1]);
    expect(pages[0].background).toBe(elements[2]);
    expect(pages[1].header).toBe(elements[0]);
    expect(pages[1].footer).toBe(elements[3]);
    expect(pages[1].background).toBe(elements[2]);

    expect(PDFDocument.load).toHaveBeenCalledTimes(4);
    expect(opts.html.prepareSection).toHaveBeenCalledTimes(4);
    expect(opts.html.pdf).toHaveBeenCalledTimes(4);
  });
});
