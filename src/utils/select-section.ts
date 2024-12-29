import Variant from '@app/consts/physical-page';

import { SectionSetting } from '@app/evaluators/section-settings';

const findVariant = (variants: SectionSetting[], condition: Variant) => {
  return variants.find((variant) => variant.physicalPageType === condition);
};

/**
 * Selects a variant for a given page in the layout.
 * If the variant is not found, it returns undefined which means that
 * the specific section on that page will be blank.
 *
 * @param sectionSettings A collection of physical pages from which we want to select one
 * @param pageIndex Index of the page in the current layout
 * @param offset A sum of page counts from previous document-pages
 * @param count A count of pages this document-page have
 */
export const selectSection = (
  sectionSettings: SectionSetting[],
  pageIndex: number,
  offset: number,
  count: number
) => {
  if (!sectionSettings.length) return;

  const isFirst = pageIndex === 0;
  const isLast = pageIndex === count - 1;
  const isOdd = (pageIndex + 1 + offset) % 2 === 1;

  return (
    (isLast || isFirst
      ? findVariant(sectionSettings, isLast ? Variant.LAST : Variant.FIRST)
      : undefined) ||
    findVariant(sectionSettings, isOdd ? Variant.ODD : Variant.EVEN) ||
    findVariant(sectionSettings, Variant.DEFAULT)
  );
};
