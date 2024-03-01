import { PageElement } from './page-element';
import { DocumentPage } from './document-page';
import crypto from 'crypto';

// import type {PDFDocument} from 'pdf-lib';

const modelFactories = {
  page: DocumentPage,
  footer: PageElement,
  header: PageElement,
  background: PageElement,
};

type ModelFactoryMap = typeof modelFactories;

type ModelOpts<K extends keyof ModelFactoryMap> = Omit<
  ConstructorParameters<ModelFactoryMap[K]>[0],
  'id' | 'type'
>;

type ModelInstance<K extends keyof ModelFactoryMap> = InstanceType<
  ModelFactoryMap[K]
>;

export class Store {
  private models: Record<string, ModelInstance<keyof ModelFactoryMap>> = {};

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
    const model = new ModelClass({ ...opts, id, type: key });

    this.models[id] = model;
    return model;
  }

  getModel(id: string) {
    return this.models[id];
  }
}
