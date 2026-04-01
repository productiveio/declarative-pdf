import calculatePageLayout, {getMaxHeight} from '@app/utils/layout/calculate-page-layout';
import {hasPageNumbers, hasSectionPageNumbers} from '@app/utils/layout/has-page-numbers';

import type {SectionSettings, SectionSetting} from '@app/evaluators/section-settings';

export interface BodyLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  transparentBg: boolean;
}

export interface SectionLayout extends BodyLayout {
  hasPageNumbers: boolean;
  settings: SectionSetting[];
}

export interface PageLayout {
  height: number;
  width: number;
  hasPageNumbers: boolean;
  hasAnySection: boolean;
  pageCount: number;
  body: BodyLayout;
  header?: SectionLayout;
  footer?: SectionLayout;
  background?: SectionLayout;
}

interface CreatePageLayoutSettingsOpts {
  pageHeight: number;
  pageWidth: number;
  bodyHeightMinimumFactor: number;
}

/**
 * When the combined header + footer height exceeds the available page space
 * (leaving less than bodyHeightMinimumFactor of the page for the body),
 * proportionally reduce all section setting heights so they fit.
 *
 * Returns the original settings unchanged if no capping is needed,
 * or cloned settings with reduced heights if capping is required.
 */
function capOversizedSections(sectionSettings: SectionSettings, opts: CreatePageLayoutSettingsOpts): SectionSettings {
  const {pageHeight, bodyHeightMinimumFactor} = opts;
  if (!pageHeight) return sectionSettings;

  const headerHeight = getMaxHeight(sectionSettings.headers);
  const footerHeight = getMaxHeight(sectionSettings.footers);
  const totalSectionsHeight = headerHeight + footerHeight;
  if (!totalSectionsHeight) return sectionSettings;

  // +2 accounts for the overlap pixel added in calculatePageLayout
  const maxSectionsHeight = Math.floor(pageHeight * (1 - bodyHeightMinimumFactor)) + 2;
  if (totalSectionsHeight <= maxSectionsHeight) return sectionSettings;

  const scaleFactor = maxSectionsHeight / totalSectionsHeight;
  const capHeight = (s: SectionSetting): SectionSetting => ({...s, height: Math.floor(s.height * scaleFactor)});

  return {
    headers: sectionSettings.headers.map(capHeight),
    footers: sectionSettings.footers.map(capHeight),
    backgrounds: sectionSettings.backgrounds,
  };
}

export function createPageLayoutSettings(
  sectionSettings: SectionSettings | undefined,
  opts: CreatePageLayoutSettingsOpts
): PageLayout {
  const cappedSettings = sectionSettings ? capOversizedSections(sectionSettings, opts) : undefined;

  const pageLayout = calculatePageLayout(cappedSettings, opts);
  const transparentBg = !!sectionSettings?.backgrounds.length;

  const {headers = [], footers = [], backgrounds = []} = cappedSettings ?? {};

  const hasAnySection = !!(headers.length || footers.length || backgrounds.length);

  return {
    height: opts.pageHeight,
    width: opts.pageWidth,
    hasPageNumbers: hasPageNumbers(sectionSettings),
    hasAnySection,
    pageCount: 0,
    body: {
      ...pageLayout.body,
      transparentBg,
    },
    header: headers.length
      ? {
          ...pageLayout.header,
          transparentBg,
          hasPageNumbers: hasSectionPageNumbers(headers),
          settings: headers,
        }
      : undefined,
    footer: footers.length
      ? {
          ...pageLayout.footer,
          transparentBg,
          hasPageNumbers: hasSectionPageNumbers(footers),
          settings: footers,
        }
      : undefined,
    background: backgrounds.length
      ? {
          ...pageLayout.background,
          transparentBg: false,
          hasPageNumbers: hasSectionPageNumbers(backgrounds),
          settings: backgrounds,
        }
      : undefined,
  };
}
