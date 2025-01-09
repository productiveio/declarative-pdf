/**
 * @jest-environment node
 */
import DeclarativePDF from '@app/index';
import HTMLAdapter from '@app/utils/adapter-puppeteer';
import {PaperDefaults} from '@app/utils/paper-defaults';
import {PDFDocument} from 'pdf-lib';
import type {MinimumBrowser} from '@app/utils/adapter-puppeteer';

jest.mock('@app/utils/adapter-puppeteer');
jest.mock('@app/utils/paper-defaults');
jest.mock('pdf-lib');

describe('DeclarativePDF', () => {
  let mockBrowser: jest.Mocked<MinimumBrowser>;
  let mockAdapter: jest.Mocked<HTMLAdapter>;
  let mockPdfDocument: jest.Mocked<PDFDocument>;

  beforeEach(() => {
    mockBrowser = {
      newPage: jest.fn(),
      connected: true,
    };

    mockAdapter = {
      newPage: jest.fn(),
      setContent: jest.fn(),
      normalize: jest.fn(),
      getTemplateSettings: jest.fn().mockResolvedValue([]),
      setViewport: jest.fn(),
      getSectionSettings: jest.fn(),
      close: jest.fn(),
      resetVisibility: jest.fn(),
      pdf: jest.fn().mockResolvedValue(new Uint8Array(Buffer.from('test'))),
    } as any;

    mockPdfDocument = {
      getPageCount: jest.fn().mockReturnValue(1),
      save: jest.fn().mockResolvedValue(new Uint8Array()),
      create: jest.fn(),
      getPageIndices: jest.fn().mockReturnValue([0, 1]),
      copyPages: jest.fn().mockReturnValue([]),
    } as any;

    (HTMLAdapter as jest.MockedClass<typeof HTMLAdapter>).prototype = mockAdapter;
    (PDFDocument.create as jest.Mock).mockResolvedValue(mockPdfDocument);
    (PDFDocument.load as jest.Mock).mockResolvedValue(mockPdfDocument);
  });

  describe('constructor', () => {
    test('initializes with default options', () => {
      const pdf = new DeclarativePDF(mockBrowser);

      expect(pdf.html).toBeInstanceOf(HTMLAdapter);
      expect(pdf.defaults).toBeInstanceOf(PaperDefaults);
      expect(pdf.debug).toEqual({});
      expect(pdf.documentPages).toEqual([]);
    });

    test('initializes with custom options', () => {
      const opts = {
        defaults: {ppi: 300},
        debug: {timeLog: true},
      };
      const pdf = new DeclarativePDF(mockBrowser, opts);

      expect(PaperDefaults).toHaveBeenCalledWith(opts.defaults);
      expect(pdf.debug).toEqual(opts.debug);
    });
  });

  describe('generate', () => {
    let pdf: DeclarativePDF;

    beforeEach(() => {
      pdf = new DeclarativePDF(mockBrowser);
    });

    test('processes single document page without sections', async () => {
      const mockBuffer = Buffer.from('test');
      mockAdapter.getTemplateSettings.mockResolvedValueOnce([
        {
          index: 0,
          width: 100,
          height: 100,
          bodyMarginBottom: 0,
          bodyMarginTop: 0,
          hasSections: false,
        },
      ]);

      const result = await pdf.generate('<html></html>');
      expect(result).toEqual(mockBuffer);
    });

    test('processes multiple document pages', async () => {
      mockAdapter.getTemplateSettings.mockResolvedValueOnce([
        {index: 0, width: 100, height: 100, bodyMarginBottom: 0, bodyMarginTop: 0, hasSections: true},
        {index: 1, width: 100, height: 100, bodyMarginBottom: 0, bodyMarginTop: 0, hasSections: true},
      ]);

      await pdf.generate('<html></html>');

      expect(mockAdapter.newPage).toHaveBeenCalled();
      expect(mockAdapter.setContent).toHaveBeenCalledWith('<html></html>');
      expect(mockAdapter.normalize).toHaveBeenCalled();
      expect(PDFDocument.create).toHaveBeenCalled();
    });

    test('closes HTML adapter on error', async () => {
      mockAdapter.newPage.mockRejectedValue(new Error('Test error'));

      await expect(pdf.generate('<html></html>')).rejects.toThrow('Test error');
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    test('throws an error when no document pages are found', async () => {
      mockAdapter.getTemplateSettings.mockResolvedValueOnce([]);

      await expect(pdf.generate('<html></html>')).rejects.toThrow('No document pages found');
    });
  });

  describe('totalPagesNumber', () => {
    test('calculates total pages correctly', () => {
      const pdf = new DeclarativePDF(mockBrowser);
      pdf['documentPages'] = [{layout: {pageCount: 2}}, {layout: {pageCount: 3}}] as any;

      expect(pdf.totalPagesNumber).toBe(5);
    });

    test('returns 0 for empty document pages', () => {
      const pdf = new DeclarativePDF(mockBrowser);
      expect(pdf.totalPagesNumber).toBe(0);
    });
  });
});
