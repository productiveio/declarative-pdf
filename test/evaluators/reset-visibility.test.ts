/**
 * @jest-environment jsdom
 */
import evalResetVisibility from '@app/evaluators/reset-visibility';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalResetVisibility', () => {
  test('it changes visibility of invisible elements', () => {
    document.body.innerHTML = `
      <document-page style="display: none"> ... </document-page>
      <page-background style="display: block"> ... </page-background>
      <page-header style="display: none"> ... </page-header>
      <page-body> ... </page-body>
      <page-footer style="display: block"> ... </page-footer>
      <physical-page style="display: none"> ... </physical-page>
    `;

    const desiredOutput = `
      <document-page style="display: block;"> ... </document-page>
      <page-background style="display: block"> ... </page-background>
      <page-header style="display: block;"> ... </page-header>
      <page-body> ... </page-body>
      <page-footer style="display: block"> ... </page-footer>
      <physical-page style="display: block;"> ... </physical-page>
    `;

    evalResetVisibility();

    expect(document.body.innerHTML).toEqual(desiredOutput);
  });
});
