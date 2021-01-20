/**
 * * Mocks
 */

// const mockedFs = {
//   readFileSync: () => 's',
//   writeFile: (a: any, b: any, cb: Function) => cb(),
// };

// jest.mock('fs', () => {
//   return mockedFs;
// });

// const fThatReturnError = (a: any, b: any, cb: Function) => cb('err');

/**
 * * Dependencies
 */
import { join } from 'path';
import * as util from 'util';
import * as fs from 'fs';

/**
 * * Services
 */
import { StoreService } from './store.service';

/**
 * * Custom errors
 */
import { ConfigError, PlatformError } from '../../common/errors';

/**
 * * Test env
 */
import { APP_CONSTANTS } from '@src/constants';

/**
 * * Types
 */

describe('StoreService Unit Testing', () => {
  const STORE_FILE_NAME = 'testfile';
  let SERVICE: StoreService;

  // const dummyKey: string = 'key';
  // const dummyValue: string = 'value';

  beforeAll(() => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: string, options: any) => '{}');

    SERVICE = new StoreService(STORE_FILE_NAME);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // *
  it('Should throw error if the instance is constructed without the service name', () => {
    expect(() => new StoreService(undefined)).toThrow(ConfigError);
  });

  // *
  it('It should be able to set the data', async () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: string, options: any) => '{}');

    jest
      .spyOn(fs, 'writeFile')
      .mockImplementation((a: any, b: any, cb: Function) => cb());

    const res: boolean = await SERVICE.set('dummyKey', 'dummyValue');

    expect(res).toBe(true);
  });

  // *
  it("It should be able to catch the error if can't write to file", async () => {
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((filePath: string, options: any) => '{}');

    jest
      .spyOn(fs, 'writeFile')
      .mockImplementation((a: any, b: any, cb: Function) => cb('err'));

    try {
      await SERVICE.set('dummyKey', 'dummyValue');
    } catch (err) {
      expect(err).toBeDefined();
      expect(err instanceof PlatformError).toBeTruthy();
    }
  });

  // *
  it('It should be able to get the data', async () => {
    expect(SERVICE.get('dummyKey')).toBe('dummyValue');
  });

  // *
  it('It should return the correct path to the store file', () => {
    expect(SERVICE.storeFilePath).toBe(
      join(
        process.env.APPDATA,
        APP_CONSTANTS.appDataFolderName,
        `${STORE_FILE_NAME}.json`,
      ),
    );
  });

  // *
  it('Should be able to update the data', async () => {
    jest.spyOn(util, 'promisify').mockImplementation((fn: any): any => fn);
    jest
      .spyOn(fs, 'readFile')
      .mockImplementation(() => JSON.stringify({ key: 'value' }));

    await SERVICE.update();

    expect(SERVICE.get('key')).toBe('value');
  });

  // *
  it("Should catch the error if it can't update the data", async () => {
    jest.spyOn(util, 'promisify').mockImplementation((fn: any): any => fn);
    jest.spyOn(fs, 'readFile').mockImplementation(() => {
      throw new Error();
    });

    await expect(SERVICE.update()).rejects.toThrow(PlatformError);

    expect(SERVICE.get('key')).toBe('value');
  });
});
