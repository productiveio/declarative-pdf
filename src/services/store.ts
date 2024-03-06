import DeclarativePDF from '@app/index';
import { DocumentPage } from '@app/models/document-page';
import { PageElement } from '@app/models/page-element';

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
  'type' | 'owner'
>;

type ModelInstance<K extends keyof ModelFactoryMap> = InstanceType<
  ModelFactoryMap[K]
>;

export class Store {
  declare owner: DeclarativePDF;

  constructor(owner: DeclarativePDF) {
    this.owner = owner;
  }

  createModel<K extends keyof ModelFactoryMap>(
    key: K,
    opts: ModelOpts<K>
  ): ModelInstance<K> {
    const ModelClass = modelFactories[key] as new (
      opts: ModelOpts<K>
    ) => ModelInstance<K>;

    return new ModelClass({ ...opts, type: key, owner: this.owner });
  }
}
