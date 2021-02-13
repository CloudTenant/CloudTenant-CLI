/**
 * * Services
 */
import { StoreService } from '@core/store/store.service';

/**
 * * Modles and types
 */
import { BaseModel } from '@core/model/base.model';
import { App } from '../@types/interface';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';

class Model extends BaseModel {
  #modelData: Partial<App> = {
    startupProcess: {
      pid: null,
    },
  };

  get raw() {
    return this.#modelData;
  }

  constructor(store: StoreService, storeKey: string) {
    super(store, storeKey);

    Object.assign(this.#modelData, super.get());
  }

  async save(): Promise<boolean> {
    return super.save(this.#modelData);
  }

  async update(): Promise<void> {
    await super.update();
    this.#modelData = super.get() ?? {};
  }
}

const AppModel = new Model(
  new StoreService(APP_CONSTANTS.mainDbFileName),
  'app',
);

Object.freeze(AppModel);

export { AppModel };
