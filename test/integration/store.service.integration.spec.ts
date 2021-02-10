/**
 * * Test env
 */

import { APP_CONSTANTS } from '../../src/constants';
APP_CONSTANTS.appDataFolderPath = APP_CONSTANTS.appDataFolderPath.replace(
  'CloudTenantCLI',
  'CloudTenantCLI-Testing',
);

/**
 * * Dependencies
 */
import * as fs from 'fs';
import { join } from 'path';

/**
 * * Test Target
 */
import { StoreService } from '../../src/core/store/store.service';

describe('StoreService - Integration Tests', () => {
  const APP_TEST_FOLDER: string = APP_CONSTANTS.appDataFolderPath;

  const STORE_NAME = 'dummy-store';
  const STORE_PATH: string = join(APP_TEST_FOLDER, STORE_NAME + '.json');

  afterAll(() => {
    fs.rmSync(APP_TEST_FOLDER, {
      recursive: true,
    });
  });

  beforeAll(() => {
    fs.mkdirSync(APP_TEST_FOLDER);
  });

  afterEach(() => {
    try {
      fs.rmSync(STORE_PATH);
    } catch (err) {}
  });

  // *
  it("Should be able to create a new instance of a store even though the store file doesn't exist yet", () => {
    // ? this function should not throw
    new StoreService(STORE_NAME);
    expect(true).toBeTruthy;
  });

  it('Should be able to retrieve the existing data from the file and save it in the store(memory)', () => {
    // ? create the test data
    fs.writeFileSync(STORE_PATH, JSON.stringify({ dummy: 'hello there' }));

    const myStore = new StoreService(STORE_NAME);
    expect(myStore.get('dummy')).toBe('hello there');
  });

  it("Should create the store file when trying to save something in the store and the file doesn't already exists", async () => {
    const myStore = new StoreService(STORE_NAME);
    await myStore.set('dummy-key', 'dummy-val');

    expect(fs.existsSync(STORE_PATH)).toBeTruthy();
  });
});
