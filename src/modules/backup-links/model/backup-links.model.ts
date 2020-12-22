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

    Object.assign(this.#modelData, super.get());
  }

  public async save(): Promise<boolean> {
    return super.save(this.#modelData);
  }

  public delete() {
    super.delete();
  }
}

const BackupLinksModel = new Model(
  new StoreService(APP_CONSTANTS.backupLinkDbFileName),
  'backupLinks',
);

Object.freeze(BackupLinksModel);

export { BackupLinksModel };
