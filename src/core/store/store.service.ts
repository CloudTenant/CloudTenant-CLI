/**
 * * Dependencies
 */
import { join } from 'path';
import * as fs from 'fs';
import * as util from 'util';

/**
 * * Types
 */
import { KeyValuePair } from '../../@types/interface';

/**
 * * Custom errors
 */
import { ConfigError, PlatformError } from '@common/errors';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';

export class StoreService {
  #storeFilePath: string;
  #data: KeyValuePair;

  #parseStoreFileSync = (filePath: string): KeyValuePair => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      // ? the file will not exist in the beginning
      return {};
    }
  };

  #parseStoreFileASync = async (filePath: string): Promise<KeyValuePair> => {
    try {
      const readFile = util.promisify(fs.readFile);
      const fileText: string = await readFile(filePath, 'utf-8');
      return JSON.parse(fileText);
    } catch (err) {
      return {};
    }
  };

  constructor(storeFileName: string) {
    if (!storeFileName) {
      throw new ConfigError('The store file name was omitted');
    }

    this.#storeFilePath = join(
      process.env.APPDATA,
      APP_CONSTANTS.appDataFolderName,
      `${storeFileName}.json`,
    );
    this.#data = this.#parseStoreFileSync(this.#storeFilePath);
  }

  get(key: string): any {
    return this.#data[key];
  }

  set(key: string, val: any): Promise<boolean> {
    return new Promise((resolve: any) => {
      this.#data[key] = val;
      fs.writeFile(this.#storeFilePath, JSON.stringify(this.#data), (err) => {
        if (err) {
          throw new PlatformError(`Can't write to ${this.#storeFilePath}`);
        }
        resolve(true);
      });
    });
  }

  // * read the data from the db file and update the private var
  async update() {
    this.#data = await this.#parseStoreFileASync(this.#storeFilePath);
  }

  // * return the path to the local file used as database
  get storeFilePath(): string {
    return this.#storeFilePath;
  }
}
