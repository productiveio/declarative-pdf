/**
 * @jest-environment node
 */
import {
  hasPageNumbers,
  hasSectionPageNumbers,
} from '@app/utils/layout/has-page-numbers';

import type {
  SectionSettings,
  SectionSetting,
} from '@app/evaluators/section-settings';

describe('hasPageNumbers', () => {
  test('returns false for empty section settings', () => {
    const settings = {
      headers: [],
      footers: [],
      backgrounds: [],
    };
    expect(hasPageNumbers(settings)).toBe(false);
  });

  test('returns false when no page numbers present', () => {
    const settings = {
      headers: [
        {
          height: 0,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
        },
      ],
      footers: [
        {
          height: 0,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: false,
        },
      ],
      backgrounds: [],
    };
    expect(hasPageNumbers(settings)).toBe(false);
  });

  test('returns true when current page number present', () => {
    const settings = {
      headers: [
        {
          height: 0,
          hasCurrentPageNumber: true,
          hasTotalPagesNumber: false,
        },
      ],
      footers: [],
      backgrounds: [],
    };
    expect(hasPageNumbers(settings)).toBe(true);
  });

  test('returns true when total pages number present', () => {
    const settings = {
      headers: [],
      footers: [
        {
          height: 0,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: true,
        },
      ],
      backgrounds: [],
    };
    expect(hasPageNumbers(settings)).toBe(true);
  });

  test('returns true when both number types present', () => {
    const settings = {
      headers: [
        {
          height: 0,
          hasCurrentPageNumber: true,
          hasTotalPagesNumber: true,
        },
      ],
      footers: [],
      backgrounds: [],
    };
    expect(hasPageNumbers(settings)).toBe(true);
  });

  test('returns true when numbers present in different sections', () => {
    const settings = {
      headers: [
        {
          height: 0,
          hasCurrentPageNumber: true,
          hasTotalPagesNumber: false,
        },
      ],
      footers: [
        {
          height: 0,
          hasCurrentPageNumber: false,
          hasTotalPagesNumber: true,
        },
      ],
      backgrounds: [],
    };
    expect(hasPageNumbers(settings)).toBe(true);
  });

  test('returns false when settings is malformed', () => {
    const settings = {
      headers: [{}, {}, {}] as unknown as SectionSetting[],
      footers: [],
      backgrounds: [],
    } as unknown as SectionSettings;
    expect(hasPageNumbers(settings)).toBe(false);
  });

  test('returns false when settings is missing', () => {
    expect(hasPageNumbers({} as unknown as SectionSettings)).toBe(false);
  });

  test('returns false when settings is undefined', () => {
    expect(hasPageNumbers(undefined as unknown as SectionSettings)).toBe(false);
  });
});

describe('hasSectionPageNumbers', () => {
  test('returns false for empty section settings', () => {
    const settings: SectionSetting[] = [];
    expect(hasSectionPageNumbers(settings)).toBe(false);
  });

  test('returns false when no page numbers present', () => {
    const settings = [
      {
        height: 0,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: false,
      },
    ];
    expect(hasSectionPageNumbers(settings)).toBe(false);
  });

  test('returns true when current page number present', () => {
    const settings = [
      {
        height: 0,
        hasCurrentPageNumber: true,
        hasTotalPagesNumber: false,
      },
    ];
    expect(hasSectionPageNumbers(settings)).toBe(true);
  });

  test('returns true when total pages number present', () => {
    const settings = [
      {
        height: 0,
        hasCurrentPageNumber: false,
        hasTotalPagesNumber: true,
      },
    ];
    expect(hasSectionPageNumbers(settings)).toBe(true);
  });

  test('returns true when both number types present', () => {
    const settings = [
      {
        height: 0,
        hasCurrentPageNumber: true,
        hasTotalPagesNumber: true,
      },
    ];
    expect(hasSectionPageNumbers(settings)).toBe(true);
  });

  test('returns false when settings is malformed', () => {
    const settings = [{}, {}, {}] as unknown as SectionSetting[];
    expect(hasSectionPageNumbers(settings)).toBe(false);
  });

  test('returns false when settings is missing', () => {
    expect(hasSectionPageNumbers([])).toBe(false);
  });

  test('returns false when settings is undefined', () => {
    expect(
      hasSectionPageNumbers(undefined as unknown as SectionSetting[])
    ).toBe(false);
  });
});
