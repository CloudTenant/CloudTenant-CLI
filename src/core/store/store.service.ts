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

  // * used in constructor
  #parseStoreFileSync = (filePath: string): KeyValuePair => {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      // ? the file will not exist in the beginning
      return {};
    }
  };

  #parseStoreFileASync = async (filePath: string): Promise<KeyValuePair> => {
    const readFile = util.promisify(fs.readFile);
    const fileText: string = await readFile(filePath, 'utf-8');
    return JSON.parse(fileText);
  };

  constructor(storeFileName: string) {
    if (!storeFileName) {
      throw new ConfigError('The store file name was omitted');
    }

    this.#storeFilePath = join(
      APP_CONSTANTS.appDataFolderPath,
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
  async update(): Promise<boolean | never> {
    try {
      this.#data = await this.#parseStoreFileASync(this.#storeFilePath);
      return true;
    } catch (err) {
      throw new PlatformError(
        `Can't read the db file - ${this.#storeFilePath}`,
      );
    }
  }

  // * return the path to the local file used as database
  get storeFilePath(): string {
    return this.#storeFilePath;
  }
}
