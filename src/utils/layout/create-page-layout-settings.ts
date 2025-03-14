import calculatePageLayout from '@app/utils/layout/calculate-page-layout';
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

export function createPageLayoutSettings(
  sectionSettings: SectionSettings | undefined,
  opts: CreatePageLayoutSettingsOpts
): PageLayout {
  const pageLayout = calculatePageLayout(sectionSettings, opts);
  const transparentBg = !!sectionSettings?.backgrounds.length;

  const {headers = [], footers = [], backgrounds = []} = sectionSettings ?? {};

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
