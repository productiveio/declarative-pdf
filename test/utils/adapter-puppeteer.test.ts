/**
 * @jest-environment node
 */
import HTMLAdapter from '@app/utils/adapter-puppeteer';
import type {Page} from 'puppeteer';
import type {MinimumBrowser, MinimumPage} from '@app/utils/adapter-puppeteer';

describe('HTMLAdapter', () => {
  let mockPage: jest.Mocked<Page>;
  let mockBrowser: jest.Mocked<MinimumBrowser>;

  beforeEach(() => {
    mockPage = {
      setContent: jest.fn(),
      setViewport: jest.fn(),
      evaluate: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      close: jest.fn(),
    } as any;

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      connected: true,
    };
  });

  test('constructor sets browser', () => {
    const adapter = new HTMLAdapter(mockBrowser);
    expect(adapter['_browser']).toBe(mockBrowser);
  });

  describe('browser getter', () => {
    test('throws when browser not set', () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_browser'] = undefined;
      expect(() => adapter.browser).toThrow('Browser not set');
    });

    test('throws when browser not connected (modern puppeteer)', () => {
      const adapter = new HTMLAdapter({...mockBrowser, connected: false});
      expect(() => adapter.browser).toThrow('Browser not connected');
    });

    test('throws when browser not connected (legacy puppeteer)', () => {
      const legacyBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        isConnected: () => true,
      };
      const adapter = new HTMLAdapter(legacyBrowser as any);
      expect(() => adapter.browser).toThrow('Browser not connected');
    });
  });

  describe('page getter', () => {
    test('throws when page not set', () => {
      const adapter = new HTMLAdapter(mockBrowser);
      expect(() => adapter.page).toThrow('Page not set');
    });

    test('throws when page is closed', () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_page'] = mockPage;
      mockPage.isClosed.mockReturnValue(true);
      expect(() => adapter.page).toThrow('Page is closed');
    });

    test('returns page when valid', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_page'] = mockPage;
      expect(adapter.page).toBe(mockPage);
    });
  });

  describe('newPage', () => {
    test('throws if page already exists', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_page'] = mockPage;
      await expect(adapter.newPage()).rejects.toThrow('Page already set');
    });

    test('creates new page', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      await adapter.newPage();
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(adapter['_page']).toBe(mockPage);
    });
  });

  describe('setPage', () => {
    test('throws if page already exists', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_page'] = mockPage;
      const newPage = {...mockPage} as MinimumPage;

      await expect(adapter.setPage(newPage)).rejects.toThrow('Page already set');
    });

    test('sets provided page', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      const newPage = {...mockPage} as MinimumPage;

      await adapter.setPage(newPage);
      expect(adapter['_page']).toBe(newPage);
    });
  });

  describe('page operations', () => {
    let adapter: HTMLAdapter;

    beforeEach(async () => {
      adapter = new HTMLAdapter(mockBrowser);
      await adapter.newPage();
    });

    test('setContent calls page.setContent with correct options', async () => {
      await adapter.setContent('<html></html>');
      expect(mockPage.setContent).toHaveBeenCalledWith('<html></html>', {waitUntil: ['load', 'networkidle0']});
    });

    test('setViewport calls page.setViewport', async () => {
      const viewport = {width: 800, height: 600};
      await adapter.setViewport(viewport);
      expect(mockPage.setViewport).toHaveBeenCalledWith(viewport);
    });

    test('normalize calls page.evaluate with correct evaluator', async () => {
      await adapter.normalize();
      expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    });

    test('getTemplateSettings calls page.evaluate with correct args', async () => {
      const opts = {width: 800, height: 600, ppi: 72};
      await adapter.getTemplateSettings(opts);
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), {default: opts, size: expect.any(Object)});
    });

    test('getSectionSettings calls page.evaluate with correct args', async () => {
      await adapter.getSectionSettings({index: 0});
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), 0);
    });

    test('prepareSection calls page.evaluate with correct args', async () => {
      const opts = {documentPageIndex: 0, sectionType: 'header' as const};
      await adapter.prepareSection(opts);
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), opts);
    });

    test('resetVisibility calls page.evaluate', async () => {
      await adapter.resetVisibility();
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
    });

    test('pdf generates with correct scaling options', async () => {
      mockPage.pdf = jest.fn();
      await adapter.pdf({
        width: 100,
        height: 200,
        margin: {top: 10},
        transparentBg: true,
      });

      expect(mockPage.pdf).toHaveBeenCalledWith({
        width: 100 / 0.75,
        height: 200 / 0.75,
        scale: 1 / 0.75,
        margin: {top: 10},
        omitBackground: true,
        printBackground: true,
      });
    });
  });

  describe('close', () => {
    test('closes page if exists and not closed', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_page'] = mockPage;
      await adapter.close();
      expect(mockPage.close).toHaveBeenCalled();
    });

    test('does not close page if already closed', async () => {
      const adapter = new HTMLAdapter(mockBrowser);
      adapter['_page'] = mockPage;
      mockPage.isClosed.mockReturnValue(true);
      await adapter.close();
      expect(mockPage.close).not.toHaveBeenCalled();
    });
  });
});
