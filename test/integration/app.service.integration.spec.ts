/**
 * * Test env
 */

import { APP_CONSTANTS } from '../../src/constants';
APP_CONSTANTS.appDataFolderName = 'CloudTenantCLI-Testing';

/**
 * * Dependencies
 */
import * as fs from 'fs';
import { join } from 'path';

/**
 * * Test Target
 */
import { AppService } from '../../src/modules/app/app.service';

describe('AppService - Integration Tests', () => {
  const APP_TEST_FOLDER: string = join(
    process.env.APPDATA,
    APP_CONSTANTS.appDataFolderName,
  );

  afterAll(() => {
    fs.rmSync(APP_TEST_FOLDER, {
      recursive: true,
    });
  });

  describe('initApp()', () => {
    it('Should correctly initiate the application', async () => {
      await AppService.initApp();

      expect(fs.existsSync(APP_TEST_FOLDER)).toBeTruthy();
      expect(
        fs.existsSync(join(APP_TEST_FOLDER, APP_CONSTANTS.logsFolder)),
      ).toBeTruthy();

      const data: any = JSON.parse(
        fs.readFileSync(
          join(APP_TEST_FOLDER, APP_CONSTANTS.mainDbFileName + '.json'),
          'utf-8',
        ),
      );

      expect(data.appInit).toBeTruthy();
    });
  });
});
