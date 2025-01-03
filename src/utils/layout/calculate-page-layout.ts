import type {
  SectionSettings,
  SectionSetting,
} from '@app/evaluators/section-settings';

export const getMaxHeight = (els: SectionSetting[]) => {
  return els.reduce((x, s) => Math.max(x, s.height ?? 0), 0);
};

// TODO: Check if we need to force background height?
// TODO: Check if we need to add +1 to bodyY?
export default function calculatePageLayout(
  sectionSettings?: SectionSettings,
  pageHeight: number = 0,
  pageWidth: number = 0
) {
  const headerHeight = getMaxHeight(sectionSettings?.headers ?? []);
  const footerHeight = getMaxHeight(sectionSettings?.footers ?? []);
  const bodyHeight = pageHeight - headerHeight - footerHeight;
  const backgroundHeight = pageHeight;
  const headerY = pageHeight - headerHeight;
  const footerY = 0;
  const bodyY = footerHeight + 1;
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
