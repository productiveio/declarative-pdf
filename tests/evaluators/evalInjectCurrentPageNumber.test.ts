/**
 * @jest-environment jsdom
 */
import evalInjectCurrentPageNumber from '../../src/evaluators/evalInjectCurrentPageNumber';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalInjectCurrentPageNumber', () => {
  test('it injects current page number for current section', () => {
    document.body.innerHTML = `
      <document-page>
        <page-header>
          <current-page-number>1</current-page-number>
        </page-header>
        <page-body></page-body>
        <page-footer>
          <current-page-number>1</current-page-number>
        </page-footer>
      </document-page>
    `;

    const headerTarget = document.querySelector(
      'page-header current-page-number'
    ) as HTMLElement;
    const footerTarget = document.querySelector(
      'page-footer current-page-number'
    ) as HTMLElement;
    expect(headerTarget.textContent).toEqual('1');
    expect(footerTarget.textContent).toEqual('1');

    evalInjectCurrentPageNumber(0, 'page-footer', 5);
    expect(headerTarget.textContent).toEqual('1');
    expect(footerTarget.textContent).toEqual('5');
  });

  test('it injects current page number for all physical pages', () => {
    document.body.innerHTML = `
      <document-page>
        <page-body></page-body>
        <page-footer>
          <physical-page select="first">
            <current-page-number>1</current-page-number>
          </physical-page>
          <physical-page select="last">
            <current-page-number>1</current-page-number>
          </physical-page>
          <current-page-number>1</current-page-number>
        </page-footer>
      </document-page>
    `;

    const targets = document.querySelectorAll(
      'current-page-number'
    ) as NodeListOf<HTMLElement>;
    expect(targets[0].textContent).toEqual('1');
    expect(targets[1].textContent).toEqual('1');
    expect(targets[2].textContent).toEqual('1');

    evalInjectCurrentPageNumber(0, 'page-footer', 5);
    expect(targets[0].textContent).toEqual('5');
    expect(targets[1].textContent).toEqual('5');
    expect(targets[2].textContent).toEqual('5');
  });
});
