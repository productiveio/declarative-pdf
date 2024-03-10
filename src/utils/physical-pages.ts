import Variant from '@app/consts/physical-page';

import type {
  SectionMeta,
  SectionVariantMeta,
} from '@app/models/document-page';

const findVariant = (variants: SectionVariantMeta[], condition: Variant) => {
  return variants.find((variant) => variant.physicalPageType === condition);
};

/**
 * Checks if the section collection includes a section with physical pages.
 * If it does, it means that the all sections are variants.
 * If it doesn't, it means that there is only one section which is not a variant.
 *
 * @param sections Either a regular section or a section containing physical pages
 */
export const areSectionVariants = (
  sections: (SectionMeta | SectionVariantMeta)[]
): sections is SectionVariantMeta[] => {
  return (
    Array.isArray(sections) &&
    'physicalPageIndex' in sections[0] &&
    sections[0].physicalPageIndex !== undefined
  );
};

/**
 * Selects a variant for a given page in the layout.
 * If the variant is not found, it returns undefined which means that
 * the specific section on that page will be blank.
 *
 * @param variants A collection of physical pages from which we want to select one
 * @param pageIndex Index of the page in the current layout
 * @param offset A sum of page counts from previous document-pages
 * @param count A count of pages this document-page have
 */
export const selectVariant = (
  variants: SectionVariantMeta[],
  pageIndex: number,
  offset: number,
  count: number
) => {
  if (!variants.length) return;

  const isFirst = pageIndex === 0;
  const isLast = pageIndex === count - 1;
  const isOdd = (pageIndex + 1 + offset) % 2 === 1;

  return (
    (isLast || isFirst
      ? findVariant(variants, isLast ? Variant.LAST : Variant.FIRST)
      : undefined) ||
    findVariant(variants, isOdd ? Variant.ODD : Variant.EVEN) ||
    findVariant(variants, Variant.DEFAULT)
  );
};

/**
 * Checks if the section is a regular section or a section with physical pages
 *
 * @param section Either a regular section or a section containing physical pages
 */
export const isSectionVariantMeta = (
  section: SectionMeta | SectionVariantMeta | undefined
): section is SectionVariantMeta => {
  return (
    !!section &&
    'physicalPageIndex' in section &&
    section.physicalPageIndex !== undefined
  );
};
