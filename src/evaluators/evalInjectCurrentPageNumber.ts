export default function evalInjectCurrentPageNumber(
  docPageIndex: number,
  sectionName: 'page-background' | 'page-header' | 'page-footer',
  pageNumber: number
) {
  const docPage = document.querySelector(
    `document-page:nth-child(${docPageIndex + 1})`
  ) as HTMLElement;
  const section = docPage.querySelector(sectionName) as HTMLElement;

  Array.from(
    section.querySelectorAll('current-page-number') as NodeListOf<HTMLElement>
  ).forEach((el) => {
    el.textContent = String(pageNumber);
  });
}
