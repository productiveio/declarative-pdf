type PrepareSection = {
  documentPageIndex: number;
  sectionType?: 'background' | 'header' | 'footer';
  physicalPageIndex?: number;
  currentPageNumber?: number;
  totalPagesNumber?: number;
};

/**
 * Prepare a section of the document for pdf printing.
 *
 * This function is used to isolate a specific section of the document
 * for printing. It hides all other sections and pages, and injects
 * the current and total page numbers if needed.
 */
export default function evalPrepareSection(opts: PrepareSection) {
  function hideAllExcept(
    els: NodeListOf<HTMLElement>,
    target: number | string
  ): HTMLElement | undefined {
    let shownElement: HTMLElement | undefined;

    Array.from(els).forEach((el, index) => {
      if (
        (typeof target === 'number' && index === target) ||
        el.tagName.toLowerCase() === target
      ) {
        el.style.display = 'block';
        shownElement = el;
      } else {
        el.style.display = 'none';
      }
    });

    return shownElement;
  }

  function injectNumbers(el: HTMLElement) {
    if (opts.currentPageNumber) {
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'current-page-number, span.page-number'
        )
      ).forEach((el) => {
        el.textContent = String(opts.currentPageNumber);
      });
    }

    if (opts.totalPagesNumber) {
      Array.from(
        el.querySelectorAll<HTMLElement>('total-pages-number, span.total-pages')
      ).forEach((el) => {
        el.textContent = String(opts.totalPagesNumber);
      });
    }
  }

  const secType = opts.sectionType ? `page-${opts.sectionType}` : 'page-body';

  // show only the document page containing the element we want to isolate
  const docPage = hideAllExcept(
    document.querySelectorAll<HTMLElement>('document-page'),
    opts.documentPageIndex
  );
  if (!docPage) return false;

  // show only the section we want to isolate
  const sectionEl = hideAllExcept(
    docPage.querySelectorAll<HTMLElement>(
      'page-background, page-header, page-body, page-footer'
    ),
    secType
  );
  if (!sectionEl) return false;

  // if secType is body, we need to remove the body margin because
  // they are already included in the pdf print options
  if (secType === 'page-body') {
    sectionEl.style.marginTop = '0px';
    sectionEl.style.marginBottom = '0px';
  }

  // end the flow if we don't need to isolate a physical page
  if (!opts.sectionType || opts.physicalPageIndex === undefined) {
    injectNumbers(sectionEl);
    return true;
  }

  // show only the physical page we want to isolate
  const subSecEl = hideAllExcept(
    sectionEl.querySelectorAll<HTMLElement>('physical-page'),
    opts.physicalPageIndex
  );
  if (!subSecEl) return false;

  injectNumbers(subSecEl);
  return true;
}
