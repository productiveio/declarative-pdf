export default function evalInjectTotalPages(totalPages: number) {
  Array.from(
    document.querySelectorAll('total-pages-number') as NodeListOf<HTMLElement>
  ).forEach((el) => {
    el.textContent = String(totalPages);
  });

  // @ts-expect-error: evil hacks can safely be ignored
  if (this?.injectTotalPages && typeof this.injectTotalPages === 'function') {
    // @ts-expect-error: evil hacks can safely be ignored
    this.injectTotalPages(totalPages);
  }
}
