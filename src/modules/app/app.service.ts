/**
 * * Dependencies
 */
import { join } from 'path';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';
import { UtilService } from '@src/common/util/util.service';

/**
 * * Services
 */
import { StoreService } from '@core/store/store.service';
import { LoggerService } from '@core/logger/logger.service';
import { StoragesService } from '../storages/storages.service';

export class Class {
  #appFolderPath: string = join(
    process.env.APPDATA,
    APP_CONSTANTS.appDataFolderName,
  );
  #logsFolderPath: string = join(this.#appFolderPath, APP_CONSTANTS.logsFolder);

  #store: StoreService = new StoreService(APP_CONSTANTS.mainDbFileName);

  /**
   * * Private methods
   */

  /**
   * * Public methods
   */

  /**
   * * checkIfAppWasInitialiezd
   */
  checkIfAppWasInitialiezd(): boolean {
    return this.#store.get('appInit');
  }

  /**
   * * initApp
   * ? this function will initialize all the requirments (ex: create store folder/folders)
   */
  async initApp(): Promise<boolean> {
    if (this.#store.get('appInit')) {
      LoggerService.warn('The application was already initialized');
      return false;
    }

    // ? create the folders where the required data will be stored
    UtilService.createFolder(this.#appFolderPath);
    UtilService.createFolder(this.#logsFolderPath);

    await this.#store.set('appInit', true);
    return true;
  }

  /**
   * * removeAppData
   * ? this function will delete all the data that this application created
   */
  async removeAppData(): Promise<boolean> {
    await StoragesService.removeAllStorages();

    const removedSuccessfully: boolean = UtilService.removeFolder(
      this.#appFolderPath,
    );

    if (!removedSuccessfully) {
      LoggerService.warn("The application's data was already removed");
      return false;
    }

    return true;
  }

  get logsFolderPath(): string {
    return this.#logsFolderPath;
  }
}

const AppService = new Class();
Object.freeze(AppService);

export { AppService };
