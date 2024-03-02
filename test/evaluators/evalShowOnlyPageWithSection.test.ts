/**
 * @jest-environment jsdom
 */
import evalShowOnlyPageWithSection from '@app/evaluators/evalShowOnlyPageWithSection';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalShowOnlyPageWithSection', () => {
  test('it shows the correct page-body', () => {
    document.body.innerHTML = `
      <document-page>
        <page-background> ... </page-background>
        <page-header> ... </page-header>
        <page-body> ... </page-body>
        <page-footer> ... </page-footer>
      </document-page>
      <document-page>
        <page-background> ... </page-background>
        <page-header> ... </page-header>
        <page-body> ... </page-body>
        <page-footer> ... </page-footer>
      </document-page>
    `;
    evalShowOnlyPageWithSection(1, 'page-body');

    const docPages = document.querySelectorAll(
      'document-page'
    ) as NodeListOf<HTMLElement>;
    expect(docPages[0].style.display).toBe('none');
    expect(docPages[1].style.display).toBe('block');

    // visible document-page
    const docPage = docPages[1];
    const pageBackground = docPage.querySelector(
      'page-background'
    ) as HTMLElement;
    expect(pageBackground.style.display).toBe('none');

    const pageHeader = docPage.querySelector('page-header') as HTMLElement;
    expect(pageHeader.style.display).toBe('none');

    const pageBody = docPage.querySelector('page-body') as HTMLElement;
    expect(pageBody.style.display).toBe('block');

    const pageFooter = docPage.querySelector('page-footer') as HTMLElement;
    expect(pageFooter.style.display).toBe('none');
  });

  test('it shows the correct physical-page', () => {
    document.body.innerHTML = `
      <document-page>
        <page-background>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-background>
        <page-header>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-header>
        <page-body> ... </page-body>
        <page-footer>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-footer>
      </document-page>
    `;
    evalShowOnlyPageWithSection(0, 'page-footer', 1);

    const pageBackground = document.querySelector(
      'page-background'
    ) as HTMLElement;
    expect(pageBackground.style.display).toBe('none');

    const pageHeader = document.querySelector('page-header') as HTMLElement;
    expect(pageHeader.style.display).toBe('none');

    const pageBody = document.querySelector('page-body') as HTMLElement;
    expect(pageBody.style.display).toBe('none');

    const pageFooter = document.querySelector('page-footer') as HTMLElement;
    expect(pageFooter.style.display).toBe('block');

    const pageFooterPhysicalPages = pageFooter.querySelectorAll(
      'physical-page'
    ) as NodeListOf<HTMLElement>;
    expect(pageFooterPhysicalPages[0].style.display).toBe('none');
    expect(pageFooterPhysicalPages[1].style.display).toBe('block');
  });

  test('it hides all physical-page', () => {
    document.body.innerHTML = `
      <document-page>
        <page-background>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-background>
        <page-body> ... </page-body>
      </document-page>
    `;
    evalShowOnlyPageWithSection(0, 'page-background', -1);

    const pageBackground = document.querySelector(
      'page-background'
    ) as HTMLElement;
    expect(pageBackground.style.display).toBe('block');

    const pageBackgroundPhysicalPages = pageBackground.querySelectorAll(
      'physical-page'
    ) as NodeListOf<HTMLElement>;
    expect(pageBackgroundPhysicalPages[0].style.display).toBe('none');
    expect(pageBackgroundPhysicalPages[1].style.display).toBe('none');
  });
});
