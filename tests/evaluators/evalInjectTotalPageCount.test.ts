/**
 * @jest-environment jsdom
 */
import evalInjectTotalPageCount from '../../src/evaluators/evalInjectTotalPageCount';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalInjectTotalPageCount', () => {
  test('it injects total page count', () => {
    document.body.innerHTML = `
      <document-page>
        <page-body></page-body>
        <page-footer>
          <total-pages-number>1</total-pages-number>
        </page-footer>
      </document-page>
    `;

    const target = document.querySelector('total-pages-number') as HTMLElement;
    expect(target.textContent).toEqual('1');

    evalInjectTotalPageCount(5);
    expect(target.textContent).toEqual('5');
  });
});
