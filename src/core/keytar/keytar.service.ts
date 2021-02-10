/**
 * * Dependencies
 */
import * as keytar from 'keytar';

/**
 * * Constants
 */
import { APP_CONSTANTS } from '@src/constants';

class Class {
  #service: string = APP_CONSTANTS.appName;

  async save(account: string, password: string): Promise<void> {
    await keytar.setPassword(this.#service, account, password);
  }

  async get(account: string): Promise<string | null> {
    const value: string | null = await keytar.getPassword(
      this.#service,
      account,
    );
    return value;
  }

  async delete(account: string): Promise<boolean> {
    const wasDeleted: boolean = await keytar.deletePassword(
      this.#service,
      account,
    );
    return wasDeleted;
  }
}

const KeytarService = new Class();

Object.freeze(KeytarService);

export { KeytarService };