/**
 * * Mocking
 */

// * BackupLinksModel
const MockedAppModel: any = {
  raw: {},
  save: (): void => null,
};

jest.mock('@modules/app/model/app.model', () => {
  return {
    AppModel: MockedAppModel,
  };
});

//* UtilsService
const MockedUtilsService: any = {
  createFolder: (path: string): void => null,
  removeFolder: (path: string): void => null,
};

jest.mock('@src/common/util/util.service', () => {
  return {
    UtilService: MockedUtilsService,
  };
});

// * LoggerService
const MockedLoggerService: any = {
  warn: (msg: string): void => null,
};

jest.mock('@core/logger/logger.service', () => {
  return {
    LoggerService: MockedLoggerService,
  };
});

// * StoragesService
const MockedStoragesService: any = {
  removeAllStorages: (): any => true,
};

jest.mock('@modules/storages/storages.service', () => {
  return {
    StoragesService: MockedStoragesService,
  };
});

/**
 * * Test Target
 */
import { AppService } from './app.service';

describe('AppService - Unit Tests', () => {
  afterEach(() => {
    MockedAppModel.raw = {};
    jest.resetAllMocks();
  });

  describe('initApp()', () => {
    // *
    it('Should initiate the application, by creating the required folders and by setting the appInit property to true', async () => {
      const spySave = jest.spyOn(MockedAppModel, 'save');

      const createFolderSpy = jest.spyOn(MockedUtilsService, 'createFolder');

      const output: boolean = await AppService.initApp();

      expect(output).toBeTruthy();
      expect(MockedAppModel.raw.appInit).toBeTruthy();
      expect(createFolderSpy).toHaveBeenCalledTimes(2);
      expect(spySave).toHaveBeenCalled();
    });

    // *
    it('Should handle the scenario where the application was initiated before', async () => {
      MockedAppModel.raw.appInit = true;

      const saveSpy = jest.spyOn(MockedAppModel, 'save');
      const createFolderSpy = jest.spyOn(MockedUtilsService, 'createFolder');
      const warnSpy = jest.spyOn(MockedLoggerService, 'warn');

      const output: boolean = await AppService.initApp();

      expect(output).toBeFalsy();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledTimes(0);
      expect(createFolderSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('removeAppData()', () => {
    // *
    it("Should remove all the application's data", async () => {
      const removeStoragesSpy = jest.spyOn(
        MockedStoragesService,
        'removeAllStorages',
      );

      const removeFolderSpy = jest
        .spyOn(MockedUtilsService, 'removeFolder')
        .mockImplementationOnce(() => true);

      const output: boolean = await AppService.removeAppData();

      expect(output).toBeTruthy();
      expect(removeStoragesSpy).toHaveBeenCalled();
      expect(removeFolderSpy).toHaveBeenCalled();
    });

    // *
    it("Should handle the scenario where the application's data was already removed", async () => {
      const removeStoragesSpy = jest.spyOn(
        MockedStoragesService,
        'removeAllStorages',
      );

      const removeFolderSpy = jest
        .spyOn(MockedUtilsService, 'removeFolder')
        .mockImplementation(() => false);

      const warnSpy = jest.spyOn(MockedLoggerService, 'warn');

      const output: boolean = await AppService.removeAppData();

      expect(output).toBeFalsy();
      expect(removeStoragesSpy).toHaveBeenCalled();
      expect(removeFolderSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
