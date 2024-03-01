import type { IDocumentPagePhase1 } from '../types/index.js';
import type { config } from '../config.js';
import type Variant from '../consts/physicalPageVariant.js';

export default function evalGetSectionSettings(
  paperJSON: string,
  documentPageJSON: string
) {
  const documentPage = JSON.parse(documentPageJSON) as IDocumentPagePhase1;
  const paper = JSON.parse(paperJSON) as typeof config.paper;

  const getElementHeight = (el: HTMLElement) =>
    Math.ceil(
      Math.max(
        el.clientHeight ?? 0,
        el.offsetHeight ?? 0,
        el.scrollHeight ?? 0,
        el.getBoundingClientRect().height ?? 0
      )
    );

  const calculateHeight = (
    pages: { height: number }[],
    totalHeight: number
  ) => {
    if (!pages.length) {
      return totalHeight;
    }

    let pagesMaxHeight = 0;
    let pagesTotalHeight = 0;

    for (const page of pages) {
      pagesMaxHeight = Math.max(pagesMaxHeight, page.height);
      pagesTotalHeight += page.height;
    }

    return totalHeight - pagesTotalHeight + pagesMaxHeight;
  };

  const getPhysical = (docPageEl: HTMLElement) => {
    const sectionEls = Array.from(
      docPageEl.querySelectorAll('physical-page') as NodeListOf<HTMLElement>
    );
    // TODO - ovdje uvesti nekakvu normalizaciju
    return sectionEls
      .filter((el) => el && getElementHeight(el) > 0)
      .map((el, index) => ({
        index,
        height: getElementHeight(el),
        type: Object.values(paper.physicalPageVariant).includes(
          (el.getAttribute('select') as Variant) ?? ''
        )
          ? (el.getAttribute('select') as Variant)
          : paper.physicalPageVariant.DEFAULT,
      }));
  };

  const checkForPageNumber = (el: HTMLElement) => {
    const currentPageNumber = el.querySelector('current-page-number');
    const totalPagesNumber = el.querySelector('total-pages-number');
    return !!(currentPageNumber || totalPagesNumber);
  };

  const docPageEls = document.querySelectorAll(
    'document-page'
  ) as NodeListOf<HTMLElement>;
  const docPageEl = docPageEls[documentPage.index];

  const header = docPageEl?.querySelector('page-header') as HTMLElement | null;
  const footer = docPageEl?.querySelector('page-footer') as HTMLElement | null;
  const background = docPageEl?.querySelector(
    'page-background'
  ) as HTMLElement | null;

  const headerPages = header ? getPhysical(header) : [];
  const footerPages = footer ? getPhysical(footer) : [];
  const backgroundPages = background ? getPhysical(background) : [];

  return {
    ...documentPage,
    header: {
      height: header
        ? calculateHeight(headerPages, getElementHeight(header))
        : 0,
      hasPageNumber: header ? checkForPageNumber(header) : false,
      collection: headerPages,
    },
    footer: {
      height: footer
        ? calculateHeight(footerPages, getElementHeight(footer))
        : 0,
      hasPageNumber: footer ? checkForPageNumber(footer) : false,
      collection: footerPages,
    },
    background: {
      height: background ? documentPage.height : 0,
      hasPageNumber: background ? checkForPageNumber(background) : false,
      collection: backgroundPages,
    },
  };
}
