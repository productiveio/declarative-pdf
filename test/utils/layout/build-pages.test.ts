/**
 * @jest-environment node
 */
import { buildPages } from '@app/utils/layout/build-pages';
import { createPageLayoutSettings } from '@app/utils/layout/create-page-layout';

import type { SectionSetting } from '@app/evaluators/section-settings';
import type { BodyElement } from '@app/models/element';
import type HTMLAdapter from '@app/utils/adapter-puppeteer';
import { PDFDocument } from 'pdf-lib';

/**
 * We are mocking the pdf Buffer in the test, so PDFDocument.load()
 * would throw an error because it expects the proper pdf buffer.
 * We can mock the pdf-lib module to avoid this error.
 */
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn().mockResolvedValue({
      getPageCount: () => 1,
      getPage: () => ({}),
    }),
    create: jest.fn().mockResolvedValue({
      getPageCount: () => 1,
      getPage: () => ({}),
    }),
  },
}));

type MockSectionSettingOpts = Partial<SectionSetting>;

interface MockLayoutOpts {
  settings?: {
    headers?: SectionSetting[];
    footers?: SectionSetting[];
    backgrounds?: SectionSetting[];
  };
  height?: number;
  width?: number;
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

  const mockBodyElement = async () =>
    ({
      buffer: Buffer.from(''),
      pdf: await PDFDocument.create(),
    }) as BodyElement;

  const mockLayout = (opts?: MockLayoutOpts) => {
    const layout = createPageLayoutSettings(
      {
        headers: [],
        footers: [],
        backgrounds: [],
        ...opts?.settings,
      },
      opts?.height ?? 200,
      opts?.width ?? 200
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

  test('throws error when document page has no pages', async () => {
    const opts = await mockBuildPagesOpts();

    await expect(buildPages(opts)).rejects.toThrow(
      'Document page has no pages'
    );
  });

  test('creates correct number of pages without settings', async () => {
    const opts = await mockBuildPagesOpts({
      totalPagesNumber: 2,
      layout: { pageCount: 2 },
    });

    const { pages, elements } = await buildPages(opts);
    expect(pages).toHaveLength(2);
    expect(elements).toHaveLength(0);
    expect(pages[0]).toEqual({
      pageIndex: 0,
      currentPageNumber: 1,
      header: undefined,
      footer: undefined,
      background: undefined,
    });
    expect(pages[1]).toEqual({
      pageIndex: 1,
      currentPageNumber: 2,
      header: undefined,
      footer: undefined,
      background: undefined,
    });
  });

  test('calculates correct page numbers with offset', async () => {
    const opts = await mockBuildPagesOpts({
      documentPageIndex: 1,
      pageCountOffset: 2,
      totalPagesNumber: 4,
      layout: { pageCount: 2 },
    });

    const { pages } = await buildPages(opts);
    expect(pages[0].currentPageNumber).toBe(3);
    expect(pages[1].currentPageNumber).toBe(4);
  });

  test('reuses existing section elements when possible', async () => {
    const header = mockSectionSetting();
    const footer = mockSectionSetting({ hasCurrentPageNumber: true });
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

    const { pages, elements } = await buildPages(opts);

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
