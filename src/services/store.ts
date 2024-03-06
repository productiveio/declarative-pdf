import DeclarativePDF from '@app/index';
import { DocumentPage } from '@app/models/document-page';
import { PageElement } from '@app/models/page-element';
import crypto from 'crypto';

// import type {PDFDocument} from 'pdf-lib';

const modelFactories = {
  page: DocumentPage,
  body: PageElement,
  footer: PageElement,
  header: PageElement,
  background: PageElement,
};

type ModelFactoryMap = typeof modelFactories;

type ModelOpts<K extends keyof ModelFactoryMap> = Omit<
  ConstructorParameters<ModelFactoryMap[K]>[0],
  'id' | 'type' | 'owner'
>;

type ModelInstance<K extends keyof ModelFactoryMap> = InstanceType<
  ModelFactoryMap[K]
>;

export class Store {
  declare owner: DeclarativePDF;
  private models: Record<string, ModelInstance<keyof ModelFactoryMap>> = {};

  constructor(owner: DeclarativePDF) {
    this.owner = owner;
  }

  getNewId(): string {
    const id = crypto.randomBytes(16).toString('hex');
    if (this.models[id]) return this.getNewId();

    return id;
  }

  createModel<K extends keyof ModelFactoryMap>(
    key: K,
    opts: ModelOpts<K>
  ): ModelInstance<K> {
    const ModelClass = modelFactories[key] as new (
      opts: ModelOpts<K>
    ) => ModelInstance<K>;

    const id = this.getNewId();
    const model = new ModelClass({ ...opts, id, type: key, owner: this.owner });

    this.models[id] = model;
    return model;
  }

  getModel(id: string) {
    return this.models[id];
  }
}
