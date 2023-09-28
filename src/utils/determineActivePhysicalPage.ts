import Variant from '../consts/physicalPageVariant.js';
import {ISectionCollection} from '../types/index.js';

export default function determineActivePhysicalPage(
  pageNumber: number,
  totalPages: number,
  collection: ISectionCollection[]
) {
  const isFirst = pageNumber === 1;
  const isLast = pageNumber === totalPages;
  const isOdd = Boolean(pageNumber % 2);
  const isEven = !isOdd;
  const lastPageType = isOdd ? Variant.ODD : Variant.EVEN;

  if (isLast) {
    const lastVariant = collection.find((col) => col.type === Variant.LAST);
    if (lastVariant) return lastVariant;

    const typeVariant = collection.find((col) => col.type === lastPageType);
    if (typeVariant) return typeVariant;

    const defaultVariant = collection.find((col) => col.type === Variant.DEFAULT);
    if (defaultVariant) return defaultVariant;
  }

  if (isFirst) {
    const firstVariant = collection.find((col) => col.type === Variant.FIRST);
    if (firstVariant) return firstVariant;

    const oddVariant = collection.find((col) => col.type === Variant.ODD);
    if (oddVariant) return oddVariant;

    const defaultVariant = collection.find((col) => col.type === Variant.DEFAULT);
    if (defaultVariant) return defaultVariant;
  }

  if (isOdd) {
    const oddVariant = collection.find((col) => col.type === Variant.ODD);
    if (oddVariant) return oddVariant;

    const defaultVariant = collection.find((col) => col.type === Variant.DEFAULT);
    if (defaultVariant) return defaultVariant;
  }

  if (isEven) {
    const evenVariant = collection.find((col) => col.type === Variant.EVEN);
    if (evenVariant) return evenVariant;

    const defaultVariant = collection.find((col) => col.type === Variant.DEFAULT);
    if (defaultVariant) return defaultVariant;
  }

  // If nothing is found, return default if it exists, otherwise undefined
  const defaultVariant = collection.find((col) => col.type === Variant.DEFAULT);
  if (defaultVariant) return defaultVariant;
}
