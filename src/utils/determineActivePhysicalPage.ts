import Variant from '../consts/physicalPageVariant.js';
import { ISectionCollection } from '../types/index.js';

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

    const defaultVariant = collection.find(
      (col) => col.type === Variant.DEFAULT
    );
    if (defaultVariant) return defaultVariant;
  }

  if (isFirst) {
    const firstVariant = collection.find((col) => col.type === Variant.FIRST);
    if (firstVariant) return firstVariant;

    const oddVariant = collection.find((col) => col.type === Variant.ODD);
    if (oddVariant) return oddVariant;

    const defaultVariant = collection.find(
      (col) => col.type === Variant.DEFAULT
    );
    if (defaultVariant) return defaultVariant;
  }

  if (isOdd) {
    const oddVariant = collection.find((col) => col.type === Variant.ODD);
    if (oddVariant) return oddVariant;

    const defaultVariant = collection.find(
      (col) => col.type === Variant.DEFAULT
    );
    if (defaultVariant) return defaultVariant;
  }

  if (isEven) {
    const evenVariant = collection.find((col) => col.type === Variant.EVEN);
    if (evenVariant) return evenVariant;

    const defaultVariant = collection.find(
      (col) => col.type === Variant.DEFAULT
    );
    if (defaultVariant) return defaultVariant;
  }

  // If nothing is found, return default if it exists, otherwise undefined
  const defaultVariant = collection.find((col) => col.type === Variant.DEFAULT);
  if (defaultVariant) return defaultVariant;
}

// TODO: this is something old, just keeping a reference for now
import PhysicalPageSelector from '../consts/physicalPageVariant';

/**
 * Calculates which section type should be used for pageNumber, given available types
 * @param pageNumber current page number
 * @param totalPages total number of pages
 * @param availableVariants array of section types (first, last, even, odd, default)
 * @returns section type (first, last, even, odd, default)
 */
export function getSectionType(
  pageNumber: number,
  totalPages: number,
  availableVariants: PhysicalPageSelector[]
) {
  const isFirst = pageNumber === 1;
  const isLast = pageNumber === totalPages;
  const isOdd = Boolean(pageNumber % 2);
  const isEven = !isOdd;
  const lastPageType = isOdd
    ? PhysicalPageSelector.ODD
    : PhysicalPageSelector.EVEN;
  const hasFirstType = availableVariants.includes(PhysicalPageSelector.FIRST);
  const hasLastType = availableVariants.includes(PhysicalPageSelector.LAST);
  const hasLastEvenOddType = availableVariants.includes(lastPageType);
  const hasOddType = availableVariants.includes(PhysicalPageSelector.ODD);
  const hasEvenType = availableVariants.includes(PhysicalPageSelector.EVEN);

  if (isFirst && (hasFirstType || hasOddType)) {
    return hasFirstType ? PhysicalPageSelector.FIRST : PhysicalPageSelector.ODD;
  } else if (isLast && (hasLastType || hasLastEvenOddType)) {
    return hasLastType ? PhysicalPageSelector.LAST : lastPageType;
  } else if (isOdd && hasOddType) {
    return PhysicalPageSelector.ODD;
  } else if (isEven && hasEvenType) {
    return PhysicalPageSelector.EVEN;
  }

  return PhysicalPageSelector.DEFAULT;
}
