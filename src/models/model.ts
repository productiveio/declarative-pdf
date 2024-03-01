// import type { PDFDocument } from 'pdf-lib';
import DeclarativePDF from './declarative-pdf';

export type TModel = {
  id: string;
  type: 'footer' | 'header' | 'background' | 'document-page';
  owner: DeclarativePDF;
};

export class Model {
  declare id: TModel['id'];
  declare type: TModel['type'];
  declare owner: TModel['owner'];

  constructor(opts: TModel) {
    this.id = opts.id;
    this.type = opts.type;
    this.owner = opts.owner;
  }
}
