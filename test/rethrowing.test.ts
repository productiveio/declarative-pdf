import { Browser } from 'puppeteer';
import DeclarativePDF from '@app/index';

describe('DeclarativePDF', () => {
  let browser: Browser;
  let pdf: DeclarativePDF;

  beforeEach(() => {
    // Mock the puppeteer Browser
    browser = {} as Browser;

    // Create a new DeclarativePDF instance
    pdf = new DeclarativePDF(browser);
  });

  it('should close the html object when an error occurs', async () => {
    // Arrange
    const mockHtmlClose = jest.fn();
    pdf.html = {
      close: mockHtmlClose,
      newPage: jest.fn().mockRejectedValue(new Error('Test error')),
      setContent: jest.fn(),
      normalize: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Act
    try {
      await pdf.generate('<html></html>');
    } catch (error) {
      // Ignore the error
    }

    // Assert
    expect(mockHtmlClose).toHaveBeenCalled();
  });
});
