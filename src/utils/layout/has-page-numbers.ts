import type { SectionSettings } from '@app/evaluators/section-settings';

export default function hasPageNumbers(
  sectionSettings?: SectionSettings
): boolean {
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
