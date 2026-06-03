/**
 * @jest-environment jsdom
 */
import {evalInsertBodySpacer, evalRemoveBodySpacer} from '@app/evaluators/body-spacer';

const SPACER_SELECTOR = '[data-declarative-pdf-body-spacer]';

describe('body-spacer evaluators', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('inserts a fixed-height spacer as the first child of the target page-body', () => {
    document.body.innerHTML = `
      <document-page><page-body><p id="first">hello</p></page-body></document-page>
    `;

    evalInsertBodySpacer({documentPageIndex: 0, height: 150});

    const body = document.querySelector('page-body')!;
    const spacer = body.firstElementChild as HTMLElement;
    expect(spacer.matches(SPACER_SELECTOR)).toBe(true);
    expect(spacer.style.height).toBe('150px');
    // original content is preserved, after the spacer
    expect(body.querySelector('#first')).not.toBeNull();
  });

  test('targets the page-body of the given document-page index', () => {
    document.body.innerHTML = `
      <document-page><page-body><p>a</p></page-body></document-page>
      <document-page><page-body><p>b</p></page-body></document-page>
    `;

    evalInsertBodySpacer({documentPageIndex: 1, height: 80});

    const bodies = document.querySelectorAll('page-body');
    expect(bodies[0].querySelector(SPACER_SELECTOR)).toBeNull();
    expect(bodies[1].querySelector(SPACER_SELECTOR)).not.toBeNull();
  });

  test('removes previously inserted spacer(s)', () => {
    document.body.innerHTML = `
      <document-page><page-body><p>a</p></page-body></document-page>
    `;

    evalInsertBodySpacer({documentPageIndex: 0, height: 120});
    expect(document.querySelector(SPACER_SELECTOR)).not.toBeNull();

    evalRemoveBodySpacer(0);
    expect(document.querySelector(SPACER_SELECTOR)).toBeNull();
  });

  test('is a no-op for a missing document-page or page-body', () => {
    document.body.innerHTML = `<document-page></document-page>`;

    expect(() => evalInsertBodySpacer({documentPageIndex: 0, height: 100})).not.toThrow();
    expect(() => evalInsertBodySpacer({documentPageIndex: 5, height: 100})).not.toThrow();
    expect(() => evalRemoveBodySpacer(5)).not.toThrow();
    expect(document.querySelector(SPACER_SELECTOR)).toBeNull();
  });
});
