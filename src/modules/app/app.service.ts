/**
 * * Dependencies
 */
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { LoggerService } from '@core/logger/logger.service';
import { StoreService } from '@core/store/store.service';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';
import { UtilService } from '@src/common/util/util.service';

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
  removeAppData(): boolean {
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
