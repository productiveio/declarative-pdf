type TSections = 'header' | 'footer' | 'background';
type TPhysicalPageVariant = 'first' | 'last' | 'even' | 'odd' | 'default';

export interface SectionSetting {
  height: number;
  physicalPageIndex?: number;
  physicalPageType?: TPhysicalPageVariant;
  hasCurrentPageNumber: boolean;
  hasTotalPagesNumber: boolean;
}

export interface SectionSettings {
  headers: SectionSetting[];
  footers: SectionSetting[];
  backgrounds: SectionSetting[];
}

/**
 * Gets the settings for sections of a document page.
 *
 * This function will evaluate the settings for the sections of a document page
 * and return a SectionSettings object.
 */
export default function evalSectionSettings(
  documentPageIndex: number
): SectionSettings {
  /** physical page variants */
  const variants = ['first', 'last', 'even', 'odd', 'default'] as const;

  /**
   * Gets the pixel height of an element (including padding and border)
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
   * Checks if an element contains an injectable element (current-page-number)
   * @param el A section or physical page element
   * @returns true if the element contains a current page number element
   */
  const hasCurrentPageNumber = (el: HTMLElement) => {
    const currentPageNumber = el.querySelector(
      'current-page-number, span.page-number'
    );
    return !!currentPageNumber;
  };

  /**
   * Checks if an element contains a total pages number element (total-pages-number)
   * @param el A section or physical page element
   * @returns true if the element contains a total pages number element
   */
  const hasTotalPagesNumber = (el: HTMLElement) => {
    const totalPagesNumber = el.querySelector(
      'total-pages-number, span.total-pages'
    );
    return !!totalPagesNumber;
  };

  /**
   * Guards a string to be a valid variant (first, last, even, odd, default)
   * @param s A string to check if it belongs to the variants array
   * @returns true if the string is a variant
   */
  const isVariant = (s: string | null): s is (typeof variants)[number] => {
    return !!s && variants.includes(s as (typeof variants)[number]);
  };

  /**
   * For a given section or physical page element, returns the settings for that element
   * @param el A section or physical page element
   * @param physicalPageIndex A number if the element is a physical page within the section
   */
  const getSettings = (
    el: HTMLElement,
    physicalPageIndex?: number
  ): SectionSetting => {
    let physicalPageType;
    if (physicalPageIndex === undefined) {
      physicalPageType = undefined;
    } else {
      const selectAttr = el.getAttribute('select');
      physicalPageType = isVariant(selectAttr) ? selectAttr : 'default';
    }

    return {
      height: getElementHeight(el),
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
      return [getSettings(sectionEl)];
    }

    return physicalPageEl.map((el, index) => getSettings(el, index));
  };

  const docPageEls = document.querySelectorAll<HTMLElement>('document-page');
  const docPageEl = docPageEls[documentPageIndex];
  if (!docPageEl) return { headers: [], footers: [], backgrounds: [] };

  const filterSections = (s: SectionSetting) => s && s.height > 0;
  return {
    headers: getSection(docPageEl, 'header').filter(filterSections),
    footers: getSection(docPageEl, 'footer').filter(filterSections),
    backgrounds: getSection(docPageEl, 'background').filter(filterSections),
  };
}
