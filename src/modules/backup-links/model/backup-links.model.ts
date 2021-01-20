/**
 * * Services
 */
import { StoreService } from '@core/store/store.service';

/**
 * * Modles and types & config
 */
import { BaseModel } from '@core/model/base.model';
import { Links } from '../@types';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';

class Model extends BaseModel {
  #modelData: Links = {};

  get raw() {
    return this.#modelData;
  }

  constructor(store: StoreService, storeKey: string) {
    super(store, storeKey);

    this.#modelData = super.get();
  }

  async save(): Promise<boolean> {
    return super.save(this.#modelData);
  }

  async update(): Promise<void> {
    await super.update();
    this.#modelData = super.get();
  }
}

const BackupLinksModel = new Model(
  new StoreService(APP_CONSTANTS.backupLinkDbFileName),
  'backupLinks',
);

Object.freeze(BackupLinksModel);

export { BackupLinksModel };
