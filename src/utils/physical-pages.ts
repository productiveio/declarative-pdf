import Variant from '@app/consts/physical-page';

import type {
  SectionSetting,
  SectionVariantSetting,
} from '@app/models/document-page';

const findVariant = (variants: SectionVariantSetting[], condition: Variant) => {
  return variants.find((variant) => variant.physicalPageType === condition);
};

/**
 * A guard function that checks if the section collection includes a section
 * with physical pages. If it does, it means that the all sections are variants.
 * If it doesn't, it means that there is only one section which is not a variant.
 * @param sections Either a regular section or a section containing physical pages
 */
export const areSectionVariants = (
  sections: (SectionSetting | SectionVariantSetting)[]
): sections is SectionVariantSetting[] => {
  return (
    Array.isArray(sections) &&
    'physicalPageIndex' in sections[0] &&
    sections[0].physicalPageIndex !== undefined
  );
};

/**
 * A function that returns a variant for a given page in the layout.
 * If the variant is not found, it returns undefined which means that
 * the specific section on that page will be blank.
 *
 * @param variants A collection of physical pages from which we want to select one
 * @param pageIndex Index of the page in the current layout
 * @param offset A sum of page counts from previous document-pages
 * @param count A count of pages this document-page have
 */
export const selectVariant = (
  variants: SectionVariantSetting[],
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
 * A guard function that checks if the section is a regular section or a section
 * containing physical pages.
 * @param section Either a regular section or a section containing physical pages
 */
export const isSectionVariantSetting = (
  section: SectionSetting | SectionVariantSetting | undefined
): section is SectionVariantSetting => {
  return (
    !!section &&
    'physicalPageIndex' in section &&
    section.physicalPageIndex !== undefined
  );
};
