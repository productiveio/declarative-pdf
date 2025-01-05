/**
 * @jest-environment jsdom
 */
import evalTemplateNormalize from '@app/evaluators/template-normalize';

jest.mock('puppeteer');
jest.mock('jsdom');

describe('evalTemplateNormalize', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('creates a document-page and page-body for free elements', () => {
    document.body.innerHTML = '<div>Test</div>';
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe('<document-page><page-body><div>Test</div></page-body></document-page>');
  });

  test('creates a page-body for free elements in document-page', () => {
    document.body.innerHTML = '<document-page>Test</document-page>';
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body></document-page>');
  });

  test('removes free childNodes when a document-page element exists', () => {
    document.body.innerHTML = '<document-page>Test</document-page>Temp';
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body></document-page>');
  });

  test('does not remove script or style elements', () => {
    document.body.innerHTML =
      '<script>Script</script><style>Style</style><div>Div</div>Text<document-page><page-body>Test</page-body><script>inner script</script><style>inner style</style></document-page>';
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe(
      '<script>Script</script><style>Style</style><document-page><page-body>Test</page-body><script>inner script</script><style>inner style</style></document-page>'
    );
  });

  test('removes free childNodes when a page-body element exists', () => {
    document.body.innerHTML = '<document-page><page-body>Test</page-body>Temp</document-page>';
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe('<document-page><page-body>Test</page-body></document-page>');
  });

  test('removes empty document-pages or ones containing empty page-bodies', () => {
    document.body.innerHTML =
      '<document-page><page-body></page-body><page-footer>A</page-footer></document-page><document-page><page-body>B</page-body></document-page>';
    evalTemplateNormalize();
    expect(document.body.innerHTML).toBe('<document-page><page-body>B</page-body></document-page>');
  });

  test('sets body margin and padding to 0', () => {
    evalTemplateNormalize();
    expect(document.body.style.margin).toBe('0px');
    expect(document.body.style.padding).toBe('0px');
  });

  test('adds pdf class to body', () => {
    evalTemplateNormalize();
    expect(document.body.classList.contains('pdf')).toBe(true);
  });
});
