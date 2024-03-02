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
