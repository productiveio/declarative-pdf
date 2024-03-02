/**
 * @jest-environment jsdom
 */
import evalIsolateSection from '@app/evaluators/isolate-section';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalIsolateSection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('when no document-page elements exist', () => {
    const result = evalIsolateSection(0, 'header');
    expect(result).toBe(false);
  });

  test('when specified index does not exist', () => {
    document.body.innerHTML = `
      <document-page> ... </document-page>
    `;
    const result = evalIsolateSection(1, 'header');
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
    const result = evalIsolateSection(0, 'footer');
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
    const result = evalIsolateSection(0, 'header');
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
    const result = evalIsolateSection(0, 'header', 1);
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
    const result = evalIsolateSection(0, 'header', 0);
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
    evalIsolateSection(1, 'header');
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
    evalIsolateSection(0);
    const docPage = document.querySelector<HTMLElement>('document-page');
    expect(docPage?.style.display).toBe('block');
    const header = docPage?.querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('none');
    const body = docPage?.querySelector<HTMLElement>('page-body');
    expect(body?.style.display).toBe('block');
  });

  test('it works in complex scenarios', () => {
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
        <page-body>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-body>
        <page-footer>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-footer>
      </document-page>
      <document-page>
        <page-background>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-background>
        <page-header>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-header>
        <page-body>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-body>
        <page-footer>
          <physical-page> ... </physical-page>
          <physical-page> ... </physical-page>
        </page-footer>
      </document-page>
    `;
    evalIsolateSection(1, 'header', 1);
    const docPages = document.querySelectorAll<HTMLElement>('document-page');
    expect(docPages[0].style.display).toBe('none');
    expect(docPages[1].style.display).toBe('block');
    const bg = docPages[1].querySelector<HTMLElement>('page-background');
    expect(bg?.style.display).toBe('none');
    const body = docPages[1].querySelector<HTMLElement>('page-body');
    expect(body?.style.display).toBe('none');
    const footer = docPages[1].querySelector<HTMLElement>('page-footer');
    expect(footer?.style.display).toBe('none');
    const header = docPages[1].querySelector<HTMLElement>('page-header');
    expect(header?.style.display).toBe('block');
    const subSecEls = header?.querySelectorAll<HTMLElement>('physical-page');
    expect(subSecEls?.length).toBe(2);
    subSecEls?.forEach((el, idx) => {
      expect(el.style.display).toBe(idx === 1 ? 'block' : 'none');
    });
  });
});
