import calculatePageLayout from '@app/utils/layout/calculate-page-layout';
import {
  hasPageNumbers,
  hasSectionPageNumbers,
} from '@app/utils/layout/has-page-numbers';

import type {
  SectionSettings,
  SectionSetting,
} from '@app/evaluators/section-settings';

export interface SectionLayout {
  height: number;
  y: number;
  transparentBg: boolean;
  hasPageNumbers: boolean;
  settings: SectionSetting[];
}

export interface BodyLayout {
  height: number;
  y: number;
  transparentBg: boolean;
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

function createSection(opts: {
  elements?: SectionSetting[];
  layout: { height: number; y: number };
  transparentBg: boolean;
}) {
  if (!opts.elements?.length) return undefined;

  return {
    height: opts.layout.height,
    y: opts.layout.y,
    transparentBg: opts.transparentBg,
    hasPageNumbers: hasSectionPageNumbers(opts.elements),
    settings: opts.elements,
  };
}

export function createPageLayoutSettings(
  sectionSettings?: SectionSettings,
  pageHeight: number = 0,
  pageWidth: number = 0
): PageLayout {
  const pageLayout = calculatePageLayout(sectionSettings, pageHeight);
  const transparentBg = !!sectionSettings?.backgrounds.length;

  const {
    headers = [],
    footers = [],
    backgrounds = [],
  } = sectionSettings ?? {};

  const hasAnySection = !!(
    headers.length ||
    footers.length ||
    backgrounds.length
  );

  return {
    height: pageHeight,
    width: pageWidth,
    hasPageNumbers: hasPageNumbers(sectionSettings),
    hasAnySection,
    pageCount: 0,
    body: {
      height: pageLayout.body.height,
      y: pageLayout.body.y,
      transparentBg,
    },
    header: createSection({
      elements: headers,
      layout: pageLayout.header,
      transparentBg,
    }),
    footer: createSection({
      elements: footers,
      layout: pageLayout.footer,
      transparentBg,
    }),
    background: createSection({
      elements: backgrounds,
      layout: pageLayout.background,
      transparentBg: false,
    }),
  };
}
