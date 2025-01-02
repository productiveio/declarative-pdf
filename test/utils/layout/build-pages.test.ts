/**
 * @jest-environment node
 */
import { buildPages } from '@app/utils/layout/build-pages';
import { DocumentPage } from '@app/models/document-page';
import { SectionElement } from '@app/models/element';
import { createPageLayoutSettings } from '@app/utils/layout/create-page-layout';

import type { DocumentPageOpts } from '@app/models/document-page';

import type { SectionSetting } from '@app/evaluators/section-settings';
import type DeclarativePDF from '@app/index';

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
  },
}));

// parent
// - .html -> html adapter
// - .documentPages -> an array of all document pages
// - .totalPagesNumber -> a number

interface MockDocumentPageOpts {
  parent: DeclarativePDF;
  doc?: Partial<DocumentPageOpts>;
  settings?: {
    headers?: SectionSetting[];
    footers?: SectionSetting[];
    backgrounds?: SectionSetting[];
  };
  pageCount?: number;
}

describe('buildPages', () => {
  const mockParent = () =>
    ({
      html: {
        prepareSection: jest.fn(),
        pdf: jest.fn().mockResolvedValue(new Uint8Array()),
        resetVisibility: jest.fn(),
      },
      documentPages: [],
      totalPagesNumber: 0,
    }) as unknown as DeclarativePDF;

  const mockSectionSetting = (
    opts?: Partial<SectionSetting>
  ): SectionSetting => ({
    height: 100,
    hasCurrentPageNumber: false,
    hasTotalPagesNumber: false,
    ...opts,
  });

  const mockDocumentPage = (opts: MockDocumentPageOpts) => {
    const doc = new DocumentPage({
      parent: opts.parent,
      index: opts.parent.documentPages.length,
      width: 0,
      height: 0,
      bodyMarginTop: 0,
      bodyMarginBottom: 0,
      hasSections: false,
      ...opts.doc,
    });
    const settings = {
      headers: opts.settings?.headers ?? [],
      footers: opts.settings?.footers ?? [],
      backgrounds: opts.settings?.backgrounds ?? [],
    };
    const layout = createPageLayoutSettings(
      settings,
      opts.doc?.height ?? 0,
      opts.doc?.width ?? 0
    );
    doc.layout = layout;
    doc.layout.pageCount = opts.pageCount ?? 0;

    opts.parent.documentPages.push(doc);
    // @ts-expect-error - we are mocking this property
    opts.parent.totalPagesNumber += layout.pageCount;

    return doc;
  };

  test('throws error when document page has no pages', async () => {
    const parent = mockParent();
    const doc = mockDocumentPage({ parent });

    await expect(buildPages(doc)).rejects.toThrow('Document page has no pages');
  });

  test('creates correct number of pages', async () => {
    const parent = mockParent();
    const doc = mockDocumentPage({
      parent,
      doc: { width: 200, height: 200 },
      pageCount: 2,
    });
    const pages = await buildPages(doc);
    expect(pages).toHaveLength(2);
    expect(pages[0].pageIndex).toBe(0);
    expect(pages[1].pageIndex).toBe(1);
  });

  test('calculates correct page numbers with offset', async () => {
    const parent = mockParent();
    const doc1 = mockDocumentPage({
      parent,
      doc: { width: 200, height: 200 },
      pageCount: 2,
    });
    const doc2 = mockDocumentPage({
      parent,
      doc: { width: 200, height: 200 },
      pageCount: 2,
    });

    const pages1 = await buildPages(doc1);
    expect(pages1[0].currentPageNumber).toBe(1);
    expect(pages1[1].currentPageNumber).toBe(2);
    const pages2 = await buildPages(doc2);
    expect(pages2[0].currentPageNumber).toBe(3);
    expect(pages2[1].currentPageNumber).toBe(4);
  });

  test('reuses existing section elements', async () => {
    const parent = mockParent();
    const setting = mockSectionSetting();
    const doc = mockDocumentPage({
      parent,
      doc: { width: 200, height: 400 },
      settings: {
        headers: [setting],
        footers: [],
        backgrounds: [],
      },
      pageCount: 2,
    });
    const existingElement = new SectionElement({
      setting,
      buffer: Buffer.from([]),
      pdf: {} as any,
    });

    doc.sectionElements = [existingElement];

    const pages = await buildPages(doc);
    expect(pages[0].header).toBe(existingElement);
    expect(pages[1].header).toBe(existingElement);
  });

  test('creates new section elements when needed', async () => {
    const parent = mockParent();
    const setting = mockSectionSetting({ hasCurrentPageNumber: true });
    const doc = mockDocumentPage({
      parent,
      doc: { width: 200, height: 400 },
      settings: {
        headers: [setting],
        footers: [setting],
        backgrounds: [setting],
      },
      pageCount: 2,
    });

    const pages = await buildPages(doc);

    expect(doc.html.prepareSection).toHaveBeenCalledTimes(6); // 2 pages * 3 sections
    expect(doc.html.pdf).toHaveBeenCalledTimes(6);

    expect(pages[0].header).toBeDefined();
    expect(pages[0].footer).toBeDefined();
    expect(pages[0].background).toBeDefined();

    expect(pages[1].header).toBeDefined();
    expect(pages[1].footer).toBeDefined();
    expect(pages[1].background).toBeDefined();
  });

  test('returns undefined for sections without settings', async () => {
    const parent = mockParent();
    const doc = mockDocumentPage({
      parent,
      doc: { width: 200, height: 200 },
      settings: {
        headers: [],
        footers: [],
        backgrounds: [],
      },
      pageCount: 1,
    });

    const pages = await buildPages(doc);
    expect(pages[0].header).toBeUndefined();
    expect(pages[0].footer).toBeUndefined();
    expect(pages[0].background).toBeUndefined();
  });
});
