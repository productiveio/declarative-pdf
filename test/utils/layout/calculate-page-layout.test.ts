/**
 * @jest-environment node
 */
import calculatePageLayout, {getMaxHeight} from '@app/utils/layout/calculate-page-layout';
import type {SectionSetting} from '@app/evaluators/section-settings';

describe('getMaxHeight', () => {
  test('returns 0 for empty array', () => {
    expect(getMaxHeight([])).toBe(0);
  });

  test('returns 0 for array of elements without height', () => {
    const els: SectionSetting[] = [{}, {}, {}] as SectionSetting[];
    expect(getMaxHeight(els)).toBe(0);
  });

  test('returns height of single element', () => {
    const el: SectionSetting = {height: 100} as SectionSetting;
    expect(getMaxHeight([el])).toBe(100);
  });

  test('returns max height from multiple elements', () => {
    const els: SectionSetting[] = [{height: 100}, {height: 200}, {height: 150}] as SectionSetting[];
    expect(getMaxHeight(els)).toBe(200);
  });

  test('returns max height from multiple elements with malformed heights', () => {
    const els: SectionSetting[] = [{height: 50}, {}, {height: undefined}] as SectionSetting[];
    expect(getMaxHeight(els)).toBe(50);
  });
});

describe('calculatePageLayout', () => {
  const makeLayoutOpts = (opts?: {
    height?: number;
    width?: number;
    factor?: number;
  }): {pageHeight: number; pageWidth: number; bodyHeightMinimumFactor: number} => ({
    pageHeight: opts?.height ?? 1000,
    pageWidth: opts?.width ?? 800,
    bodyHeightMinimumFactor: opts?.factor ?? 1 / 3,
  });

  test('calculates correct layout with standard sizes', () => {
    const settings = {
      headers: [{height: 100}, {height: 200}] as SectionSetting[],
      footers: [{height: 50}, {height: 150}] as SectionSetting[],
      backgrounds: [{height: 500}] as SectionSetting[],
    };

    const result = calculatePageLayout(settings, makeLayoutOpts());
    expect(result).toEqual({
      headerDelta: 0,
      header: {width: 800, height: 200, x: 0, y: 800},
      footer: {width: 800, height: 150, x: 0, y: -1},
      body: {width: 800, height: 652, x: 0, y: 149},
      background: {width: 800, height: 1000, x: 0, y: 0},
    });
  });

  test('throws error when header/footer too big', () => {
    const settings = {
      headers: [{height: 1000}] as SectionSetting[],
      footers: [{height: 1000}] as SectionSetting[],
      backgrounds: [{height: 1000}] as SectionSetting[],
    };

    expect(() => calculatePageLayout(settings, makeLayoutOpts())).toThrow(
      `Header/footer too big. Page height: 1000px, header: 1000px, footer: 1000px, body: -998px.`
    );
  });

  test('throws error when page height is zero', () => {
    const result = calculatePageLayout(undefined, makeLayoutOpts({height: 0, width: 0}));
    expect(result).toEqual({
      headerDelta: 0,
      header: {width: 0, height: 0, x: 0, y: 0},
      footer: {width: 0, height: 0, x: 0, y: 0},
      body: {width: 0, height: 0, x: 0, y: 0},
      background: {width: 0, height: 0, x: 0, y: 0},
    });
  });

  test('handles zero heights', () => {
    const settings = {
      headers: [{height: 0}] as SectionSetting[],
      footers: [{height: 0}] as SectionSetting[],
      backgrounds: [{height: 0}] as SectionSetting[],
    };

    const result = calculatePageLayout(settings, makeLayoutOpts());
    expect(result).toEqual({
      headerDelta: 0,
      header: {width: 800, height: 0, x: 0, y: 1000},
      footer: {width: 800, height: 0, x: 0, y: 0},
      body: {width: 800, height: 1002, x: 0, y: -1},
      background: {width: 800, height: 1000, x: 0, y: 0},
    });
  });

  describe('dynamicHeader', () => {
    const dynamicOpts = {...makeLayoutOpts(), dynamicHeader: true};

    test('sizes the body for the default header (not max) and reserves the first-page delta', () => {
      const settings = {
        headers: [
          {height: 250, physicalPageType: 'first'},
          {height: 100, physicalPageType: 'default'},
        ] as SectionSetting[],
        footers: [{height: 50, physicalPageType: 'default'}] as SectionSetting[],
        backgrounds: [] as SectionSetting[],
      };

      const result = calculatePageLayout(settings, dynamicOpts);
      // header band + body use the default header (100), not the max (250)
      expect(result.header).toEqual({width: 800, height: 100, x: 0, y: 900});
      expect(result.body).toEqual({width: 800, height: 852, x: 0, y: 49});
      // first page reserves the extra 150px
      expect(result.headerDelta).toBe(150);
    });

    test('headerDelta is 0 when only a default header variant exists', () => {
      const settings = {
        headers: [{height: 100, physicalPageType: 'default'}] as SectionSetting[],
        footers: [] as SectionSetting[],
        backgrounds: [] as SectionSetting[],
      };

      const result = calculatePageLayout(settings, dynamicOpts);
      expect(result.header.height).toBe(100);
      expect(result.headerDelta).toBe(0);
    });

    test('treats a single non-variant header as both default and first (delta 0)', () => {
      const settings = {
        headers: [{height: 120}] as SectionSetting[],
        footers: [] as SectionSetting[],
        backgrounds: [] as SectionSetting[],
      };

      const result = calculatePageLayout(settings, dynamicOpts);
      expect(result.header.height).toBe(120);
      expect(result.headerDelta).toBe(0);
    });

    test('uses 0 as default height when only a first variant exists (blank header elsewhere)', () => {
      const settings = {
        headers: [{height: 250, physicalPageType: 'first'}] as SectionSetting[],
        footers: [] as SectionSetting[],
        backgrounds: [] as SectionSetting[],
      };

      const result = calculatePageLayout(settings, dynamicOpts);
      expect(result.header.height).toBe(0);
      expect(result.headerDelta).toBe(250);
    });
  });
});
