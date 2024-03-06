import type { SectionVariantSetting } from '@app/models/document-page';
import { selectVariant } from '@app/utils/physical-pages';
import Variant from '@app/consts/physical-page';

type MockSetting = Partial<SectionVariantSetting>;
const makeSetting = (opts: MockSetting) => {
  const setting: SectionVariantSetting = {
    sectionHeight: 20,
    sectionType: 'header',
    hasCurrentPageNumber: true,
    hasTotalPagesNumber: true,
    physicalPageIndex: 0,
    physicalPageType: 'default',
    ...opts,
  };
  return setting;
};

describe('selectVariant', () => {
  test('returns correct variant from filled set', () => {
    const variants1 = [
      makeSetting({ physicalPageIndex: 11, physicalPageType: Variant.FIRST }),
      makeSetting({ physicalPageIndex: 12, physicalPageType: Variant.LAST }),
      makeSetting({ physicalPageIndex: 13, physicalPageType: Variant.ODD }),
      makeSetting({ physicalPageIndex: 14, physicalPageType: Variant.EVEN }),
      makeSetting({ physicalPageIndex: 15, physicalPageType: Variant.DEFAULT }),
    ];
    const variants2 = [
      makeSetting({ physicalPageIndex: 21, physicalPageType: Variant.FIRST }),
      makeSetting({ physicalPageIndex: 22, physicalPageType: Variant.LAST }),
      makeSetting({ physicalPageIndex: 23, physicalPageType: Variant.ODD }),
      makeSetting({ physicalPageIndex: 24, physicalPageType: Variant.EVEN }),
      makeSetting({ physicalPageIndex: 25 }),
    ];
    const variants3 = [
      makeSetting({ physicalPageIndex: 31, physicalPageType: Variant.ODD }),
      makeSetting({ physicalPageIndex: 32, physicalPageType: Variant.EVEN }),
      makeSetting({ physicalPageIndex: 33, physicalPageType: Variant.DEFAULT }),
    ];
    const variants4 = [
      makeSetting({ physicalPageIndex: 41, physicalPageType: Variant.FIRST }),
      makeSetting({ physicalPageIndex: 42, physicalPageType: Variant.LAST }),
      makeSetting({ physicalPageIndex: 43, physicalPageType: Variant.DEFAULT }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.physicalPageIndex).toBe(14);
    expect(selectVariant(variants1, 2, 0, 5)?.physicalPageIndex).toBe(13);
    expect(selectVariant(variants1, 3, 0, 5)?.physicalPageIndex).toBe(14);
    expect(selectVariant(variants1, 4, 0, 5)?.physicalPageIndex).toBe(12);

    expect(selectVariant(variants2, 0, 5, 5)?.physicalPageIndex).toBe(21);
    expect(selectVariant(variants2, 1, 5, 5)?.physicalPageIndex).toBe(23);
    expect(selectVariant(variants2, 2, 5, 5)?.physicalPageIndex).toBe(24);
    expect(selectVariant(variants2, 3, 5, 5)?.physicalPageIndex).toBe(23);
    expect(selectVariant(variants2, 4, 5, 5)?.physicalPageIndex).toBe(22);

    expect(selectVariant(variants3, 0, 10, 4)?.physicalPageIndex).toBe(31);
    expect(selectVariant(variants3, 1, 10, 4)?.physicalPageIndex).toBe(32);
    expect(selectVariant(variants3, 2, 10, 4)?.physicalPageIndex).toBe(31);
    expect(selectVariant(variants3, 3, 10, 4)?.physicalPageIndex).toBe(32);

    expect(selectVariant(variants4, 0, 14, 4)?.physicalPageIndex).toBe(41);
    expect(selectVariant(variants4, 1, 14, 4)?.physicalPageIndex).toBe(43);
    expect(selectVariant(variants4, 2, 14, 4)?.physicalPageIndex).toBe(43);
    expect(selectVariant(variants4, 3, 14, 4)?.physicalPageIndex).toBe(42);
  });

  test('returns correct variant from partial set with default fallback', () => {
    const variants1 = [
      makeSetting({ physicalPageIndex: 11, physicalPageType: Variant.FIRST }),
      makeSetting({ physicalPageIndex: 12, physicalPageType: Variant.DEFAULT }),
    ];
    const variants2 = [
      makeSetting({ physicalPageIndex: 21, physicalPageType: Variant.LAST }),
      makeSetting({ physicalPageIndex: 22, physicalPageType: Variant.DEFAULT }),
    ];
    const variants3 = [
      makeSetting({ physicalPageIndex: 31, physicalPageType: Variant.EVEN }),
      makeSetting({ physicalPageIndex: 32, physicalPageType: Variant.DEFAULT }),
    ];
    const variants4 = [
      makeSetting({ physicalPageIndex: 41, physicalPageType: Variant.ODD }),
      makeSetting({ physicalPageIndex: 42, physicalPageType: Variant.DEFAULT }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectVariant(variants1, 2, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectVariant(variants1, 3, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectVariant(variants1, 4, 0, 5)?.physicalPageIndex).toBe(12);

    expect(selectVariant(variants2, 0, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 1, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 2, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 3, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 4, 5, 5)?.physicalPageIndex).toBe(21);

    expect(selectVariant(variants3, 0, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectVariant(variants3, 1, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectVariant(variants3, 2, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectVariant(variants3, 3, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectVariant(variants3, 4, 10, 5)?.physicalPageIndex).toBe(32);

    expect(selectVariant(variants4, 0, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectVariant(variants4, 1, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectVariant(variants4, 2, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectVariant(variants4, 3, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectVariant(variants4, 4, 15, 5)?.physicalPageIndex).toBe(42);
  });

  test('returns correct variant from partial set with undefined fallback', () => {
    const variants1 = [
      makeSetting({ physicalPageIndex: 11, physicalPageType: Variant.FIRST }),
      makeSetting({ physicalPageIndex: 12 }),
    ];
    const variants2 = [
      makeSetting({ physicalPageIndex: 21, physicalPageType: Variant.LAST }),
      makeSetting({ physicalPageIndex: 22 }),
    ];
    const variants3 = [
      makeSetting({ physicalPageIndex: 31, physicalPageType: Variant.EVEN }),
      makeSetting({ physicalPageIndex: 32 }),
    ];
    const variants4 = [
      makeSetting({ physicalPageIndex: 41, physicalPageType: Variant.ODD }),
      makeSetting({ physicalPageIndex: 42 }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectVariant(variants1, 2, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectVariant(variants1, 3, 0, 5)?.physicalPageIndex).toBe(12);
    expect(selectVariant(variants1, 4, 0, 5)?.physicalPageIndex).toBe(12);

    expect(selectVariant(variants2, 0, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 1, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 2, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 3, 5, 5)?.physicalPageIndex).toBe(22);
    expect(selectVariant(variants2, 4, 5, 5)?.physicalPageIndex).toBe(21);

    expect(selectVariant(variants3, 0, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectVariant(variants3, 1, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectVariant(variants3, 2, 10, 5)?.physicalPageIndex).toBe(32);
    expect(selectVariant(variants3, 3, 10, 5)?.physicalPageIndex).toBe(31);
    expect(selectVariant(variants3, 4, 10, 5)?.physicalPageIndex).toBe(32);

    expect(selectVariant(variants4, 0, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectVariant(variants4, 1, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectVariant(variants4, 2, 15, 5)?.physicalPageIndex).toBe(42);
    expect(selectVariant(variants4, 3, 15, 5)?.physicalPageIndex).toBe(41);
    expect(selectVariant(variants4, 4, 15, 5)?.physicalPageIndex).toBe(42);
  });

  test('returns correct variant from single element set', () => {
    const variants1 = [
      makeSetting({ physicalPageIndex: 11, physicalPageType: Variant.FIRST }),
    ];
    const variants2 = [
      makeSetting({ physicalPageIndex: 21, physicalPageType: Variant.LAST }),
    ];
    const variants3 = [
      makeSetting({ physicalPageIndex: 31, physicalPageType: Variant.EVEN }),
    ];
    const variants4 = [
      makeSetting({ physicalPageIndex: 41, physicalPageType: Variant.ODD }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.physicalPageIndex).toBe(11);
    expect(
      selectVariant(variants1, 1, 0, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(
      selectVariant(variants1, 2, 0, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(
      selectVariant(variants1, 3, 0, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(
      selectVariant(variants1, 4, 0, 5)?.physicalPageIndex
    ).toBeUndefined();

    expect(
      selectVariant(variants2, 0, 5, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(
      selectVariant(variants2, 1, 5, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(
      selectVariant(variants2, 2, 5, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(
      selectVariant(variants2, 3, 5, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(selectVariant(variants2, 4, 5, 5)?.physicalPageIndex).toBe(21);

    expect(
      selectVariant(variants3, 0, 10, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(selectVariant(variants3, 1, 10, 5)?.physicalPageIndex).toBe(31);
    expect(
      selectVariant(variants3, 2, 10, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(selectVariant(variants3, 3, 10, 5)?.physicalPageIndex).toBe(31);
    expect(
      selectVariant(variants3, 4, 10, 5)?.physicalPageIndex
    ).toBeUndefined();

    expect(
      selectVariant(variants4, 0, 15, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(selectVariant(variants4, 1, 15, 5)?.physicalPageIndex).toBe(41);
    expect(
      selectVariant(variants4, 2, 15, 5)?.physicalPageIndex
    ).toBeUndefined();
    expect(selectVariant(variants4, 3, 15, 5)?.physicalPageIndex).toBe(41);
    expect(
      selectVariant(variants4, 4, 15, 5)?.physicalPageIndex
    ).toBeUndefined();
  });
});
