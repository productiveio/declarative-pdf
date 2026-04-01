/**
 * @jest-environment node
 */
import {createPageLayoutSettings} from '@app/utils/layout/create-page-layout-settings';
import type {SectionSetting, SectionSettings} from '@app/evaluators/section-settings';

describe('createPageLayoutSettings', () => {
  const makeBasicSettings = (): SectionSettings => ({
    headers: [],
    footers: [],
    backgrounds: [],
  });

  const makeLayoutOpts = (opts?: {
    height?: number;
    width?: number;
    factor?: number;
  }): {pageHeight: number; pageWidth: number; bodyHeightMinimumFactor: number} => ({
    pageHeight: opts?.height ?? 1000,
    pageWidth: opts?.width ?? 500,
    bodyHeightMinimumFactor: opts?.factor ?? 1 / 3,
  });

  const makeSectionSetting = (props: Partial<SectionSetting> = {}): SectionSetting => ({
    height: 100,
    hasCurrentPageNumber: false,
    hasTotalPagesNumber: false,
    ...props,
  });

  test('creates basic layout with empty sections', () => {
    const settings = makeBasicSettings();
    const result = createPageLayoutSettings(settings, makeLayoutOpts());

    expect(result).toEqual({
      height: 1000,
      width: 500,
      hasPageNumbers: false,
      hasAnySection: false,
      pageCount: 0,
      body: {
        width: 500,
        height: 1002,
        x: 0,
        y: -1,
        transparentBg: false,
      },
      header: undefined,
      footer: undefined,
      background: undefined,
    });
  });

  test('creates basic layout with background section', () => {
    const settings: SectionSettings = {
      headers: [],
      footers: [],
      backgrounds: [makeSectionSetting()],
    };

    const result = createPageLayoutSettings(settings, makeLayoutOpts());

    expect(result).toEqual({
      height: 1000,
      width: 500,
      hasPageNumbers: false,
      hasAnySection: true,
      pageCount: 0,
      body: {
        width: 500,
        height: 1002,
        x: 0,
        y: -1,
        transparentBg: true,
      },
      header: undefined,
      footer: undefined,
      background: {
        width: 500,
        height: 1000,
        x: 0,
        y: 0,
        transparentBg: false,
        hasPageNumbers: false,
        settings: [
          {
            height: 100,
            hasCurrentPageNumber: false,
            hasTotalPagesNumber: false,
          },
        ],
      },
    });
  });

  test('handles sections with page numbers', () => {
    const settings: SectionSettings = {
      headers: [makeSectionSetting({hasCurrentPageNumber: true})],
      footers: [makeSectionSetting({hasTotalPagesNumber: true})],
      backgrounds: [],
    };

    const result = createPageLayoutSettings(settings, makeLayoutOpts());

    expect(result.hasPageNumbers).toBe(true);
    expect(result.hasAnySection).toBe(true);
    expect(result.header?.hasPageNumbers).toBe(true);
    expect(result.footer?.hasPageNumbers).toBe(true);
    expect(result.background).not.toBeDefined();
  });

  test('sets transparent background for sections when background element exists', () => {
    const settings: SectionSettings = {
      headers: [makeSectionSetting()],
      footers: [makeSectionSetting()],
      backgrounds: [makeSectionSetting()],
    };

    const result = createPageLayoutSettings(settings, makeLayoutOpts());

    expect(result.header?.transparentBg).toBe(true);
    expect(result.footer?.transparentBg).toBe(true);
    expect(result.background?.transparentBg).toBe(false);
  });

  test('calculates correct section heights and positions', () => {
    const settings: SectionSettings = {
      headers: [makeSectionSetting({height: 200})],
      footers: [makeSectionSetting({height: 150})],
      backgrounds: [makeSectionSetting({height: 1000})],
    };

    const result = createPageLayoutSettings(settings, makeLayoutOpts());

    expect(result.header?.height).toBe(200);
    expect(result.header?.y).toBe(800); // 1000 - 200
    expect(result.footer?.height).toBe(150);
    expect(result.footer?.y).toBe(-1);
    expect(result.background?.height).toBe(1000);
    expect(result.background?.y).toBe(0);
  });

  test('preserves section settings in output', () => {
    const headerSetting = makeSectionSetting({height: 100});
    const footerSetting = makeSectionSetting({height: 150});
    const backgroundSetting = makeSectionSetting({height: 1000});

    const settings: SectionSettings = {
      headers: [headerSetting],
      footers: [footerSetting],
      backgrounds: [backgroundSetting],
    };

    const result = createPageLayoutSettings(settings, makeLayoutOpts());

    expect(result.header?.settings).toEqual([headerSetting]);
    expect(result.footer?.settings).toEqual([footerSetting]);
    expect(result.background?.settings).toEqual([backgroundSetting]);
  });

  test('creates zero layout when no settings are provided', () => {
    const result = createPageLayoutSettings(undefined, makeLayoutOpts({height: 0, width: 0}));

    expect(result).toEqual({
      height: 0,
      width: 0,
      hasPageNumbers: false,
      hasAnySection: false,
      pageCount: 0,
      body: {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        transparentBg: false,
      },
      header: undefined,
      footer: undefined,
      background: undefined,
    });
  });

  describe('oversized header/footer capping', () => {
    test('caps header and footer proportionally when they exceed available page space', () => {
      // Reproduces the real-world bug: A4 page (842px), header 274px, footer 701px
      // Without capping: body = 842 - 274 - 701 + 2 = -131px → would throw
      const settings: SectionSettings = {
        headers: [makeSectionSetting({height: 274})],
        footers: [makeSectionSetting({height: 701})],
        backgrounds: [],
      };

      const result = createPageLayoutSettings(settings, makeLayoutOpts({height: 842, width: 595, factor: 0.3}));

      // Should not throw — sections are capped to fit
      expect(result.body.height).toBeGreaterThan(0);
      expect(result.body.height).toBeGreaterThanOrEqual(Math.floor(842 * 0.3));

      // Capped settings should have reduced heights
      const cappedHeaderHeight = result.header!.settings[0].height;
      const cappedFooterHeight = result.footer!.settings[0].height;
      expect(cappedHeaderHeight).toBeLessThan(274);
      expect(cappedFooterHeight).toBeLessThan(701);

      // Proportions should be preserved
      const originalRatio = 274 / 701;
      const cappedRatio = cappedHeaderHeight / cappedFooterHeight;
      expect(cappedRatio).toBeCloseTo(originalRatio, 1);
    });

    test('does not cap sections when they fit within the page', () => {
      const settings: SectionSettings = {
        headers: [makeSectionSetting({height: 200})],
        footers: [makeSectionSetting({height: 150})],
        backgrounds: [],
      };

      const result = createPageLayoutSettings(settings, makeLayoutOpts());

      expect(result.header!.settings[0].height).toBe(200);
      expect(result.footer!.settings[0].height).toBe(150);
    });

    test('caps all variants when multiple physical-page variants exist', () => {
      const settings: SectionSettings = {
        headers: [
          makeSectionSetting({height: 500, physicalPageType: 'first'}),
          makeSectionSetting({height: 400, physicalPageType: 'default'}),
        ],
        footers: [makeSectionSetting({height: 500})],
        backgrounds: [],
      };

      // max header = 500, footer = 500, total = 1000 > 1000 * (1 - 1/3) + 2 = 668
      const result = createPageLayoutSettings(settings, makeLayoutOpts());

      expect(result.header!.settings[0].height).toBeLessThan(500);
      expect(result.header!.settings[1].height).toBeLessThan(400);
      expect(result.footer!.settings[0].height).toBeLessThan(500);
      expect(result.body.height).toBeGreaterThan(0);
    });

    test('preserves page number flags on capped settings', () => {
      const settings: SectionSettings = {
        headers: [makeSectionSetting({height: 600, hasCurrentPageNumber: true})],
        footers: [makeSectionSetting({height: 600, hasTotalPagesNumber: true})],
        backgrounds: [],
      };

      const result = createPageLayoutSettings(settings, makeLayoutOpts());

      expect(result.hasPageNumbers).toBe(true);
      expect(result.header!.hasPageNumbers).toBe(true);
      expect(result.footer!.hasPageNumbers).toBe(true);
      expect(result.header!.settings[0].hasCurrentPageNumber).toBe(true);
      expect(result.footer!.settings[0].hasTotalPagesNumber).toBe(true);
    });

    test('does not modify background heights when capping', () => {
      const settings: SectionSettings = {
        headers: [makeSectionSetting({height: 600})],
        footers: [makeSectionSetting({height: 600})],
        backgrounds: [makeSectionSetting({height: 1000})],
      };

      const result = createPageLayoutSettings(settings, makeLayoutOpts());

      expect(result.background!.settings[0].height).toBe(1000);
    });
  });
});
