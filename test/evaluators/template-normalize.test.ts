/**
 * @jest-environment jsdom
 */
import evalTemplateNormalize from '@app/evaluators/template-normalize';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalTemplateNormalize', () => {
  const defaultOpts = {
    addPdfClass: true,
    setBodyMargin: true,
    setBodyPadding: true,
    setBodyTransparent: true,
    normalizeBody: true,
    normalizeDocumentPage: true,
  };

  let originalBodyState: {
    innerHTML: string;
    style: {
      margin: string;
      padding: string;
      backgroundColor: string;
    };
    className: string;
  };

  beforeEach(() => {
    originalBodyState = {
      innerHTML: document.body.innerHTML,
      style: {
        margin: document.body.style.margin,
        padding: document.body.style.padding,
        backgroundColor: document.body.style.backgroundColor,
      },
      className: document.body.className,
    };
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyState.innerHTML;
    document.body.style.margin = originalBodyState.style.margin;
    document.body.style.padding = originalBodyState.style.padding;
    document.body.style.backgroundColor = originalBodyState.style.backgroundColor;
    document.body.className = originalBodyState.className;
  });

  test('it normalizes body by default', () => {
    document.body.innerHTML = '<div>Test</div>';
    evalTemplateNormalize(defaultOpts);
    expect(document.body.innerHTML).toBe('<document-page><page-body><div>Test</div></page-body></document-page>');
  });

  test('it does not normalize body with opts', () => {
    document.body.innerHTML = '<div>Test</div>';
    const opts = {...defaultOpts, normalizeBody: false};
    evalTemplateNormalize(opts);
    expect(document.body.innerHTML).toBe('<div>Test</div>');
  });

  test('it normalizes document-page by default', () => {
    document.body.innerHTML = '<document-page>Test</document-page>';
    evalTemplateNormalize(defaultOpts);
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body></document-page>');
  });

  test('it does not normalize document-page with opts', () => {
    document.body.innerHTML = '<document-page>Test</document-page>';
    const opts = {...defaultOpts, normalizeDocumentPage: false};
    evalTemplateNormalize(opts);
    expect(document.body.innerHTML).toBe('<document-page>Test</document-page>');
  });

  test('it cleans up body by default', () => {
    document.body.innerHTML = '<document-page>Test</document-page>Temp';
    evalTemplateNormalize(defaultOpts);
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body></document-page>');
  });

  test('it does not clean up body with opts', () => {
    document.body.innerHTML = '<document-page>Test</document-page>Temp';
    const opts = {...defaultOpts, normalizeBody: false, normalizeDocumentPage: false};
    evalTemplateNormalize(opts);
    expect(document.body.innerHTML).toBe('<document-page>Test</document-page>Temp');
  });

  test('it keeps script and style nodes', () => {
    document.body.innerHTML =
      '<script>Script</script><style>Style</style><div>Div</div>Text<document-page><page-body>Test</page-body><script>inner script</script><style>inner style</style></document-page>';
    evalTemplateNormalize(defaultOpts);
    expect(document.body.innerHTML).toBe(
      '<script>Script</script><style>Style</style><document-page><page-body>Test</page-body><script>inner script</script><style>inner style</style></document-page>'
    );
  });

  test('it cleans up document-page by default', () => {
    document.body.innerHTML = '<document-page><page-body>Test</page-body>Temp</document-page>';
    evalTemplateNormalize(defaultOpts);
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body></document-page>');
  });

  test('it does not clean up document-page with opts', () => {
    document.body.innerHTML = '<document-page><page-body>Test</page-body>Temp</document-page>';
    const opts = {...defaultOpts, normalizeDocumentPage: false};
    evalTemplateNormalize(opts);
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body>Temp</document-page>');
  });

  test('it removes empty document-pages', () => {
    document.body.innerHTML =
      '<document-page><page-body></page-body><page-footer>A</page-footer></document-page><document-page><page-body>B</page-body></document-page>';
    evalTemplateNormalize(defaultOpts);
    expect(document.body.innerHTML).toBe('<document-page><page-body>B</page-body></document-page>');
  });

  test('it sets body style to defaults', () => {
    evalTemplateNormalize(defaultOpts);
    expect(document.body.style.margin).toBe('0px');
    expect(document.body.style.padding).toBe('0px');
    expect(document.body.style.backgroundColor).toBe('transparent');
  });

  test('it does not set body style to defaults with opts', () => {
    document.body.innerHTML = '<div>Test</div>';
    const opts = {...defaultOpts, setBodyMargin: false, setBodyPadding: false, setBodyTransparent: false};
    evalTemplateNormalize(opts);
    expect(document.body.style.margin).toBe('');
    expect(document.body.style.padding).toBe('');
    expect(document.body.style.backgroundColor).toBe('');
  });

  test('it adds pdf class to body', () => {
    evalTemplateNormalize(defaultOpts);
    expect(document.body.classList.contains('pdf')).toBe(true);
  });

  test('it does not add pdf class to body with opts', () => {
    const opts = {...defaultOpts, addPdfClass: false};
    evalTemplateNormalize(opts);
    expect(document.body.classList.contains('pdf')).toBe(false);
  });
});
