import determineActivePhysicalPage from './determineActivePhysicalPage';
import Variant from '../consts/physicalPageVariant';

const mockCollectionItem = (type: Variant) => ({index: 0, height: 0, type});

describe('determineActivePhysicalPage', () => {
  it('should return FIRST section type for first page with all available variants', () => {
    const collection = [
      mockCollectionItem(Variant.FIRST),
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.EVEN),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(1, 5, collection);
    expect(result?.type).toBe(Variant.FIRST);
  });

  it('should return ODD section type for first page without available FIRST variant', () => {
    const collection = [
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.EVEN),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(1, 5, collection);
    expect(result?.type).toBe(Variant.ODD);
  });

  it('should return LAST section type before ODD type', () => {
    const collection = [
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(1, 1, collection);
    expect(result?.type).toBe(Variant.LAST);
  });

  it('should return LAST section type before EVEN type', () => {
    const collection = [
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(2, 2, collection);
    expect(result?.type).toBe(Variant.LAST);
  });

  it('should return LAST section type for last page with all available variant', () => {
    const collection = [
      mockCollectionItem(Variant.FIRST),
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.EVEN),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(5, 5, collection);
    expect(result?.type).toBe(Variant.LAST);
  });

  it('should return ODD section type for last page without available LAST variant', () => {
    const collection = [
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(5, 5, collection);
    expect(result?.type).toBe(Variant.ODD);
  });

  it('should return ODD section type for first page without available FIRST variant', () => {
    const collection = [
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(1, 5, collection);
    expect(result?.type).toBe(Variant.ODD);
  });

  it('should return EVEN section type for even page number with all available variants', () => {
    const collection = [
      mockCollectionItem(Variant.FIRST),
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.EVEN),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(2, 5, collection);
    expect(result?.type).toBe(Variant.EVEN);
  });

  it('should return ODD section type for odd page number with all available variants', () => {
    const collection = [
      mockCollectionItem(Variant.FIRST),
      mockCollectionItem(Variant.LAST),
      mockCollectionItem(Variant.ODD),
      mockCollectionItem(Variant.EVEN),
      mockCollectionItem(Variant.DEFAULT),
    ];
    const result = determineActivePhysicalPage(3, 5, collection);
    expect(result?.type).toBe(Variant.ODD);
  });

  it('should return DEFAULT section type for first page without available variants', () => {
    const result = determineActivePhysicalPage(1, 5, [mockCollectionItem(Variant.DEFAULT)]);
    expect(result?.type).toBe(Variant.DEFAULT);
  });

  it('should return DEFAULT section type for last page without available variants', () => {
    const result = determineActivePhysicalPage(5, 5, [mockCollectionItem(Variant.DEFAULT)]);
    expect(result?.type).toBe(Variant.DEFAULT);
  });

  it('should return DEFAULT section type when no matching conditions are met', () => {
    const result = determineActivePhysicalPage(4, 5, [mockCollectionItem(Variant.DEFAULT)]);
    expect(result?.type).toBe(Variant.DEFAULT);
  });

  it('should return undefined for first page without available variants', () => {
    const result = determineActivePhysicalPage(1, 5, []);
    expect(result).toBe(undefined);
  });

  it('should return undefined for last page without available variants', () => {
    const result = determineActivePhysicalPage(5, 5, []);
    expect(result).toBe(undefined);
  });

  it('should return undefined when no matching conditions are met', () => {
    const result = determineActivePhysicalPage(4, 5, []);
    expect(result).toBe(undefined);
  });
});
