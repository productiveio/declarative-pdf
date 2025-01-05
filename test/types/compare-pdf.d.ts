declare module 'compare-pdf' {
  interface config {
    paths: {
      actualPdfRootFolder: string;
      baselinePdfRootFolder: string;
      actualPngRootFolder: string;
      baselinePngRootFolder: string;
      diffPngRootFolder: string;
    };
    settings: {
      imageEngine: string;
      density: number;
      quality: number;
      tolerance: number;
      threshold: number;
      cleanPngPaths: boolean;
      matchPageCount: boolean;
      disableFontFace: boolean;
      verbosity: number;
    };
  }

  class ComparePdf {
    constructor(config: config);

    actualPdfFile(pdfName: string): ComparePdf;
    baselinePdfFile(pdfName: string): ComparePdf;
    compare(): Promise<{status: string}>;
  }

  export default ComparePdf;
}
