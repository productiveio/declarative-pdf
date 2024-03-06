import type { ElementSettings } from '@app/models/document-page';
import { selectVariant } from '@app/utils/layout';
import Variant from '@app/consts/physicalPageVariant';

type MockSetting = Partial<ElementSettings[number]>;
const makeSetting = (opts: MockSetting) => {
  const setting: ElementSettings[number] = {
    index: 0,
    type: 'header',
    subSelector: undefined,
    height: 20,
    hasCurrentPageNumber: true,
    hasTotalPagesNumber: true,
    ...opts,
  };
  return setting;
};

describe('selectVariant', () => {
  test('returns correct variant from filled set', () => {
    const variants1 = [
      makeSetting({ index: 11, subSelector: Variant.FIRST }),
      makeSetting({ index: 12, subSelector: Variant.LAST }),
      makeSetting({ index: 13, subSelector: Variant.ODD }),
      makeSetting({ index: 14, subSelector: Variant.EVEN }),
      makeSetting({ index: 15, subSelector: Variant.DEFAULT }),
    ];
    const variants2 = [
      makeSetting({ index: 21, subSelector: Variant.FIRST }),
      makeSetting({ index: 22, subSelector: Variant.LAST }),
      makeSetting({ index: 23, subSelector: Variant.ODD }),
      makeSetting({ index: 24, subSelector: Variant.EVEN }),
      makeSetting({ index: 25 }),
    ];
    const variants3 = [
      makeSetting({ index: 31, subSelector: Variant.ODD }),
      makeSetting({ index: 32, subSelector: Variant.EVEN }),
      makeSetting({ index: 33, subSelector: Variant.DEFAULT }),
    ];
    const variants4 = [
      makeSetting({ index: 41, subSelector: Variant.FIRST }),
      makeSetting({ index: 42, subSelector: Variant.LAST }),
      makeSetting({ index: 43, subSelector: Variant.DEFAULT }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBe(14);
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBe(13);
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBe(14);
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBe(12);

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBe(21);
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBe(23);
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBe(24);
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBe(23);
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(22);

    expect(selectVariant(variants3, 0, 10, 4)?.index).toBe(31);
    expect(selectVariant(variants3, 1, 10, 4)?.index).toBe(32);
    expect(selectVariant(variants3, 2, 10, 4)?.index).toBe(31);
    expect(selectVariant(variants3, 3, 10, 4)?.index).toBe(32);

    expect(selectVariant(variants4, 0, 14, 4)?.index).toBe(41);
    expect(selectVariant(variants4, 1, 14, 4)?.index).toBe(43);
    expect(selectVariant(variants4, 2, 14, 4)?.index).toBe(43);
    expect(selectVariant(variants4, 3, 14, 4)?.index).toBe(42);
  });

  test('returns correct variant from partial set with default fallback', () => {
    const variants1 = [
      makeSetting({ index: 11, subSelector: Variant.FIRST }),
      makeSetting({ index: 12, subSelector: Variant.DEFAULT }),
    ];
    const variants2 = [
      makeSetting({ index: 21, subSelector: Variant.LAST }),
      makeSetting({ index: 22, subSelector: Variant.DEFAULT }),
    ];
    const variants3 = [
      makeSetting({ index: 31, subSelector: Variant.EVEN }),
      makeSetting({ index: 32, subSelector: Variant.DEFAULT }),
    ];
    const variants4 = [
      makeSetting({ index: 41, subSelector: Variant.ODD }),
      makeSetting({ index: 42, subSelector: Variant.DEFAULT }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBe(12);
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBe(12);
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBe(12);
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBe(12);

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(21);

    expect(selectVariant(variants3, 0, 10, 5)?.index).toBe(32);
    expect(selectVariant(variants3, 1, 10, 5)?.index).toBe(31);
    expect(selectVariant(variants3, 2, 10, 5)?.index).toBe(32);
    expect(selectVariant(variants3, 3, 10, 5)?.index).toBe(31);
    expect(selectVariant(variants3, 4, 10, 5)?.index).toBe(32);

    expect(selectVariant(variants4, 0, 15, 5)?.index).toBe(42);
    expect(selectVariant(variants4, 1, 15, 5)?.index).toBe(41);
    expect(selectVariant(variants4, 2, 15, 5)?.index).toBe(42);
    expect(selectVariant(variants4, 3, 15, 5)?.index).toBe(41);
    expect(selectVariant(variants4, 4, 15, 5)?.index).toBe(42);
  });

  test('returns correct variant from partial set with undefined fallback', () => {
    const variants1 = [
      makeSetting({ index: 11, subSelector: Variant.FIRST }),
      makeSetting({ index: 12 }),
    ];
    const variants2 = [
      makeSetting({ index: 21, subSelector: Variant.LAST }),
      makeSetting({ index: 22 }),
    ];
    const variants3 = [
      makeSetting({ index: 31, subSelector: Variant.EVEN }),
      makeSetting({ index: 32 }),
    ];
    const variants4 = [
      makeSetting({ index: 41, subSelector: Variant.ODD }),
      makeSetting({ index: 42 }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBe(12);
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBe(12);
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBe(12);
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBe(12);

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBe(22);
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(21);

    expect(selectVariant(variants3, 0, 10, 5)?.index).toBe(32);
    expect(selectVariant(variants3, 1, 10, 5)?.index).toBe(31);
    expect(selectVariant(variants3, 2, 10, 5)?.index).toBe(32);
    expect(selectVariant(variants3, 3, 10, 5)?.index).toBe(31);
    expect(selectVariant(variants3, 4, 10, 5)?.index).toBe(32);

    expect(selectVariant(variants4, 0, 15, 5)?.index).toBe(42);
    expect(selectVariant(variants4, 1, 15, 5)?.index).toBe(41);
    expect(selectVariant(variants4, 2, 15, 5)?.index).toBe(42);
    expect(selectVariant(variants4, 3, 15, 5)?.index).toBe(41);
    expect(selectVariant(variants4, 4, 15, 5)?.index).toBe(42);
  });

  test('returns correct variant from single element set', () => {
    const variants1 = [makeSetting({ index: 11, subSelector: Variant.FIRST })];
    const variants2 = [makeSetting({ index: 21, subSelector: Variant.LAST })];
    const variants3 = [makeSetting({ index: 31, subSelector: Variant.EVEN })];
    const variants4 = [makeSetting({ index: 41, subSelector: Variant.ODD })];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(11);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBeUndefined();
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBeUndefined();
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBeUndefined();
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBeUndefined();

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(21);

    expect(selectVariant(variants3, 0, 10, 5)?.index).toBeUndefined();
    expect(selectVariant(variants3, 1, 10, 5)?.index).toBe(31);
    expect(selectVariant(variants3, 2, 10, 5)?.index).toBeUndefined();
    expect(selectVariant(variants3, 3, 10, 5)?.index).toBe(31);
    expect(selectVariant(variants3, 4, 10, 5)?.index).toBeUndefined();

    expect(selectVariant(variants4, 0, 15, 5)?.index).toBeUndefined();
    expect(selectVariant(variants4, 1, 15, 5)?.index).toBe(41);
    expect(selectVariant(variants4, 2, 15, 5)?.index).toBeUndefined();
    expect(selectVariant(variants4, 3, 15, 5)?.index).toBe(41);
    expect(selectVariant(variants4, 4, 15, 5)?.index).toBeUndefined();
  });
});
