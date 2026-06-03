import type {SectionSettings, SectionSetting} from '@app/evaluators/section-settings';

export const getMaxHeight = (els: SectionSetting[]) => {
  return els.reduce((x, s) => Math.max(x, s.height ?? 0), 0);
};

/**
 * Header height used for pages other than the first when `dynamicHeader` is on:
 * the `default` physical-page variant, the single header if there are no
 * variants, or 0 when only special variants exist (header is blank elsewhere).
 */
export const getDefaultHeaderHeight = (headers: SectionSetting[]) => {
  if (!headers.length) return 0;
  if (headers.length === 1 && headers[0].physicalPageType === undefined) return headers[0].height ?? 0;
  return headers.find((s) => s.physicalPageType === 'default')?.height ?? 0;
};

/** Header height of the first physical page; falls back to the default height. */
export const getFirstHeaderHeight = (headers: SectionSetting[], fallback: number) => {
  if (headers.length === 1 && headers[0].physicalPageType === undefined) return headers[0].height ?? 0;
  return headers.find((s) => s.physicalPageType === 'first')?.height ?? fallback;
};

interface CalculatePageLayoutOpts {
  pageHeight: number;
  pageWidth: number;
  bodyHeightMinimumFactor: number;
  /** when true, size the body for the default header and reserve the first-page delta */
  dynamicHeader?: boolean;
}

export default function calculatePageLayout(
  sectionSettings: SectionSettings | undefined,
  opts: CalculatePageLayoutOpts
) {
  const {pageHeight, pageWidth, bodyHeightMinimumFactor, dynamicHeader} = opts;
  const headers = sectionSettings?.headers ?? [];

  // In dynamic-header mode the body is sized for the default (other-pages) header,
  // and the taller first-page header is reserved separately via `headerDelta`.
  const defaultHeaderHeight = getDefaultHeaderHeight(headers);
  const firstPageHeaderHeight = getFirstHeaderHeight(headers, defaultHeaderHeight);
  const headerDelta = dynamicHeader ? Math.max(0, firstPageHeaderHeight - defaultHeaderHeight) : 0;

  const headerHeight = dynamicHeader ? defaultHeaderHeight : getMaxHeight(headers);
  const footerHeight = getMaxHeight(sectionSettings?.footers ?? []);
  // Add minimum overlap to avoid white lines between sections
  const bodyHeight = pageHeight ? pageHeight - headerHeight - footerHeight + 2 : 0;
  const backgroundHeight = pageHeight;
  const headerY = pageHeight - headerHeight;
  // Cut bottom whitespace which may occur due to rounding errors
  const footerY = footerHeight ? -1 : 0;
  const bodyY = footerHeight - (pageHeight ? 1 : 0);
  const backgroundY = 0;

  if (bodyHeight < pageHeight * bodyHeightMinimumFactor) {
    throw new Error(
      `Header/footer too big. Page height: ${pageHeight}px, header: ${headerHeight}px, footer: ${footerHeight}px, body: ${bodyHeight}px.`
    );
  }

  return {
    headerDelta,
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
