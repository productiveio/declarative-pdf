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
  document.body.style.backgroundColor = 'transparent';

  // Body should only contain document-page and script/style elements
  // everything else is considered a free element
  const freeEls = Array.from(document.body.childNodes).filter(
    (el) => !['DOCUMENT-PAGE', 'SCRIPT', 'STYLE'].includes(el.nodeName)
  );

  const hasDocumentPage = Array.from(document.body.children).some((el) => el.tagName === 'DOCUMENT-PAGE');

  // Only keep free els if there is no document-page
  if (freeEls.length && !hasDocumentPage) {
    const docPage = document.createElement('document-page');
    docPage.append(...freeEls);
    document.body.append(docPage);
  } else if (hasDocumentPage) {
    freeEls.forEach((el) => el.remove());
  }

  // Document-page must be structured in a specific way:
  // it must have page-body
  // it can have max 1 page-header, page-footer, page-background
  // those childnodes must not be empty
  Array.from(document.querySelectorAll('document-page')).forEach((doc) => {
    const docFreeEls = Array.from(doc.childNodes).filter(
      (el) => !['PAGE-BODY', 'PAGE-BACKGROUND', 'PAGE-FOOTER', 'PAGE-HEADER', 'SCRIPT', 'STYLE'].includes(el.nodeName)
    );

    const hasPageBody = Array.from(doc.children).some((el) => el.tagName === 'PAGE-BODY');

    // Only keep free els if there is no page-body
    if (docFreeEls.length && !hasPageBody) {
      const pageBody = document.createElement('page-body');
      pageBody.append(...docFreeEls);
      doc.append(pageBody);
    } else if (hasPageBody) {
      docFreeEls.forEach((el) => el.remove());
    }

    // Remove empty elements
    Array.from(doc.querySelectorAll('page-body, page-header, page-footer, page-background')).forEach((el) => {
      if (!el.childNodes.length) {
        el.remove();
      }
    });

    // If there is no page-body, script or style, remove the document-page
    if (!doc.querySelectorAll('page-body, script, style').length) {
      doc.remove();
    }
  });
}
