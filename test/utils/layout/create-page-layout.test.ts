/**
 * @jest-environment node
 */
import {createPageLayoutSettings} from '@app/utils/layout/create-page-layout';
import type {SectionSetting, SectionSettings} from '@app/evaluators/section-settings';

describe('createPageLayoutSettings', () => {
  const makeBasicSettings = (): SectionSettings => ({
    headers: [],
    footers: [],
    backgrounds: [],
  });

  const makeSectionSetting = (props: Partial<SectionSetting> = {}): SectionSetting => ({
    height: 100,
    hasCurrentPageNumber: false,
    hasTotalPagesNumber: false,
    ...props,
  });

  test('creates basic layout with empty sections', () => {
    const settings = makeBasicSettings();
    const result = createPageLayoutSettings(settings, 1000, 500);

    expect(result).toEqual({
      height: 1000,
      width: 500,
      hasPageNumbers: false,
      hasAnySection: false,
      pageCount: 0,
      body: {
        width: 500,
        height: 1000,
        x: 0,
        y: 0,
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

    const result = createPageLayoutSettings(settings, 1000, 500);

    expect(result).toEqual({
      height: 1000,
      width: 500,
      hasPageNumbers: false,
      hasAnySection: true,
      pageCount: 0,
      body: {
        width: 500,
        height: 1000,
        x: 0,
        y: 0,
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

    const result = createPageLayoutSettings(settings, 1000, 500);

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

    const result = createPageLayoutSettings(settings, 1000, 500);

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

    const result = createPageLayoutSettings(settings, 1000, 500);

    expect(result.header?.height).toBe(200);
    expect(result.header?.y).toBe(800); // 1000 - 200
    expect(result.footer?.height).toBe(150);
    expect(result.footer?.y).toBe(0);
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

    const result = createPageLayoutSettings(settings, 1000, 500);

    expect(result.header?.settings).toEqual([headerSetting]);
    expect(result.footer?.settings).toEqual([footerSetting]);
    expect(result.background?.settings).toEqual([backgroundSetting]);
  });

  test('creates zero layout when no settings are provided', () => {
    const result = createPageLayoutSettings();

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
});
