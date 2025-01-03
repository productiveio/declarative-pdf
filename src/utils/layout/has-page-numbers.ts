import type {
  SectionSettings,
  SectionSetting,
} from '@app/evaluators/section-settings';

export function hasPageNumbers(sectionSettings?: SectionSettings): boolean {
  if (!sectionSettings) return false;

  // Early return if any section has page numbers
  for (const elements of Object.values(sectionSettings)) {
    for (const el of elements) {
      if (el.hasCurrentPageNumber || el.hasTotalPagesNumber) {
        return true;
      }
    }
  }

  return false;
}

export function hasSectionPageNumbers(sectionSettings?: SectionSetting[]) {
  if (!sectionSettings) return false;

  return sectionSettings.some(
    (ss) => ss.hasCurrentPageNumber || ss.hasTotalPagesNumber
  );
}
