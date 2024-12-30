import calculatePageLayout, {
  getMaxHeight,
} from '@app/utils/layout/calculate-page-layout';
import type { SectionSetting } from '@app/evaluators/section-settings';

describe('getMaxHeight', () => {
  test('returns 0 for empty array', () => {
    expect(getMaxHeight([])).toBe(0);
  });

  test('returns 0 for array of elements without height', () => {
    const els: SectionSetting[] = [{}, {}, {}] as SectionSetting[];
    expect(getMaxHeight(els)).toBe(0);
  });

  test('returns height of single element', () => {
    const el: SectionSetting = { height: 100 } as SectionSetting;
    expect(getMaxHeight([el])).toBe(100);
  });

  test('returns max height from multiple elements', () => {
    const els: SectionSetting[] = [
      { height: 100 },
      { height: 200 },
      { height: 150 },
    ] as SectionSetting[];
    expect(getMaxHeight(els)).toBe(200);
  });

  test('returns max height from multiple elements with malformed heights', () => {
    const els: SectionSetting[] = [
      { height: 50 },
      {},
      { height: undefined },
    ] as SectionSetting[];
    expect(getMaxHeight(els)).toBe(50);
  });
});

describe('calculatePageLayout', () => {
  test('calculates correct layout with standard sizes', () => {
    const settings = {
      headers: [{ height: 100 }, { height: 200 }] as SectionSetting[],
      footers: [{ height: 50 }, { height: 150 }] as SectionSetting[],
      backgrounds: [{ height: 500 }] as SectionSetting[],
    };
    const pageHeight = 1000;

    const result = calculatePageLayout(settings, pageHeight);
    expect(result).toEqual({
      header: { height: 200, y: 800 },
      footer: { height: 150, y: 0 },
      body: { height: 650, y: 151 },
      background: { height: 1000, y: 0 },
    });
  });

  test('throws error when header/footer too big', () => {
    const settings = {
      headers: [{ height: 1000 }] as SectionSetting[],
      footers: [{ height: 1000 }] as SectionSetting[],
      backgrounds: [{ height: 1000 }] as SectionSetting[],
    };
    const pageHeight = 1000;

    expect(() => calculatePageLayout(settings, pageHeight)).toThrow(
      `Header/footer too big. Page height: 1000px, header: 1000px, footer: 1000px, body: -1000px.`
    );
  });

  test('handles zero heights', () => {
    const settings = {
      headers: [{ height: 0 }] as SectionSetting[],
      footers: [{ height: 0 }] as SectionSetting[],
      backgrounds: [{ height: 0 }] as SectionSetting[],
    };
    const pageHeight = 1000;

    const result = calculatePageLayout(settings, pageHeight);
    expect(result).toEqual({
      header: { height: 0, y: 1000 },
      footer: { height: 0, y: 0 },
      body: { height: 1000, y: 1 },
      background: { height: 1000, y: 0 },
    });
  });
});
