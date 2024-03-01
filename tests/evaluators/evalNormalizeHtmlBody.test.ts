/**
 * @jest-environment jsdom
 */
import evalNormalizeHtmlBody from '../../src/evaluators/evalNormalizeHtmlBody';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalNormalizeHtmlBody', () => {
  test('it wraps free elements in document page', () => {
    document.body.innerHTML = `<div> ... </div><div> ... </div>`;
    evalNormalizeHtmlBody();

    expect(document.body.innerHTML.trim()).toEqual(
      '<document-page><div> ... </div><div> ... </div></document-page>'
    );
  });

  test('it removes free elements if document-page exists', () => {
    document.body.innerHTML = `
      <document-page> ... </document-page>
      <div> ... </div>
      <div> ... </div>
    `;
    evalNormalizeHtmlBody();

    expect(document.body.innerHTML.trim()).toEqual(
      '<document-page> ... </document-page>'
    );
  });

  test('it adds pdf class and styles to body', () => {
    document.body.innerHTML = `<document-page> ... </document-page>`;
    evalNormalizeHtmlBody();

    expect(document.body.classList.contains('pdf')).toBe(true);
    expect(document.body.style.margin).toBe('0px');
    expect(document.body.style.padding).toBe('0px');
  });
});
