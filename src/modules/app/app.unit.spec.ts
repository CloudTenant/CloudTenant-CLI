/**
 * * Mocking
 */
const MockedStoreService: any = {
  get: (key: string): void => null,
  set: (key: string, val: any): void => null,
};
const MockedUtilsService: any = {
  createFolder: (path: string): void => null,
};

const MockedLoggerService: any = {
  warn: (msg: string): void => null,
};

jest.mock('@core/store/store.service', () => {
  return {
    StoreService: jest.fn().mockImplementation((storeFileName: string) => {
      return MockedStoreService;
    }),
  };
});

jest.mock('@src/common/util/util.service', () => {
  return {
    UtilService: MockedUtilsService,
  };
});

jest.mock('@core/logger/logger.service', () => {
  return {
    LoggerService: MockedLoggerService,
  };
});

/**
 * * Test Target
 */
import { AppService } from './app.service';

describe('AppService - Unit Tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initApp()', () => {
    // *
    it('Should initiate the application, by creating the required folders and by setting the appInit property to true', () => {
      jest
        .spyOn(MockedStoreService, 'get')
        .mockImplementation((key: string) => false);

      const setSpy = jest.spyOn(MockedStoreService, 'set');

      const createFolderSpy = jest.spyOn(MockedUtilsService, 'createFolder');

      const output: boolean = AppService.initApp();

      expect(output).toBeTruthy();

      expect(setSpy).toHaveBeenCalled();
      expect(setSpy).toHaveBeenCalledWith('appInit', true);
      expect(createFolderSpy).toHaveBeenCalledTimes(2);
    });

    // *
    it('Should handle the scenario where the application was initiated before', () => {
      jest
        .spyOn(MockedStoreService, 'get')
        .mockImplementation((key: string) => true);

      const setSpy = jest.spyOn(MockedStoreService, 'set');
      const createFolderSpy = jest.spyOn(MockedUtilsService, 'createFolder');
      const warnSpy = jest.spyOn(MockedLoggerService, 'warn');

      const output: boolean = AppService.initApp();

      expect(output).toBeFalsy();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledTimes(0);
      expect(createFolderSpy).toHaveBeenCalledTimes(0);
    });
  });
});
