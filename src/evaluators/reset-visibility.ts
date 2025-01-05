export default function evalResetVisibility() {
  const hideables = [
    'document-page',
    'page-background',
    'page-header',
    'page-body',
    'page-footer',
    'physical-page',
  ].join(', ');

  Array.from(document.querySelectorAll<HTMLElement>(hideables)).forEach((el) => {
    if (el.style.display === 'none') {
      el.style.display = 'block';
    }
  });
}
