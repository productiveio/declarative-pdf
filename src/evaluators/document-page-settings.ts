type TSections = 'header' | 'footer' | 'background';

export default function evalDocumentPageSettings(index: number) {
  const variants = ['first', 'last', 'even', 'odd', 'default'] as const;

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

  const hasCurrentPageNumber = (el: HTMLElement) => {
    const currentPageNumber = el.querySelector('current-page-number');
    return !!currentPageNumber;
  };

  const hasTotalPagesNumber = (el: HTMLElement) => {
    const totalPagesNumber = el.querySelector('total-pages-number');
    return !!totalPagesNumber;
  };

  const isVariant = (s: string | null): s is (typeof variants)[number] => {
    return !!s && variants.includes(s as (typeof variants)[number]);
  };

  const getSettings = (
    el: HTMLElement,
    index: number,
    type: TSections,
    isPhysicalPage: boolean
  ) => {
    let subSelector;
    if (isPhysicalPage) {
      const selectAttr = el.getAttribute('select');
      subSelector = isVariant(selectAttr) ? selectAttr : 'default';
    }
    return {
      index,
      type,
      subSelector,
      height: getElementHeight(el),
      hasCurrentPageNumber: hasCurrentPageNumber(el),
      hasTotalPagesNumber: hasTotalPagesNumber(el),
    };
  };

  const getSection = (docPageEl: HTMLElement, type: TSections) => {
    const sectionEl = docPageEl.querySelector<HTMLElement>(`page-${type}`);
    if (!sectionEl) return [];

    const sectionSubEls = Array.from(
      sectionEl.querySelectorAll<HTMLElement>('physical-page')
    );
    if (!sectionSubEls.length) {
      return [getSettings(sectionEl, 0, type, false)];
    }

    return sectionSubEls.map((el, index) => getSettings(el, index, type, true));
  };

  const docPageEls = document.querySelectorAll<HTMLElement>('document-page');
  const docPageEl = docPageEls[index];
  if (!docPageEl) return [];

  return [
    ...getSection(docPageEl, 'header'),
    ...getSection(docPageEl, 'footer'),
    ...getSection(docPageEl, 'background'),
  ].filter((section) => section && section.height > 0);
}
