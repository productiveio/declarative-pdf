import type {config} from '../config.js';

export default function evalGetDocumentPageSettings(paper: typeof config.paper) {
  const isFormat = (format: unknown): format is keyof typeof paper.size => typeof format === 'string' && Object.keys(paper.size).includes(format);
  const convertMmToPx = (mm: number, ppi: number) => Math.round(mm * (ppi / 25.4));

  const getPageSettings = (docPageEl: HTMLElement, index: number) => {
    const attrFormat = docPageEl.getAttribute('format');
    const attrPpi = Number(docPageEl.getAttribute('ppi'));
    const attrSize = docPageEl.getAttribute('size');
    const [attrWidth, attrHeight] = attrSize ? paper.util.getWxH(attrSize) : [];

    const ppi = attrPpi && attrPpi > 0 ? attrPpi : paper.default.ppi;

    let width, height;

    if (isFormat(attrFormat)) {
      const size = paper.size[attrFormat];
      width = convertMmToPx(size.width, ppi);
      height = convertMmToPx(size.height, ppi);
    } else if (attrWidth && attrHeight) {
      width = attrWidth;
      height = attrHeight;
    } else {
      width = paper.default.width;
      height = paper.default.height;
    }

    return {index, width, height};
  };

  const docPageEls = Array.from(document.querySelectorAll('document-page') as NodeListOf<HTMLElement>);

  return docPageEls.map(getPageSettings);
}
