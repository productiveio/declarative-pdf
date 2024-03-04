/**
 * Load the template into the page and normalize the HTML body.
 *
 * Normalization includes:
 * - adding the `pdf` class to the body
 * - setting the body `margin` and `padding` to `0`
 * for any direct body child that is not a `document-page` or `script` or `style` element:
 * - if `document-page` exists, remove them all
 * - if `document-page` does not exist, move them all into a new `document-page` element
 */
export default function evalTemplateNormalize() {
  document.body.classList.add('pdf');
  document.body.style.margin = '0';
  document.body.style.padding = '0';

  const freeEls = Array.from(document.body.children).filter(
    (el) =>
      el.tagName !== 'DOCUMENT-PAGE' &&
      el.tagName !== 'SCRIPT' &&
      el.tagName !== 'STYLE'
  );

  const hasDocumentPage = Array.from(document.body.children).some(
    (el) => el.tagName === 'DOCUMENT-PAGE'
  );

  if (freeEls.length && !hasDocumentPage) {
    const docPage = document.createElement('document-page');
    docPage.append(...freeEls);
    document.body.append(docPage);
  } else if (hasDocumentPage) {
    freeEls.forEach((el) => el.remove());
  }
}
