import {normalizeSetting} from '@app/utils/normalize-setting';

describe('normalizeSetting', () => {
  it('should return defaults if none is provided', () => {
    const setting = {index: 1};
    const result = normalizeSetting(setting);
    expect(result).toEqual({
      index: 1,
      width: 595,
      height: 842,
      bodyMarginTop: 0,
      bodyMarginBottom: 0,
      hasSections: false,
    });
  });

  it('should return defaults if values are malformed', () => {
    const setting = {
      index: 1,
      width: 'not a number',
      height: NaN,
      bodyMarginTop: 'not a number',
      bodyMarginBottom: NaN,
    };
    // @ts-expect-error: testing invalid input
    const result = normalizeSetting(setting);
    expect(result).toEqual({
      index: 1,
      width: 595,
      height: 842,
      bodyMarginTop: 0,
      bodyMarginBottom: 0,
      hasSections: false,
    });
  });

  it('should return capped values', () => {
    const setting = {
      index: 1,
      width: -500,
      height: 429_999,
      bodyMarginTop: -1,
      bodyMarginBottom: 429_999,
      hasSections: false,
    };
    const result = normalizeSetting(setting);
    expect(result).toEqual({
      index: 1,
      width: 1,
      height: 420_000,
      bodyMarginTop: 0,
      bodyMarginBottom: 420_000,
      hasSections: false,
    });
  });

  it('should return capped width if width is less than 1 and height is provided', () => {
    const setting = {index: 1, width: 0, height: 100, hasSections: true};
    const result = normalizeSetting(setting);
    expect(result).toEqual({
      index: 1,
      width: 1,
      height: 100,
      bodyMarginTop: 0,
      bodyMarginBottom: 0,
      hasSections: true,
    });
  });

  it('should return default width and height if width is greater than 420_000 and height is provided', () => {
    const setting = {index: 1, width: 420_001, height: 100};
    const result = normalizeSetting(setting);
    expect(result).toEqual({
      index: 1,
      width: 420_000,
      height: 100,
      bodyMarginTop: 0,
      bodyMarginBottom: 0,
      hasSections: false,
    });
  });
});
