import { validateTemplateSetting } from '../../src/utils/validators';

describe('validateTemplateSetting', () => {
  test('throws error for malformed setting', () => {
    expect(() => validateTemplateSetting({})).toThrow();
  });

  test('throws error for non-numeric index', () => {
    expect(() =>
      validateTemplateSetting({ index: NaN, width: 100, height: 100 })
    ).toThrow();
  });

  test('throws error for negative index', () => {
    expect(() =>
      validateTemplateSetting({ index: -1, width: 100, height: 100 })
    ).toThrow();
  });

  test('throws error for too large index', () => {
    expect(() =>
      validateTemplateSetting({ index: 11, width: 100, height: 100 })
    ).toThrow();
  });

  test('throws error for non-numeric width', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: NaN, height: 100 })
    ).toThrow();
  });

  test('throws error for non-positive width', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 0, height: 100 })
    ).toThrow();
  });

  test('throws error for too small width', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 41, height: 100 })
    ).toThrow();
  });

  test('throws error for too large width', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 42_001, height: 100 })
    ).toThrow();
  });

  test('throws error for non-numeric height', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 100, height: NaN })
    ).toThrow();
  });

  test('throws error for non-positive height', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 100, height: 0 })
    ).toThrow();
  });

  test('throws error for too small height', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 100, height: 41 })
    ).toThrow();
  });

  test('throws error for too large height', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 100, height: 42_001 })
    ).toThrow();
  });

  test('does not throw error for valid setting', () => {
    expect(() =>
      validateTemplateSetting({ index: 0, width: 100, height: 100 })
    ).not.toThrow();
  });
});
