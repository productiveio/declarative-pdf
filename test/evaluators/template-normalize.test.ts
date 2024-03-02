/**
 * @jest-environment jsdom
 */
import evalTemplateNormalize from '@app/evaluators/template-normalize';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalTemplateNormalize', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('creates a document-page element when none exists', () => {
    document.body.innerHTML = '<div>Test</div>';
    evalTemplateNormalize();
    expect(document.body.children.length).toBe(1);
    expect(document.body.children[0].tagName).toBe('DOCUMENT-PAGE');
    expect(document.body.children[0].children.length).toBe(1);
    expect(document.body.children[0].children[0].tagName).toBe('DIV');
    expect(document.body.children[0].children[0].textContent).toBe('Test');
  });

  test('does not create a document-page element when one already exists', () => {
    document.body.innerHTML = '<document-page>Test</document-page>';
    const preNormalized = document.body.innerHTML;
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe(preNormalized);
  });

  test('removes free elements when a document-page element exists', () => {
    document.body.innerHTML =
      '<document-page>Test</document-page><div>Test</div>';
    evalTemplateNormalize();
    expect(document.body.querySelector('div')).toBeNull();
  });

  test('sets body margin and padding to 0', () => {
    evalTemplateNormalize();
    expect(document.body.style.margin).toBe('0px');
    expect(document.body.style.padding).toBe('0px');
  });

  test('adds pdf class to body', () => {
    evalTemplateNormalize();
    expect(document.body.classList.contains('pdf')).toBe(true);
  });
});
