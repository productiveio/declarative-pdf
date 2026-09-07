import {PDFArray, PDFDict, PDFName, PDFNumber, PDFObjectCopier} from 'pdf-lib';

import type {PDFPage} from 'pdf-lib';

const ANNOTS = PDFName.of('Annots');
const SUBTYPE = PDFName.of('Subtype');
const LINK = PDFName.of('Link');
const RECT = PDFName.of('Rect');
const ACTION = PDFName.of('A');
const URI = PDFName.of('URI');
const STRUCT_PARENT = PDFName.of('StructParent');
const PAGE = PDFName.of('P');

export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Chrome emits internal anchors as named destinations (`/Dest /foo`) which resolve
 * through the source document's name tree, so they cannot be carried over on their
 * own. Only external actions (`/URI`) are self-contained.
 */
function isExternalLink(annotation: PDFDict) {
  if (annotation.lookupMaybe(SUBTYPE, PDFName) !== LINK) return false;

  return !!annotation.lookupMaybe(ACTION, PDFDict)?.has(URI);
}

function transformRect(rect: PDFArray, placement: Placement, scaleX: number, scaleY: number) {
  const [x1, y1, x2, y2] = [0, 1, 2, 3].map((index) => rect.lookup(index, PDFNumber).asNumber());

  return [
    placement.x + Math.min(x1, x2) * scaleX,
    placement.y + Math.min(y1, y2) * scaleY,
    placement.x + Math.max(x1, x2) * scaleX,
    placement.y + Math.max(y1, y2) * scaleY,
  ];
}

function annotationsOf(page: PDFPage) {
  const existing = page.node.Annots();
  if (existing) return existing;

  page.node.set(ANNOTS, page.doc.context.obj([]));
  return page.node.Annots()!;
}

/**
 * Carries link annotations from an embedded source page onto the page it was drawn on.
 *
 * `embedPdf` turns a page into a form XObject built from its content stream and
 * resources only — annotations live outside both, so a link survives as styled text
 * but loses its clickable region. Rects are remapped with the same placement passed
 * to `drawPage`, which keeps them on the glyphs regardless of the render scale.
 *
 * @param targetPage Page the source was drawn on
 * @param sourcePage Page that was embedded and drawn
 * @param placement Position and size `drawPage` was called with
 * @returns How many annotations were carried over
 */
export function transferLinkAnnotations(targetPage: PDFPage, sourcePage: PDFPage, placement: Placement) {
  const sourceAnnotations = sourcePage.node.Annots();
  if (!sourceAnnotations?.size()) return 0;

  const {width: sourceWidth, height: sourceHeight} = sourcePage.getSize();
  if (!sourceWidth || !sourceHeight) return 0;

  const scaleX = placement.width / sourceWidth;
  const scaleY = placement.height / sourceHeight;

  const context = targetPage.doc.context;
  const copier = PDFObjectCopier.for(sourcePage.doc.context, context);

  let transferred = 0;

  for (let index = 0; index < sourceAnnotations.size(); index++) {
    const annotation = sourceAnnotations.lookupMaybe(index, PDFDict);
    if (!annotation || !isExternalLink(annotation)) continue;

    const rect = annotation.lookupMaybe(RECT, PDFArray);
    if (!rect || rect.size() < 4) continue;

    const copy = copier.copy(annotation);
    copy.set(RECT, context.obj(transformRect(rect, placement, scaleX, scaleY)));
    // Both index into the source document — its structure tree is not copied, and the
    // owning page is the target one now.
    copy.delete(STRUCT_PARENT);
    copy.delete(PAGE);

    annotationsOf(targetPage).push(context.register(copy));
    transferred++;
  }

  return transferred;
}
