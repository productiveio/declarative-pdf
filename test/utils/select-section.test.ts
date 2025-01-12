import {selectSection} from '@app/utils/select-section';
import Variant from '@app/consts/physical-page';

import type {SectionSetting} from '@app/evaluators/section-settings';

const makeSetting = (opts: Partial<SectionSetting>) => {
  const setting: SectionSetting = {
    height: 20,
    hasCurrentPageNumber: true,
    hasTotalPagesNumber: true,
    physicalPageIndex: 0,
    physicalPageType: 'default',
    ...opts,
  };
  return setting;
};

const makeMinimumSetting = (opts: Partial<SectionSetting>) => {
  const setting: SectionSetting = {
    height: 20,
    hasCurrentPageNumber: false,
    hasTotalPagesNumber: false,
    ...opts,
  };
  return setting;
};

describe('selectSection', () => {
  test('returns correct variant from filled set', () => {
    const variants1 = [
      makeSetting({physicalPageIndex: 11, physicalPageType: Variant.FIRST}),
      makeSetting({physicalPageIndex: 12, physicalPageType: Variant.LAST}),
      makeSetting({physicalPageIndex: 13, physicalPageType: Variant.ODD}),
      makeSetting({physicalPageIndex: 14, physicalPageType: Variant.EVEN}),
      makeSetting({physicalPageIndex: 15, physicalPageType: Variant.DEFAULT}),
    ];
    const variants2 = [
      makeSetting({physicalPageIndex: 21, physicalPageType: Variant.FIRST}),
      makeSetting({physicalPageIndex: 22, physicalPageType: Variant.LAST}),
      makeSetting({physicalPageIndex: 23, physicalPageType: Variant.ODD}),
      makeSetting({physicalPageIndex: 24, physicalPageType: Variant.EVEN}),
      makeSetting({physicalPageIndex: 25}),
    ];
    const variants3 = [
      makeSetting({physicalPageIndex: 31, physicalPageType: Variant.ODD}),
      makeSetting({physicalPageIndex: 32, physicalPageType: Variant.EVEN}),
      makeSetting({physicalPageIndex: 33, physicalPageType: Variant.DEFAULT}),
    ];
    const variants4 = [
      makeSetting({physicalPageIndex: 41, physicalPageType: Variant.FIRST}),
      makeSetting({physicalPageIndex: 42, physicalPageType: Variant.LAST}),
      makeSetting({physicalPageIndex: 43, physicalPageType: Variant.DEFAULT}),
    ];

    expect(selectSection(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectSection(variants1, 1, 0, 5)?.physicalPageIndex).toBe(14);
    expect(selectSection(variants1, 2, 0, 5)?.physicalPageIndex).toBe(13);
    expect(selectSection(variants1, 3, 0, 5)?.physicalPageIndex).toBe(14);
    expect(selectSection(variants1, 4, 0, 5)?.physicalPageIndex).toBe(12);

    expect(selectSection(variants2, 0, 5, 5)?.physicalPageIndex).toBe(21);
    expect(selectSection(variants2, 1, 5, 5)?.physicalPageIndex).toBe(23);
    expect(selectSection(variants2, 2, 5, 5)?.physicalPageIndex).toBe(24);
    expect(selectSection(variants2, 3, 5, 5)?.physicalPageIndex).toBe(23);
    expect(selectSection(variants2, 4, 5, 5)?.physicalPageIndex).toBe(22);

    expect(selectSection(variants3, 0, 10, 4)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 1, 10, 4)?.physicalPageIndex).toBe(32);
    expect(selectSection(variants3, 2, 10, 4)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 3, 10, 4)?.physicalPageIndex).toBe(32);

    expect(selectSection(variants4, 0, 14, 4)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 1, 14, 4)?.physicalPageIndex).toBe(43);
    expect(selectSection(variants4, 2, 14, 4)?.physicalPageIndex).toBe(43);
    expect(selectSection(variants4, 3, 14, 4)?.physicalPageIndex).toBe(42);
  });

  test('returns correct variant from partial set with default fallback', () => {
    const variants1 = [
      makeSetting({physicalPageIndex: 11, physicalPageType: Variant.FIRST}),
      makeSetting({physicalPageIndex: 12, physicalPageType: Variant.DEFAULT}),
    ];
    const variants2 = [
      makeSetting({physicalPageIndex: 21, physicalPageType: Variant.LAST}),
      makeSetting({physicalPageIndex: 22, physicalPageType: Variant.DEFAULT}),
    ];
    const variants3 = [
      makeSetting({physicalPageIndex: 31, physicalPageType: Variant.EVEN}),
      makeSetting({physicalPageIndex: 32, physicalPageType: Variant.DEFAULT}),
    ];
    const variants4 = [
      makeSetting({physicalPageIndex: 41, physicalPageType: Variant.ODD}),
      makeSetting({physicalPageIndex: 42, physicalPageType: Variant.DEFAULT}),
    ];

    expect(selectSection(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectSection(variants1, 1, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectSection(variants1, 2, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectSection(variants1, 3, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectSection(variants1, 4, 0, 5)?.physicalPageIndex).toBe(12);

    expect(selectSection(variants2, 0, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 1, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 2, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 3, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 4, 5, 5)?.physicalPageIndex).toBe(21);

    expect(selectSection(variants3, 0, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectSection(variants3, 1, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 2, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectSection(variants3, 3, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 4, 10, 5)?.physicalPageIndex).toBe(32);

    expect(selectSection(variants4, 0, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectSection(variants4, 1, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 2, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectSection(variants4, 3, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 4, 15, 5)?.physicalPageIndex).toBe(42);
  });

  test('returns correct variant from partial set with undefined fallback', () => {
    const variants1 = [
      makeSetting({physicalPageIndex: 11, physicalPageType: Variant.FIRST}),
      makeSetting({physicalPageIndex: 12}),
    ];
    const variants2 = [
      makeSetting({physicalPageIndex: 21, physicalPageType: Variant.LAST}),
      makeSetting({physicalPageIndex: 22}),
    ];
    const variants3 = [
      makeSetting({physicalPageIndex: 31, physicalPageType: Variant.EVEN}),
      makeSetting({physicalPageIndex: 32}),
    ];
    const variants4 = [
      makeSetting({physicalPageIndex: 41, physicalPageType: Variant.ODD}),
      makeSetting({physicalPageIndex: 42}),
    ];

    expect(selectSection(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectSection(variants1, 1, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectSection(variants1, 2, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectSection(variants1, 3, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectSection(variants1, 4, 0, 5)?.physicalPageIndex).toBe(12);

    expect(selectSection(variants2, 0, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 1, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 2, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 3, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectSection(variants2, 4, 5, 5)?.physicalPageIndex).toBe(21);

    expect(selectSection(variants3, 0, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectSection(variants3, 1, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 2, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectSection(variants3, 3, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 4, 10, 5)?.physicalPageIndex).toBe(32);

    expect(selectSection(variants4, 0, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectSection(variants4, 1, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 2, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectSection(variants4, 3, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 4, 15, 5)?.physicalPageIndex).toBe(42);
  });

  test('returns correct variant from single element set', () => {
    const variants1 = [makeSetting({physicalPageIndex: 11, physicalPageType: Variant.FIRST})];
    const variants2 = [makeSetting({physicalPageIndex: 21, physicalPageType: Variant.LAST})];
    const variants3 = [makeSetting({physicalPageIndex: 31, physicalPageType: Variant.EVEN})];
    const variants4 = [makeSetting({physicalPageIndex: 41, physicalPageType: Variant.ODD})];

    expect(selectSection(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectSection(variants1, 1, 0, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants1, 2, 0, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants1, 3, 0, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants1, 4, 0, 5)?.physicalPageIndex).toBeUndefined();

    expect(selectSection(variants2, 0, 5, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants2, 1, 5, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants2, 2, 5, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants2, 3, 5, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants2, 4, 5, 5)?.physicalPageIndex).toBe(21);

    expect(selectSection(variants3, 0, 10, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants3, 1, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 2, 10, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants3, 3, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectSection(variants3, 4, 10, 5)?.physicalPageIndex).toBeUndefined();

    expect(selectSection(variants4, 0, 15, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants4, 1, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 2, 15, 5)?.physicalPageIndex).toBeUndefined();
    expect(selectSection(variants4, 3, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectSection(variants4, 4, 15, 5)?.physicalPageIndex).toBeUndefined();
  });

  test('returns first setting from minimum settings set', () => {
    const settings1 = [makeMinimumSetting({}), makeMinimumSetting({})];

    expect(selectSection(settings1, 0, 0, 2)).toBe(settings1[0]);
    expect(selectSection(settings1, 1, 0, 2)).toBe(settings1[0]);
    expect(selectSection(settings1, 0, 1, 2)).toBe(settings1[0]);
    expect(selectSection(settings1, 1, 1, 2)).toBe(settings1[0]);
  });

  test('returns undefined from empty set', () => {
    const settings1: SectionSetting[] = [];

    expect(selectSection(settings1, 1, 2, 6)).toBeUndefined();
  });
});
