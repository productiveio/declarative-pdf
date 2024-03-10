import { PaperDefaults } from '@app/utils/paper-defaults';

describe('PaperDefaults', () => {
  test('defaults to A4 format when no options are provided', () => {
    const paper = new PaperDefaults();
    expect(paper.ppi).toBe(72);
    expect(paper.format).toBe('a4');
    expect(paper.width).toBe(595);
    expect(paper.height).toBe(842);
  });

  test('uses provided PPI', () => {
    const paper = new PaperDefaults({ ppi: 96 });
    expect(paper.ppi).toBe(96);
    expect(paper.format).toBe('a4');
    expect(paper.width).toBe(595);
    expect(paper.height).toBe(842);
  });

  test('uses provided format', () => {
    const paper = new PaperDefaults({ format: 'letter' });
    expect(paper.ppi).toBe(72);
    expect(paper.format).toBe('letter');
    expect(paper.width).toBe(612);
    expect(paper.height).toBe(791);
  });

  test('uses provided width and height', () => {
    const paper = new PaperDefaults({ width: 600, height: 800 });
    expect(paper.ppi).toBe(72);
    expect(paper.format).toBeUndefined();
    expect(paper.width).toBe(600);
    expect(paper.height).toBe(800);
  });

  test('ignores format when invalid format is provided', () => {
    // @ts-expect-error: testing invalid format
    const paper = new PaperDefaults({ format: 'invalid' });
    expect(paper.ppi).toBe(72);
    expect(paper.format).toBe('a4');
    expect(paper.width).toBe(595);
    expect(paper.height).toBe(842);
  });

  test('uses default height when only width is provided', () => {
    const paper = new PaperDefaults({ width: 600 });
    expect(paper.ppi).toBe(72);
    expect(paper.format).toBeUndefined();
    expect(paper.width).toBe(600);
    expect(paper.height).toBe(842);
  });

  test('defaults to A4 format when only height is provided', () => {
    const paper = new PaperDefaults({ height: 800 });
    expect(paper.ppi).toBe(72);
    expect(paper.format).toBeUndefined();
    expect(paper.width).toBe(595);
    expect(paper.height).toBe(800);
  });

  test('defaults to valid PPI when invalid PPI is provided', () => {
    // @ts-expect-error: testing invalid PPI
    const paper = new PaperDefaults({ ppi: 'invalid' });
    expect(paper.ppi).toBe(72);
  });

  test('defaults to valid PPI when invalid PPI is too small', () => {
    const paper = new PaperDefaults({ ppi: 17 });
    expect(paper.ppi).toBe(72);
  });

  test('defaults to valid PPI when invalid PPI is too big', () => {
    const paper = new PaperDefaults({ ppi: 42_001 });
    expect(paper.ppi).toBe(72);
  });
});
