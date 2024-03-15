/**
 * @jest-environment jsdom
 */
import evalPrepareSection from '@app/evaluators/prepare-section';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalPrepareSection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('when no document-page elements exist', () => {
    const result = evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'header',
    });
    expect(result).toBe(false);
  });

  test('when specified index does not exist', () => {
    document.body.innerHTML = `
      <document-page> ... </document-page>
    `;
    const result = evalPrepareSection({
      documentPageIndex: 1,
      sectionType: 'header',
    });
    expect(result).toBe(false);
    const docPage = document.querySelector<HTMLElement>('document-page');
    expect(docPage?.style.display).toBe('none');
  });

  test('when specified section does not exist', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header> ... </page-header>
      </document-page>
    `;
    const result = evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'footer',
    });
    expect(result).toBe(false);
    const header = document.querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('none');
  });

  test('when specified section exists and no physicalPageIndex is provided', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header> ... </page-header>
      </document-page>
    `;
    const result = evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'header',
    });
    expect(result).toBe(true);
    const header = document.querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('block');
  });

  test('when specified physicalPageIndex does not exist', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header>
          <physical-page> ... </physical-page>
        </page-header>
      </document-page>
    `;
    const result = evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'header',
      physicalPageIndex: 1,
    });
    expect(result).toBe(false);
    const header = document.querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('block');
    const physicalPage = document.querySelector<HTMLElement>('physical-page');
    expect(physicalPage?.style.display).toBe('none');
  });

  test('when specified physicalPageIndex exists', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header>
          <physical-page> ... </physical-page>
        </page-header>
      </document-page>
    `;
    const result = evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'header',
      physicalPageIndex: 0,
    });
    expect(result).toBe(true);
    const header = document.querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('block');
    const physicalPage = document.querySelector<HTMLElement>('physical-page');
    expect(physicalPage?.style.display).toBe('block');
  });

  test('hides all document-page elements except the specified index', () => {
    document.body.innerHTML = `
      <document-page> ... </document-page>
      <document-page> ... </document-page>
      <document-page> ... </document-page>
    `;
    evalPrepareSection({ documentPageIndex: 1, sectionType: 'header' });
    const docPages = document.querySelectorAll<HTMLElement>('document-page');
    expect(docPages[0].style.display).toBe('none');
    expect(docPages[1].style.display).toBe('block');
    expect(docPages[2].style.display).toBe('none');
  });

  test('it falls back to body section when no section is specified', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header> ... </page-header>
        <page-body> ... </page-body>
      </document>
    `;
    evalPrepareSection({ documentPageIndex: 0 });
    const docPage = document.querySelector<HTMLElement>('document-page');
    expect(docPage?.style.display).toBe('block');
    const header = docPage?.querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('none');
    const body = docPage?.querySelector<HTMLElement>('page-body');
    expect(body?.style.display).toBe('block');
  });

  test('it works in complex scenarios and injects page numbers where needed', () => {
    document.body.innerHTML = `
      <document-page>
        <page-background>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-background>
        <page-header>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-header>
        <page-body>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-body>
        <page-footer>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-footer>
      </document-page>
      <document-page>
        <page-background>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-background>
        <page-header>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-header>
        <page-body>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-body>
        <page-footer>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
          <physical-page>
            <current-page-number> NaN </current-page-number>
            <total-pages-number> NaN </total-pages-number>
          </physical-page>
        </page-footer>
      </document-page>
    `;
    evalPrepareSection({
      documentPageIndex: 1,
      sectionType: 'header',
      physicalPageIndex: 1,
      currentPageNumber: 24,
      totalPagesNumber: 42,
    });
    const docPages = document.querySelectorAll<HTMLElement>('document-page');
    expect(docPages[0].style.display).toBe('none');
    expect(docPages[1].style.display).toBe('block');

    docPages[0]
      .querySelectorAll<HTMLElement>('current-page-number, total-pages-number')
      .forEach((el) => {
        expect(el.textContent).toBe(' NaN ');
      });

    docPages[1]
      .querySelectorAll<HTMLElement>('page-background, page-body, page-footer')
      .forEach((el) => {
        expect(el.style.display).toBe('none');
        el.querySelectorAll<HTMLElement>(
          'current-page-number, total-pages-number'
        ).forEach((el) => {
          expect(el.textContent).toBe(' NaN ');
        });
      });

    const header = docPages[1].querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('block');

    const subSecEls = header?.querySelectorAll<HTMLElement>('physical-page');
    expect(subSecEls?.length).toBe(2);

    expect(subSecEls?.[0].style.display).toBe('none');
    expect(
      subSecEls?.[0].querySelector<HTMLElement>('current-page-number')
        ?.textContent
    ).toBe(' NaN ');
    expect(
      subSecEls?.[0].querySelector<HTMLElement>('total-pages-number')
        ?.textContent
    ).toBe(' NaN ');

    expect(subSecEls?.[1].style.display).toBe('block');
    expect(
      subSecEls?.[1].querySelector<HTMLElement>('current-page-number')
        ?.textContent
    ).toBe('24');
    expect(
      subSecEls?.[1].querySelector<HTMLElement>('total-pages-number')
        ?.textContent
    ).toBe('42');
  });

  test('it injects page numbers for span elements', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header>
          <span class="page-number"> ... </span>
          /
          <span class="total-pages"> ... </span>
        </page-header>
      </document-page>
    `;
    evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'header',
      currentPageNumber: 24,
      totalPagesNumber: 42,
    });

    const totalPages = document.querySelector<HTMLElement>('.total-pages');
    expect(totalPages?.textContent).toBe('42');

    const pageNumber = document.querySelector<HTMLElement>('.page-number');
    expect(pageNumber?.textContent).toBe('24');
  });

  test('it injects page numbers for declarative elements', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header>
          <current-page-number> ... </current-page-number>
          /
          <total-pages-number> ... </total-pages-number>
        </page-header>
      </document-page>
    `;
    evalPrepareSection({
      documentPageIndex: 0,
      sectionType: 'header',
      currentPageNumber: 24,
      totalPagesNumber: 42,
    });

    const totalPages =
      document.querySelector<HTMLElement>('total-pages-number');
    expect(totalPages?.textContent).toBe('42');

    const pageNumber = document.querySelector<HTMLElement>(
      'current-page-number'
    );
    expect(pageNumber?.textContent).toBe('24');
  });

  test('it removes page-body margins', () => {
    document.body.innerHTML = `
      <document-page>
        <page-body> ... </page-body>
      </document-page>
    `;
    evalPrepareSection({ documentPageIndex: 0 });
    const body = document.querySelector<HTMLElement>('page-body');
    expect(body?.style.marginTop).toBe('0px');
    expect(body?.style.marginBottom).toBe('0px');
  });
});
