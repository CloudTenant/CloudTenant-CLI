/**
 * * Services
 */
import { StoreService } from '@core/store/store.service';

/**
 * * Modles and types
 */
import { BaseModel } from '@core/model/base.model';
import { Storages } from '../@types/interface';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';

class Model extends BaseModel {
  #modelData: Storages = {};

  get raw() {
    return this.#modelData;
  }

  constructor(store: StoreService, storeKey: string) {
    super(store, storeKey);

    Object.assign(this.#modelData, super.get());
  }

  public async save(): Promise<boolean> {
    return super.save(this.#modelData);
  }
}

const StoragesModel = new Model(
  new StoreService(APP_CONSTANTS.storagesDbFileName),
  'storages',
);

Object.freeze(StoragesModel);

export { StoragesModel };
