/**
 * @jest-environment node
 */
import {PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFString} from 'pdf-lib';
import {transferLinkAnnotations} from '@app/utils/transfer-link-annotations';

import type {PDFPage} from 'pdf-lib';

interface AnnotationLiteral {
  [key: string]: string | number | PDFString | AnnotationLiteral | number[];
}

const EXTERNAL_LINK = {
  Type: 'Annot',
  Subtype: 'Link',
  Rect: [10, 20, 50, 40],
  A: {Type: 'Action', S: 'URI', URI: PDFString.of('https://productive.io/terms')},
  StructParent: 1,
};

async function sourcePage(annotations: AnnotationLiteral[], size: [number, number] = [200, 400]) {
  const doc = await PDFDocument.create();
  const page = doc.addPage(size);

  if (annotations.length) {
    const refs = annotations.map((annotation) => doc.context.register(doc.context.obj(annotation)));
    page.node.set(PDFName.of('Annots'), doc.context.obj(refs));
  }

  return page;
}

async function targetPage(annotations: AnnotationLiteral[] = []) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 500]);

  if (annotations.length) {
    const refs = annotations.map((annotation) => doc.context.register(doc.context.obj(annotation)));
    page.node.set(PDFName.of('Annots'), doc.context.obj(refs));
  }

  return page;
}

function annotationsOf(page: PDFPage) {
  const annots = page.node.Annots();

  return Array.from({length: annots?.size() ?? 0}, (_, index) => annots!.lookup(index, PDFDict));
}

function rectOf(annotation: PDFDict) {
  const rect = annotation.lookup(PDFName.of('Rect'), PDFArray);

  return [0, 1, 2, 3].map((index) => rect.lookup(index, PDFNumber).asNumber());
}

function uriOf(annotation: PDFDict) {
  return annotation.lookup(PDFName.of('A'), PDFDict).lookup(PDFName.of('URI'), PDFString).asString();
}

describe('transferLinkAnnotations', () => {
  test('places a copied link at the drawn position and scale', async () => {
    const source = await sourcePage([EXTERNAL_LINK]);
    const target = await targetPage();

    // half-scale source (200x400), offset by the footer band
    const transferred = transferLinkAnnotations(target, source, {x: 30, y: 60, width: 100, height: 200});

    const [annotation] = annotationsOf(target);
    expect(transferred).toBe(1);
    expect(rectOf(annotation)).toEqual([35, 70, 55, 80]);
    expect(uriOf(annotation)).toBe('https://productive.io/terms');
    expect(annotation.has(PDFName.of('StructParent'))).toBe(false);
    // the source stays untouched, so a cached section can be placed on further pages
    expect(rectOf(annotationsOf(source)[0])).toEqual([10, 20, 50, 40]);
  });

  test('appends to existing annotations and normalizes reversed rects', async () => {
    const source = await sourcePage([{...EXTERNAL_LINK, Rect: [50, 40, 10, 20]}]);
    const target = await targetPage([EXTERNAL_LINK]);

    const transferred = transferLinkAnnotations(target, source, {x: 0, y: 0, width: 200, height: 400});

    expect(transferred).toBe(1);
    expect(annotationsOf(target)).toHaveLength(2);
    expect(rectOf(annotationsOf(target)[1])).toEqual([10, 20, 50, 40]);
  });

  test('skips annotations that cannot be carried over on their own', async () => {
    const source = await sourcePage([
      {Type: 'Annot', Subtype: 'Link', Rect: [10, 20, 50, 40], Dest: 'footnote'},
      {Type: 'Annot', Subtype: 'Widget', Rect: [10, 20, 50, 40]},
      {Type: 'Annot', Subtype: 'Link', A: {S: 'URI', URI: PDFString.of('https://productive.io')}},
      {Type: 'Annot', Subtype: 'Link', Rect: [10, 20], A: {S: 'URI', URI: PDFString.of('https://productive.io')}},
    ]);
    const target = await targetPage();

    const transferred = transferLinkAnnotations(target, source, {x: 0, y: 0, width: 200, height: 400});

    expect(transferred).toBe(0);
    expect(target.node.Annots()).toBeUndefined();
  });

  test('does nothing without annotations or source dimensions', async () => {
    const target = await targetPage();
    const placement = {x: 0, y: 0, width: 200, height: 400};

    expect(transferLinkAnnotations(target, await sourcePage([]), placement)).toBe(0);
    expect(transferLinkAnnotations(target, await sourcePage([EXTERNAL_LINK], [0, 0]), placement)).toBe(0);
  });
});
