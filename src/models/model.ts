// import type { PDFDocument } from 'pdf-lib';

export type TModel = {
  id: string;
  type: 'footer' | 'header' | 'background' | 'document-page';
};

export class Model {
  declare id: TModel['id'];
  declare type: TModel['type'];

  constructor(opts: TModel) {
    this.id = opts.id;
    this.type = opts.type;
  }
}
