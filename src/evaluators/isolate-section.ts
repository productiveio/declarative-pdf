export default function evalIsolateSection(
  docPageIndex: number,
  type: 'background' | 'header' | 'body' | 'footer',
  physicalPageIndex?: number
) {
  function hideAllExcept(els: NodeListOf<HTMLElement>, visIdx: number) {
    els.forEach((el, idx) => {
      el.style.display = idx === visIdx ? 'block' : 'none';
    });
  }

  function hideAll(els: NodeListOf<HTMLElement>) {
    els.forEach((el) => (el.style.display = 'none'));
  }

  function show(el: HTMLElement) {
    el.style.display = 'block';
  }

  const docPages = document.querySelectorAll<HTMLElement>('document-page');
  if (!docPages.length) return false;
  hideAllExcept(docPages, docPageIndex);

  const docPage = docPages[docPageIndex];
  if (!docPage) return false;

  const sectionEls = docPage.querySelectorAll<HTMLElement>(
    'page-background, page-header, page-body, page-footer'
  );
  if (!sectionEls.length) return false;
  hideAll(sectionEls);

  const sectionEl = docPage.querySelector<HTMLElement>(`page-${type}`);
  if (!sectionEl) return false;
  show(sectionEl);

  if (physicalPageIndex === undefined) return true;

  const subSecEls = sectionEl.querySelectorAll<HTMLElement>('physical-page');
  if (!subSecEls.length) return false;
  hideAllExcept(subSecEls, physicalPageIndex);

  const subSecEl = subSecEls[physicalPageIndex];
  if (!subSecEl) return false;

  return true;
}
