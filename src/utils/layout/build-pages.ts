import { PDFDocument } from 'pdf-lib';
import { selectSection } from '@app/utils/select-section';
import { SectionElement } from '@app/models/element';

import type { PageLayout } from '@app/utils/layout/create-page-layout';
import type { SectionSetting } from '@app/evaluators/section-settings';
import type { BodyElement } from '@app/models/element';
import type HTMLAdapter from '@app/utils/adapter-puppeteer';

type SectionType = 'header' | 'footer' | 'background';

interface SectionElementOpts {
  documentPageIndex: number;
  pageIndex: number;
  pageCountOffset: number;
  currentPageNumber: number;
  totalPagesNumber: number;
  elements: SectionElement[];
  layout: PageLayout;
  html: HTMLAdapter;
}

async function createSectionElement(
  sectionType: SectionType,
  setting: SectionSetting,
  opts: SectionElementOpts
) {
  const {
    documentPageIndex,
    currentPageNumber,
    totalPagesNumber,
    html,
    layout,
  } = opts;
  const { physicalPageIndex } = setting;

  html.prepareSection({
    documentPageIndex,
    sectionType,
    physicalPageIndex,
    currentPageNumber,
    totalPagesNumber,
  });

  const uint8Array = await html.pdf({
    width: layout.width,
    height: setting.height,
    transparentBg: !!layout?.[sectionType]?.transparentBg,
  });
  const buffer = Buffer.from(uint8Array);
  const pdf = await PDFDocument.load(buffer);

  return new SectionElement({
    buffer,
    pdf,
    setting,
  });
}

async function resolveSectionElement(
  sectionType: SectionType,
  opts: SectionElementOpts
) {
  const setting = selectSection(
    opts.layout?.[sectionType]?.settings ?? [],
    opts.pageIndex,
    opts.pageCountOffset,
    opts.layout.pageCount
  );

  if (!setting) return undefined;

  const element = opts.elements.find(
    (el) =>
      el.setting === setting &&
      !el.setting.hasCurrentPageNumber &&
      !el.setting.hasTotalPagesNumber
  );
  if (element) return element;

  const newElement = await createSectionElement(sectionType, setting, opts);
  opts.elements.push(newElement);
  return newElement;
}

interface BuildPagesOpts {
  documentPageIndex: number;
  pageCountOffset: number;
  totalPagesNumber: number;
  layout: PageLayout;
  body: BodyElement;
  target: PDFDocument;
  html: HTMLAdapter;
}

export async function buildPages(opts: BuildPagesOpts) {
  const {
    documentPageIndex,
    pageCountOffset,
    totalPagesNumber,
    target,
    layout,
    html,
  } = opts;
  const { pageCount } = layout;

  if (!pageCount) throw new Error('Document page has no pages');
  if (!target) throw new Error('No target PDF document provided');

  const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
  const pages = [];
  const elements: SectionElement[] = [];

  for (const pageIndex of pageIndices) {
    const currentPageNumber = pageIndex + 1 + pageCountOffset;

    const opts = {
      documentPageIndex,
      pageIndex,
      pageCountOffset,
      currentPageNumber,
      totalPagesNumber,
      elements,
      layout,
      html,
    };

    const header = await resolveSectionElement('header', opts);
    const footer = await resolveSectionElement('footer', opts);
    const background = await resolveSectionElement('background', opts);

    // TODO: do something with the target? embed? append?
    // we might need the body element as well

    pages.push({
      pageIndex,
      currentPageNumber,
      header,
      footer,
      background,
    });
  }

  return { pages, elements };
}
