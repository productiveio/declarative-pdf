import type {SectionSettings, SectionSetting} from '@app/evaluators/section-settings';

export const getMaxHeight = (els: SectionSetting[]) => {
  return els.reduce((x, s) => Math.max(x, s.height ?? 0), 0);
};

// TODO: Check if we need to force background height?
export default function calculatePageLayout(
  sectionSettings?: SectionSettings,
  pageHeight: number = 0,
  pageWidth: number = 0
) {
  const headerHeight = getMaxHeight(sectionSettings?.headers ?? []);
  const footerHeight = getMaxHeight(sectionSettings?.footers ?? []);
  // Add minimum overlap to avoid white lines between sections
  const bodyHeight = pageHeight ? pageHeight - headerHeight - footerHeight + 2 : 0;
  const backgroundHeight = pageHeight;
  const headerY = pageHeight - headerHeight;
  // Cut bottom whitespace which may occur due to rounding errors
  const footerY = footerHeight ? -1 : 0;
  const bodyY = footerHeight - (pageHeight ? 1 : 0);
  const backgroundY = 0;

  if (bodyHeight < pageHeight / 3) {
    throw new Error(
      `Header/footer too big. Page height: ${pageHeight}px, header: ${headerHeight}px, footer: ${footerHeight}px, body: ${bodyHeight}px.`
    );
  }

  return {
    header: {
      width: pageWidth,
      height: headerHeight,
      x: 0,
      y: headerY,
    },
    footer: {
      width: pageWidth,
      height: footerHeight,
      x: 0,
      y: footerY,
    },
    body: {
      width: pageWidth,
      height: bodyHeight,
      x: 0,
      y: bodyY,
    },
    background: {
      width: pageWidth,
      height: backgroundHeight,
      x: 0,
      y: backgroundY,
    },
  };
}
