type TSections = 'header' | 'footer' | 'background';

/**
 * Gets the settings for elements of a document page.
 *
 * This function will evaluate the settings for the elements of a document page
 * and return an array of settings for each element.
 */
export default function evalDocumentPageSettings(documentPageIndex: number) {
  /** physical page variants */
  const variants = ['first', 'last', 'even', 'odd', 'default'] as const;

  /**
   * (Utility) Gets the pixel height of an element (including padding and border)
   * @param el A section or physical page element
   * @returns Pixel height of the element
   */
  const getElementHeight = (el: HTMLElement) => {
    return Math.ceil(
      Math.max(
        el.clientHeight ?? 0,
        el.offsetHeight ?? 0,
        el.scrollHeight ?? 0,
        el.getBoundingClientRect().height ?? 0
      )
    );
  };

  /**
   * (Utility) Checks if an element contains an injectable element (current-page-number)
   * @param el A section or physical page element
   * @returns true if the element contains a current page number element
   */
  const hasCurrentPageNumber = (el: HTMLElement) => {
    const currentPageNumber = el.querySelector('current-page-number');
    return !!currentPageNumber;
  };

  /**
   * (Utility) Checks if an element contains a total pages number element (total-pages-number)
   * @param el A section or physical page element
   * @returns true if the element contains a total pages number element
   */
  const hasTotalPagesNumber = (el: HTMLElement) => {
    const totalPagesNumber = el.querySelector('total-pages-number');
    return !!totalPagesNumber;
  };

  /**
   * (Utility) Guards a string to be a valid variant (first, last, even, odd, default)
   * @param s A string to check if it belongs to the variants array
   * @returns true if the string is a variant
   */
  const isVariant = (s: string | null): s is (typeof variants)[number] => {
    return !!s && variants.includes(s as (typeof variants)[number]);
  };

  /**
   * (Worker) For a given section or physical page element, returns the settings for that element
   * @param el A section or physical page element
   * @param sectionType A section type (header, footer, background)
   * @param physicalPageIndex A number if the element is a physical page within the section
   */
  const getSettings = (
    el: HTMLElement,
    sectionType: TSections,
    physicalPageIndex?: number
  ) => {
    // means that there are no physical pages in this section
    if (physicalPageIndex === undefined) {
      return {
        sectionHeight: getElementHeight(el),
        sectionType,
        hasCurrentPageNumber: hasCurrentPageNumber(el),
        hasTotalPagesNumber: hasTotalPagesNumber(el),
      };
    }

    const selectAttr = el.getAttribute('select');
    const physicalPageType = isVariant(selectAttr) ? selectAttr : 'default';
    return {
      sectionHeight: getElementHeight(el),
      sectionType,
      physicalPageIndex,
      physicalPageType,
      hasCurrentPageNumber: hasCurrentPageNumber(el),
      hasTotalPagesNumber: hasTotalPagesNumber(el),
    };
  };

  const getSection = (docPageEl: HTMLElement, type: TSections) => {
    const sectionEl = docPageEl.querySelector<HTMLElement>(`page-${type}`);
    if (!sectionEl) return [];

    const physicalPageEl = Array.from(
      sectionEl.querySelectorAll<HTMLElement>('physical-page')
    );
    if (!physicalPageEl.length) {
      return [getSettings(sectionEl, type)];
    }

    return physicalPageEl.map((el, index) => getSettings(el, type, index));
  };

  const docPageEls = document.querySelectorAll<HTMLElement>('document-page');
  const docPageEl = docPageEls[documentPageIndex];
  if (!docPageEl) return [];

  return [
    ...getSection(docPageEl, 'header'),
    ...getSection(docPageEl, 'footer'),
    ...getSection(docPageEl, 'background'),
  ].filter((s) => s && s.sectionHeight > 0);
}
