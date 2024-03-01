export default function evalShowOnlyPageWithSection(
  docPageIndex: number,
  section: 'page-background' | 'page-header' | 'page-body' | 'page-footer',
  physicalPageIndex?: number
) {
  const docPages = document.querySelectorAll(
    'document-page'
  ) as NodeListOf<HTMLElement>;
  // show only <document-page> element at docPageIndex
  Array.from(docPages).forEach((docPage, idx) => {
    docPage.style.display = idx === docPageIndex ? 'block' : 'none';
  });

  const docPage = docPages[docPageIndex];

  if (docPage) {
    ['page-background', 'page-header', 'page-body', 'page-footer'].forEach(
      (elementName) => {
        const element = docPage.querySelector(elementName) as
          | HTMLElement
          | undefined;
        if (!element) return;

        // show only <${section}> element belonging to shown <document-page> element
        element.style.display = elementName === section ? 'block' : 'none';

        if (physicalPageIndex !== undefined && elementName === section) {
          const sectionElements = element.querySelectorAll(
            'physical-page'
          ) as NodeListOf<HTMLElement>;

          // show only <physical-page> element at physicalPageIndex for shown <${section}> element
          Array.from(sectionElements).forEach((sectionEl, idx) => {
            sectionEl.style.display =
              idx === physicalPageIndex ? 'block' : 'none';
          });
        }
      }
    );
  }
}
