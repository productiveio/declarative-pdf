import DeclarativePDF from '@app/index';

export type TModel = {
  type: 'footer' | 'header' | 'background' | 'body';
  owner: DeclarativePDF;
};

export class Model {
  declare type: TModel['type'];
  declare owner: TModel['owner'];

  constructor(opts: TModel) {
    this.type = opts.type;
    this.owner = opts.owner;
  }
}
