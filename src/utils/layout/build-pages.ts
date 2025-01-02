import type { DocumentPage } from '@app/models/document-page';
import { selectSection } from '@app/utils/select-section';
import type { SectionSetting } from '@app/evaluators/section-settings';
import { SectionElement } from '@app/models/element';

import { PDFDocument } from 'pdf-lib';

interface SectionOpts {
  documentPage: DocumentPage;
  pageIndex: number;
  pageCountOffset: number;
  pageCount: number;
  totalPagesNumber: number;
  currentPageNumber: number;
}

async function createSectionElement(
  section: 'header' | 'footer' | 'background',
  setting: SectionSetting,
  opts: SectionOpts
) {
  const doc = opts.documentPage;
  const html = doc.html;

  html.prepareSection({
    documentPageIndex: doc.index,
    sectionType: section,
    physicalPageIndex: setting.physicalPageIndex,
    currentPageNumber: opts.currentPageNumber,
    totalPagesNumber: opts.totalPagesNumber,
  });

  const uint8Array = await html.pdf({
    width: doc.width,
    height: setting.height,
    transparentBg: doc.layout?.[section]?.transparentBg,
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
  section: 'header' | 'footer' | 'background',
  opts: SectionOpts
) {
  const setting = selectSection(
    opts.documentPage.layout?.[section]?.settings ?? [],
    opts.pageIndex,
    opts.pageCountOffset,
    opts.pageCount
  );

  if (!setting) return undefined;

  const element = opts.documentPage.sectionElements.find(
    (el) => el.setting === setting
  );
  if (element) return element;

  return createSectionElement(section, setting, opts);
}

export async function buildPages(doc: DocumentPage) {
  if (!doc.layout?.pageCount) throw new Error('Document page has no pages');

  const count = doc.layout.pageCount;
  const offset = doc.pageCountOffset;
  const total = doc.totalPagesNumber;

  const pageIndices = Array.from({ length: count }, (_, i) => i);
  const pages = [];

  for (const pageIndex of pageIndices) {
    const currentPageNumber = pageIndex + 1 + offset;

    const opts = {
      documentPage: doc,
      pageIndex,
      pageCountOffset: offset,
      pageCount: count,
      totalPagesNumber: total,
      currentPageNumber,
    };

    const header = await resolveSectionElement('header', opts);
    const footer = await resolveSectionElement('footer', opts);
    const background = await resolveSectionElement('background', opts);

    pages.push({
      pageIndex,
      currentPageNumber,
      header,
      footer,
      background,
    });
  }

  return pages;
}
