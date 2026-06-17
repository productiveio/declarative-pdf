/**
 * Insert a fixed-height spacer at the top of a document-page's page-body.
 *
 * Used in `dynamic-header` mode to reserve the first-page header's extra height:
 * because the spacer is the first body element, only the first rendered page is
 * pushed down, leaving room for the taller first-page header drawn on top of it.
 *
 * Note: this runs in the browser via page.evaluate, so it can only reference its
 * own arguments and browser globals — no module-scope constants.
 */
export function evalInsertBodySpacer(opts: {documentPageIndex: number; height: number}) {
  const docPage = document.querySelectorAll('document-page')[opts.documentPageIndex];
  if (!docPage) return;

  const body = docPage.querySelector('page-body');
  if (!body) return;

  const spacer = document.createElement('div');
  spacer.setAttribute('data-declarative-pdf-body-spacer', '');
  spacer.style.height = `${opts.height}px`;
  // Don't let a flex page-body shrink the spacer away.
  spacer.style.flexShrink = '0';
  body.insertBefore(spacer, body.firstChild);
}

/** Remove any spacer(s) previously inserted into a document-page's page-body. */
export function evalRemoveBodySpacer(documentPageIndex: number) {
  const docPage = document.querySelectorAll('document-page')[documentPageIndex];
  if (!docPage) return;

  docPage.querySelectorAll('[data-declarative-pdf-body-spacer]').forEach((el) => el.remove());
}
