import {PDFDocument} from 'pdf-lib';
import {selectSection} from '@app/utils/select-section';
import {SectionElement} from '@app/models/element';

import type {PDFPage} from 'pdf-lib';
import type {PageLayout} from '@app/utils/layout/create-page-layout';
import type {SectionSetting} from '@app/evaluators/section-settings';
import type {BodyElement} from '@app/models/element';
import type HTMLAdapter from '@app/utils/adapter-puppeteer';
import type TimeLogger from '@app/utils/debug/time-logger';

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
  logger?: TimeLogger;
}

async function createSectionElement(sectionType: SectionType, setting: SectionSetting, opts: SectionElementOpts) {
  const {documentPageIndex, currentPageNumber, totalPagesNumber, html, layout, logger} = opts;
  const {physicalPageIndex} = setting;

  html.prepareSection({
    documentPageIndex,
    sectionType,
    physicalPageIndex,
    currentPageNumber,
    totalPagesNumber,
  });

  logger?.item().start(`[6.1.1] Rendering ${sectionType} section`);
  const uint8Array = await html.pdf({
    width: layout.width,
    height: setting.height,
    transparentBg: !!layout?.[sectionType]?.transparentBg,
  });
  logger?.item().end();

  const buffer = Buffer.from(uint8Array);

  const pdf = await PDFDocument.load(buffer);

  return new SectionElement({
    buffer,
    pdf,
    setting,
    layout: {
      width: layout.width,
      height: layout[sectionType]!.height,
      x: 0,
      y: layout[sectionType]!.y,
    },
  });
}

async function resolveSectionElement(sectionType: SectionType, opts: SectionElementOpts) {
  const setting = selectSection(
    opts.layout?.[sectionType]?.settings ?? [],
    opts.pageIndex,
    opts.pageCountOffset,
    opts.layout.pageCount
  );

  if (!setting) return undefined;

  const element = opts.elements.find(
    (el) => el.setting === setting && !el.setting.hasCurrentPageNumber && !el.setting.hasTotalPagesNumber
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
  logger?: TimeLogger;
}

export async function buildPages(opts: BuildPagesOpts) {
  const {documentPageIndex, pageCountOffset, totalPagesNumber, layout, body, target, html, logger} = opts;
  const {pageCount} = layout;

  if (!pageCount) throw new Error('Document page has no pages');
  if (!target) throw new Error('No target PDF document provided');

  // TODO: do I need this pages object? for debugging?
  const pages: {
    pageIndex: number;
    currentPageNumber: number;
    header?: SectionElement;
    footer?: SectionElement;
    background?: SectionElement;
  }[] = [];
  const elements: SectionElement[] = [];

  /**
   * If the document page has no sections, we can just copy the pages
   * from the body element and append them to the target document.
   * This is the simplest case and we can exit early.
   */
  if (!layout.hasAnySection) {
    logger?.subgroup().start('[6.3] Copy pages');
    const copiedPages = await target.copyPages(body.pdf, body.pdf.getPageIndices());
    copiedPages.forEach((page) => target.addPage(page));
    logger?.subgroup().end();
    return {pages, elements};
  }

  /**
   * If the document page has sections, we need to create a new page
   * for each page index and resolve the header, footer and background
   * and place them on the page.
   */
  const pageIndices = Array.from({length: pageCount}, (_, i) => i);

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
      logger,
    };

    logger?.subgroup().start(`[6.1] Resolve page ${pageIndex} section elements`);
    const header = await resolveSectionElement('header', opts);
    const footer = await resolveSectionElement('footer', opts);
    const background = await resolveSectionElement('background', opts);
    logger?.subgroup().end();

    // TODO: do something with the target? embed? append?
    // we might need the body element as well

    logger?.subgroup().start(`[6.2] Embed and place page ${pageIndex} sections`);
    const targetPage = target.addPage([layout.width, layout.height]);
    await embedAndPlaceSection(targetPage, background);
    await embedAndPlaceSection(targetPage, header);
    await embedAndPlaceSection(targetPage, footer);
    await embedAndPlaceBody(targetPage, body, pageIndex);
    logger?.subgroup().end();

    pages.push({
      pageIndex,
      currentPageNumber,
      header,
      footer,
      background,
    });
  }

  return {pages, elements};
}

async function embedAndPlaceSection(page: PDFPage, section?: SectionElement) {
  if (!section) return;

  const embeddedPage = await section.embedPage(page.doc);

  page.drawPage(embeddedPage, {
    x: section.x,
    y: section.y,
    width: section.width,
    height: section.height,
  });
}

async function embedAndPlaceBody(page: PDFPage, body: BodyElement, idx: number) {
  const [embeddedPage] = await body.embedPageIdx(page.doc, idx);

  page.drawPage(embeddedPage, {
    x: body.x,
    y: body.y,
    width: body.width,
    height: body.height,
  });
}
