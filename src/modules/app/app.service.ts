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
import { LoggerService } from '@core/logger/logger.service';
import { StoragesService } from '../storages/storages.service';

/**
 * * Model
 */
import { AppModel } from './model/app.model';

export class Class {
  #logsFolderPath: string = join(
    APP_CONSTANTS.appDataFolderPath,
    APP_CONSTANTS.logsFolder,
  );

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
    return AppModel.raw['appInit'];
  }

  /**
   * * initApp
   * ? this function will initialize all the requirments (ex: create store folder/folders)
   */
  async initApp(): Promise<boolean> {
    if (AppModel.raw['appInit']) {
      LoggerService.warn('The application was already initialized');
      return false;
    }

    // ? create the folders where the required data will be stored
    UtilService.createFolder(APP_CONSTANTS.appDataFolderPath);
    UtilService.createFolder(this.#logsFolderPath);

    AppModel.raw.appInit = true;
    await AppModel.save();
    return true;
  }

  /**
   * * removeAppData
   * ? this function will delete all the data that this application created
   */
  async removeAppData(): Promise<boolean> {
    await StoragesService.removeAllStorages();

    const removedSuccessfully: boolean = UtilService.removeFolder(
      APP_CONSTANTS.appDataFolderPath,
    );

    if (!removedSuccessfully) {
      LoggerService.warn("The application's data was already removed");
      return false;
    }

    return true;
  }

  /**
   * * Getters
   */
  get logsFolderPath(): string {
    return this.#logsFolderPath;
  }
}

const AppService = new Class();
Object.freeze(AppService);

export { AppService };
