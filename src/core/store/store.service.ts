/**
 * * Dependencies
 */
import { join } from 'path';
import { readFileSync, writeFile } from 'fs';

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

  #parseStoreFile = (filePath: string): KeyValuePair => {
    try {
      return JSON.parse(readFileSync(filePath, { encoding: 'utf-8' }));
    } catch (error) {
      // ? the file will not exist in the beginning
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
    this.#data = this.#parseStoreFile(this.#storeFilePath);
  }

  get(key: string): any {
    return this.#data[key];
  }

  set(key: string, val: any): Promise<boolean> {
    return new Promise((resolve: any) => {
      this.#data[key] = val;
      writeFile(this.#storeFilePath, JSON.stringify(this.#data), (err) => {
        if (err) {
          throw new PlatformError(`Can't write to ${this.#storeFilePath}`);
        }
        resolve(true);
      });
    });
  }

  delete(key: string): void {
    delete this.#data[key];
  }

  get storeFilePath():string {
    return this.#storeFilePath;
  }
}
