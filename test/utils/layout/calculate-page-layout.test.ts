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
      header: {width: 800, height: 0, x: 0, y: 1000},
      footer: {width: 800, height: 0, x: 0, y: 0},
      body: {width: 800, height: 1002, x: 0, y: -1},
      background: {width: 800, height: 1000, x: 0, y: 0},
    });
  });
});
