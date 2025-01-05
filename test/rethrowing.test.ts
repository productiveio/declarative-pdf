import DeclarativePDF from '@app/index';
import type {MinimumBrowser} from '@app/utils/adapter-puppeteer';

describe('DeclarativePDF', () => {
  let mockBrowser: jest.Mocked<MinimumBrowser>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    mockBrowser = {
      newPage: jest.fn(),
      connected: true,
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should close the html object when an error occurs', async () => {
    const pdf = new DeclarativePDF(mockBrowser);
    const mockHtmlClose = jest.fn();
    pdf.html = {
      close: mockHtmlClose,
      newPage: jest.fn().mockRejectedValue(new Error('Test error')),
      setContent: jest.fn(),
      normalize: jest.fn(),
    } as any;

    expect(() => pdf.generate('<html></html>')).rejects.toThrow('Test error');

    // Act
    try {
      await pdf.generate('<html></html>');
    } catch (_err) {
      // Ignore the error
    }

    // Assert
    expect(mockHtmlClose).toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should report and close the html object when an error occurs', async () => {
    const pdf = new DeclarativePDF(mockBrowser, {debug: {timeLog: true}});
    const mockHtmlClose = jest.fn();
    pdf.html = {
      close: mockHtmlClose,
      newPage: jest.fn().mockRejectedValue(new Error('Test error')),
      setContent: jest.fn(),
      normalize: jest.fn(),
    } as any;

    expect(() => pdf.generate('<html></html>')).rejects.toThrow('Test error');

    // Act
    try {
      await pdf.generate('<html></html>');
    } catch (_err) {
      // Ignore the error
    }

    // Assert
    expect(mockHtmlClose).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
