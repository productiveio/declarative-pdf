type PrepareSection = {
  documentPageIndex: number;
  sectionType?: 'background' | 'header' | 'footer';
  physicalPageIndex?: number;
  currentPageNumber?: number;
  totalPagesNumber?: number;
};

// TODO: add comments here to describe the side effects of this function
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
        el.querySelectorAll<HTMLElement>('current-page-number')
      ).forEach((el) => {
        el.textContent = String(opts.currentPageNumber);
      });
    }

    if (opts.totalPagesNumber) {
      Array.from(
        el.querySelectorAll<HTMLElement>('total-pages-number')
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
