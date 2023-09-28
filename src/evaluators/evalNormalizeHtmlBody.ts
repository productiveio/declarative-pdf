export default function evalNormalizeHtmlBody() {
  document.body.classList.add('pdf');

  const freeEls = Array.from(document.body.children)
    .filter((el) => el.tagName !== 'DOCUMENT-PAGE' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE');

  if (freeEls.length && !Array.from(document.body.children).filter((el) => el.tagName === 'DOCUMENT-PAGE').length) {
    const docPage = document.createElement('document-page');
    freeEls.forEach((el) => docPage.insertAdjacentElement('beforeend', el));
    document.body.insertAdjacentElement('beforeend', docPage);
  } else {
    freeEls.forEach((el) => el.remove());
  }

  const bodyEl = document.querySelector('body') as HTMLBodyElement;
  bodyEl?.style.setProperty('margin', '0');
  bodyEl?.style.setProperty('padding', '0');
}

// TODO
// - kad imamo vise sekcija unutar istog document-pagea,
//   mislim da ih mozemo samo removat iz doma da ne smetaju

// TODO
// - kad imamo vise razlicitih physical-page-ova unutar istog sectiona,
//   trebamo nesto napravit s njima.
//   mozda removat, pa u dokumentaciju stavit reasoning iza toga...
// - mozda je to najbolje napraviti u evalGetSectionSettings.ts
