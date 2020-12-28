/**
 * * Dependencies
 */
import * as fs from 'fs';
import { join } from 'path';

/**
 * * Test Target
 */
import { UtilService } from '../../src/common/util/util.service';

describe('AppService - Integration Tests', () => {
  const APP_TEST_FOLDER: string = join(
    process.env.APPDATA,
    'CloudTenantCLI-Testing',
  );

  beforeAll(() => {
    fs.mkdirSync(APP_TEST_FOLDER);
  });

  afterAll(() => {
    fs.rmSync(APP_TEST_FOLDER, {
      recursive: true,
    });
  });

  describe('removeFolder()', () => {
    // *
    it("Should correctly remove a folder and all it's subfolders", () => {
      // ? create the test data
      const dummyFolderPath = join(APP_TEST_FOLDER, 'folder-to-delete');
      fs.mkdirSync(dummyFolderPath);
      fs.writeFileSync(join(dummyFolderPath, 'file.txt'), 'dummy-text');

      // ? validate that it was created correctly
      expect(fs.existsSync(dummyFolderPath)).toBeTruthy();

      // ? test the remove function
      UtilService.removeFolder(dummyFolderPath);

      expect(fs.existsSync(dummyFolderPath)).toBeFalsy();
    });
  });
});
