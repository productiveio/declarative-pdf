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
      makeSetting({ index: 1, subSelector: Variant.FIRST }),
      makeSetting({ index: 2, subSelector: Variant.LAST }),
      makeSetting({ index: 3, subSelector: Variant.ODD }),
      makeSetting({ index: 4, subSelector: Variant.EVEN }),
      makeSetting({ index: 5, subSelector: Variant.DEFAULT }),
    ];
    const variants2 = [
      makeSetting({ index: 1, subSelector: Variant.FIRST }),
      makeSetting({ index: 2, subSelector: Variant.LAST }),
      makeSetting({ index: 3, subSelector: Variant.ODD }),
      makeSetting({ index: 4, subSelector: Variant.EVEN }),
      makeSetting({ index: 5 }),
    ];
    const variants3 = [
      makeSetting({ index: 1, subSelector: Variant.ODD }),
      makeSetting({ index: 2, subSelector: Variant.EVEN }),
      makeSetting({ index: 3, subSelector: Variant.DEFAULT }),
    ];
    const variants4 = [
      makeSetting({ index: 1, subSelector: Variant.FIRST }),
      makeSetting({ index: 2, subSelector: Variant.LAST }),
      makeSetting({ index: 3, subSelector: Variant.DEFAULT }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(1);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBe(4);
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBe(3);
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBe(4);
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBe(2);

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBe(1);
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBe(3);
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBe(4);
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBe(3);
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(2);

    expect(selectVariant(variants3, 0, 10, 4)?.index).toBe(1);
    expect(selectVariant(variants3, 1, 10, 4)?.index).toBe(2);
    expect(selectVariant(variants3, 2, 10, 4)?.index).toBe(1);
    expect(selectVariant(variants3, 3, 10, 4)?.index).toBe(2);

    expect(selectVariant(variants4, 0, 14, 4)?.index).toBe(1);
    expect(selectVariant(variants4, 1, 14, 4)?.index).toBe(3);
    expect(selectVariant(variants4, 2, 14, 4)?.index).toBe(3);
    expect(selectVariant(variants4, 3, 14, 4)?.index).toBe(2);
  });

  test('returns correct variant from partial set with default fallback', () => {
    const variants1 = [
      makeSetting({ index: 1, subSelector: Variant.FIRST }),
      makeSetting({ index: 2, subSelector: Variant.DEFAULT }),
    ];
    const variants2 = [
      makeSetting({ index: 1, subSelector: Variant.LAST }),
      makeSetting({ index: 2, subSelector: Variant.DEFAULT }),
    ];
    const variants3 = [
      makeSetting({ index: 1, subSelector: Variant.EVEN }),
      makeSetting({ index: 2, subSelector: Variant.DEFAULT }),
    ];
    const variants4 = [
      makeSetting({ index: 1, subSelector: Variant.ODD }),
      makeSetting({ index: 2, subSelector: Variant.DEFAULT }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(1);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBe(2);
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBe(2);
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBe(2);
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBe(2);

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(1);

    expect(selectVariant(variants3, 0, 10, 5)?.index).toBe(2);
    expect(selectVariant(variants3, 1, 10, 5)?.index).toBe(1);
    expect(selectVariant(variants3, 2, 10, 5)?.index).toBe(2);
    expect(selectVariant(variants3, 3, 10, 5)?.index).toBe(1);
    expect(selectVariant(variants3, 4, 10, 5)?.index).toBe(2);

    expect(selectVariant(variants4, 0, 15, 5)?.index).toBe(2);
    expect(selectVariant(variants4, 1, 15, 5)?.index).toBe(1);
    expect(selectVariant(variants4, 2, 15, 5)?.index).toBe(2);
    expect(selectVariant(variants4, 3, 15, 5)?.index).toBe(1);
    expect(selectVariant(variants4, 4, 15, 5)?.index).toBe(2);
  });

  test('returns correct variant from partial set with undefined fallback', () => {
    const variants1 = [
      makeSetting({ index: 1, subSelector: Variant.FIRST }),
      makeSetting({ index: 2 }),
    ];
    const variants2 = [
      makeSetting({ index: 1, subSelector: Variant.LAST }),
      makeSetting({ index: 2 }),
    ];
    const variants3 = [
      makeSetting({ index: 1, subSelector: Variant.EVEN }),
      makeSetting({ index: 2 }),
    ];
    const variants4 = [
      makeSetting({ index: 1, subSelector: Variant.ODD }),
      makeSetting({ index: 2 }),
    ];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(1);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBe(2);
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBe(2);
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBe(2);
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBe(2);

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBe(2);
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(1);

    expect(selectVariant(variants3, 0, 10, 5)?.index).toBe(2);
    expect(selectVariant(variants3, 1, 10, 5)?.index).toBe(1);
    expect(selectVariant(variants3, 2, 10, 5)?.index).toBe(2);
    expect(selectVariant(variants3, 3, 10, 5)?.index).toBe(1);
    expect(selectVariant(variants3, 4, 10, 5)?.index).toBe(2);

    expect(selectVariant(variants4, 0, 15, 5)?.index).toBe(2);
    expect(selectVariant(variants4, 1, 15, 5)?.index).toBe(1);
    expect(selectVariant(variants4, 2, 15, 5)?.index).toBe(2);
    expect(selectVariant(variants4, 3, 15, 5)?.index).toBe(1);
    expect(selectVariant(variants4, 4, 15, 5)?.index).toBe(2);
  });

  test('returns correct variant from single element set', () => {
    const variants1 = [makeSetting({ index: 1, subSelector: Variant.FIRST })];
    const variants2 = [makeSetting({ index: 1, subSelector: Variant.LAST })];
    const variants3 = [makeSetting({ index: 1, subSelector: Variant.EVEN })];
    const variants4 = [makeSetting({ index: 1, subSelector: Variant.ODD })];

    expect(selectVariant(variants1, 0, 0, 5)?.index).toBe(1);
    expect(selectVariant(variants1, 1, 0, 5)?.index).toBeUndefined();
    expect(selectVariant(variants1, 2, 0, 5)?.index).toBeUndefined();
    expect(selectVariant(variants1, 3, 0, 5)?.index).toBeUndefined();
    expect(selectVariant(variants1, 4, 0, 5)?.index).toBeUndefined();

    expect(selectVariant(variants2, 0, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 1, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 2, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 3, 5, 5)?.index).toBeUndefined();
    expect(selectVariant(variants2, 4, 5, 5)?.index).toBe(1);

    expect(selectVariant(variants3, 0, 10, 5)?.index).toBeUndefined();
    expect(selectVariant(variants3, 1, 10, 5)?.index).toBe(1);
    expect(selectVariant(variants3, 2, 10, 5)?.index).toBeUndefined();
    expect(selectVariant(variants3, 3, 10, 5)?.index).toBe(1);
    expect(selectVariant(variants3, 4, 10, 5)?.index).toBeUndefined();

    expect(selectVariant(variants4, 0, 15, 5)?.index).toBeUndefined();
    expect(selectVariant(variants4, 1, 15, 5)?.index).toBe(1);
    expect(selectVariant(variants4, 2, 15, 5)?.index).toBeUndefined();
    expect(selectVariant(variants4, 3, 15, 5)?.index).toBe(1);
    expect(selectVariant(variants4, 4, 15, 5)?.index).toBeUndefined();
  });
});
