import {setDocumentMetadata} from '@app/utils/set-document-metadata';
import type {DocumentMeta} from '@app/index';
import type {PDFDocument} from 'pdf-lib';

describe('handle-pdf-metadata', () => {
  let mockPdf: jest.Mocked<PDFDocument>;

  beforeEach(() => {
    mockPdf = {
      setTitle: jest.fn(),
      setAuthor: jest.fn(),
      setSubject: jest.fn(),
      setKeywords: jest.fn(),
      setProducer: jest.fn(),
      setCreator: jest.fn(),
      setCreationDate: jest.fn(),
      setModificationDate: jest.fn(),
    } as unknown as jest.Mocked<PDFDocument>;
  });

  test('should set all metadata fields when provided', () => {
    const testDate = new Date('2025-01-01');
    const meta: DocumentMeta = {
      title: 'Test Title',
      author: 'Test Author',
      subject: 'Test Subject',
      keywords: ['keyword1', 'keyword2'],
      producer: 'Test Producer',
      creator: 'Test Creator',
      creationDate: testDate,
      modificationDate: testDate,
    };

    setDocumentMetadata(mockPdf, meta);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('Test Title');
    expect(mockPdf.setAuthor).toHaveBeenCalledWith('Test Author');
    expect(mockPdf.setSubject).toHaveBeenCalledWith('Test Subject');
    expect(mockPdf.setKeywords).toHaveBeenCalledWith(['keyword1', 'keyword2']);
    expect(mockPdf.setProducer).toHaveBeenCalledWith('Test Producer');
    expect(mockPdf.setCreator).toHaveBeenCalledWith('Test Creator');
    expect(mockPdf.setCreationDate).toHaveBeenCalledWith(testDate);
    expect(mockPdf.setModificationDate).toHaveBeenCalledWith(testDate);
  });

  test('should set only provided metadata fields', () => {
    const partialMeta: Partial<DocumentMeta> = {
      title: 'Test Title',
      author: 'Test Author',
    };

    setDocumentMetadata(mockPdf, partialMeta);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('Test Title');
    expect(mockPdf.setAuthor).toHaveBeenCalledWith('Test Author');
    expect(mockPdf.setSubject).not.toHaveBeenCalled();
    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
    expect(mockPdf.setProducer).not.toHaveBeenCalled();
    expect(mockPdf.setCreator).not.toHaveBeenCalled();
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
    expect(mockPdf.setModificationDate).not.toHaveBeenCalled();
  });

  test('should not call any setters when meta is undefined', () => {
    setDocumentMetadata(mockPdf, undefined);

    expect(mockPdf.setTitle).not.toHaveBeenCalled();
    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
    expect(mockPdf.setSubject).not.toHaveBeenCalled();
    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
    expect(mockPdf.setProducer).not.toHaveBeenCalled();
    expect(mockPdf.setCreator).not.toHaveBeenCalled();
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
    expect(mockPdf.setModificationDate).not.toHaveBeenCalled();
  });

  test('should not call any setters when meta is empty object', () => {
    setDocumentMetadata(mockPdf, {});

    expect(mockPdf.setTitle).not.toHaveBeenCalled();
    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
    expect(mockPdf.setSubject).not.toHaveBeenCalled();
    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
    expect(mockPdf.setProducer).not.toHaveBeenCalled();
    expect(mockPdf.setCreator).not.toHaveBeenCalled();
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
    expect(mockPdf.setModificationDate).not.toHaveBeenCalled();
  });

  test('should ignore undefined values', () => {
    const metaWithUndefined: Partial<DocumentMeta> = {
      title: 'Test Title',
      author: undefined as unknown as string,
    };

    setDocumentMetadata(mockPdf, metaWithUndefined);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('Test Title');
    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
    expect(mockPdf.setSubject).not.toHaveBeenCalled();
    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
    expect(mockPdf.setProducer).not.toHaveBeenCalled();
    expect(mockPdf.setCreator).not.toHaveBeenCalled();
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
    expect(mockPdf.setModificationDate).not.toHaveBeenCalled();
  });

  test('should handle errors from PDF setters gracefully', () => {
    mockPdf.setTitle.mockImplementation(() => {
      throw new Error('PDF setter error');
    });

    const meta: Partial<DocumentMeta> = {
      title: 'Test Title',
      author: 'Test Author',
    };

    expect(() => {
      setDocumentMetadata(mockPdf, meta);
    }).toThrow('PDF setter error');

    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
    expect(mockPdf.setSubject).not.toHaveBeenCalled();
    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
    expect(mockPdf.setProducer).not.toHaveBeenCalled();
    expect(mockPdf.setCreator).not.toHaveBeenCalled();
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
    expect(mockPdf.setModificationDate).not.toHaveBeenCalled();
  });

  test('should handle empty strings as valid values', () => {
    const emptyStringMeta: Partial<DocumentMeta> = {
      title: '',
      author: '',
      subject: '',
    };

    setDocumentMetadata(mockPdf, emptyStringMeta);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('');
    expect(mockPdf.setAuthor).toHaveBeenCalledWith('');
    expect(mockPdf.setSubject).toHaveBeenCalledWith('');
  });

  test('should handle null values like undefined values', () => {
    const nullMeta: Partial<DocumentMeta> = {
      title: 'Test Title',
      author: null as unknown as string,
    };

    setDocumentMetadata(mockPdf, nullMeta);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('Test Title');
    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
  });

  test('should handle empty keywords array', () => {
    const meta: Partial<DocumentMeta> = {
      keywords: [],
    };

    setDocumentMetadata(mockPdf, meta);

    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
  });

  test('should handle invalid Date objects gracefully', () => {
    const invalidDateMeta: Partial<DocumentMeta> = {
      title: 'Test Title',
      creationDate: new Date('invalid-date'),
    };

    setDocumentMetadata(mockPdf, invalidDateMeta);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('Test Title');
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
  });

  test('should ignore properties not in DocumentMeta interface', () => {
    const extraPropsMeta = {
      title: 'Test Title',
      extraProperty: 'Should be ignored',
      anotherExtra: 123,
    };

    setDocumentMetadata(mockPdf, extraPropsMeta);

    expect(mockPdf.setTitle).toHaveBeenCalledWith('Test Title');
    expect(mockPdf.setAuthor).not.toHaveBeenCalled();
    expect(mockPdf.setSubject).not.toHaveBeenCalled();
    expect(mockPdf.setKeywords).not.toHaveBeenCalled();
    expect(mockPdf.setProducer).not.toHaveBeenCalled();
    expect(mockPdf.setCreator).not.toHaveBeenCalled();
    expect(mockPdf.setCreationDate).not.toHaveBeenCalled();
    expect(mockPdf.setModificationDate).not.toHaveBeenCalled();
  });
});
