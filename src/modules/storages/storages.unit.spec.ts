/**
 * * Mocking
 */

// * BackupLinksModel
const MockedStoragesModel: any = {
  raw: {},
  save: (): void => null,
};

jest.mock('@modules/storages/model/storages.model', () => {
  return {
    StoragesModel: MockedStoragesModel,
  };
});

// * AppService
const MockedAppService: any = {
  logsFolderPath: 'logs',
};

jest.mock('@modules/app/app.service', () => {
  return {
    AppService: MockedAppService,
  };
});

// * UtilsService
const MockedUtilsService: any = {
  generateRandomId: (path: string): void => null,
};

jest.mock('@src/common/util/util.service', () => {
  return {
    UtilService: MockedUtilsService,
  };
});

// * KeytarServices
const MockedKeytarService: any = {
  get: (key: string): any => '',
  save: (key: string, value: string): void => null,
  delete: (key: string): void => null,
};

jest.mock('@core/keytar/keytar.service', () => {
  return {
    KeytarService: MockedKeytarService,
  };
});

// * S3ManagerService
const MockedS3ManagerService: any = {
  listBuckets: (): void => null,
};

jest.mock('@core/s3-manager/s3-manager.service', () => {
  return {
    S3ManagerService: MockedS3ManagerService,
  };
});

// * BackupLinksService
const MockedBackupLinksService: any = {
  removeBackupLinksFromStorage: (storageId: string): void => null,
};

jest.mock('@modules/backup-links/backup-links.service', () => {
  return {
    BackupLinksService: MockedBackupLinksService,
  };
});

/**
 * * Dependencies
 */
import { join } from 'path';

/**
 * * Types
 */
import { BackupLinkStatus } from '../backup-links/@types';

/**
 * * Test Target
 */
import { StoragesService } from './storages.service';
import { UserChange } from '@src/common/errors';
import { StorageStatus } from './@types';

describe('StoragesService - Unit Tests', () => {
  afterEach(() => {
    MockedStoragesModel.raw = {};
    jest.resetAllMocks();
  });

  describe('getS3Credentials()', () => {
    //*
    it('Should return the storage credentials', async () => {
      MockedStoragesModel.raw.id = {
        accessInfo: {
          endpointKeytarIdentifier: '',
          accessKeyIdKeytarIdentifier: '',
          secretAccessKeyKeytarIdentifier: '',
        },
      };

      jest.spyOn(MockedKeytarService, 'get').mockReturnValue('value');

      expect(await StoragesService.getS3Credentials('id')).toEqual({
        endpoint: 'value',
        accessKeyId: 'value',
        secretAccessKey: 'value',
      });
    });

    //*
    it('Should throw an error if the credentials are not present(empty values)', async () => {
      MockedStoragesModel.raw.id = {
        accessInfo: {
          endpointKeytarIdentifier: '',
          accessKeyIdKeytarIdentifier: '',
          secretAccessKeyKeytarIdentifier: '',
        },
      };

      jest.spyOn(MockedKeytarService, 'get').mockReturnValue(undefined);

      await expect(StoragesService.getS3Credentials('id')).rejects.toThrow(
        UserChange,
      );
    });
  });

  describe('addS3Storage()', () => {
    //*
    it("Should add a new storage and save it's credentials", async () => {
      const spyModelSave = jest.spyOn(MockedStoragesModel, 'save');
      const spyKeytarSave = jest.spyOn(MockedKeytarService, 'save');

      jest.spyOn(MockedUtilsService, 'generateRandomId').mockReturnValue('id');

      await StoragesService.addS3Storage({
        storageName: 'storageName',
        endpoint: 'endpoint',
        accessKeyId: 'accessKeyId',
        secretAccessKey: 'secretAccessKey',
      });

      expect(MockedStoragesModel.raw.id).toBeDefined();

      expect(MockedStoragesModel.raw.id).toEqual({
        id: 'id',
        storageName: 'storageName',
        accessInfo: {
          endpointKeytarIdentifier: `id-endpoint`,
          accessKeyIdKeytarIdentifier: `id-accesskeyid`,
          secretAccessKeyKeytarIdentifier: `id-sacesskey`,
        },
      });

      expect(spyModelSave).toHaveBeenCalled();
      expect(spyKeytarSave).toHaveBeenNthCalledWith(
        1,
        `id-endpoint`,
        'endpoint',
      );
      expect(spyKeytarSave).toHaveBeenNthCalledWith(
        2,
        `id-accesskeyid`,
        'accessKeyId',
      );
      expect(spyKeytarSave).toHaveBeenNthCalledWith(
        3,
        `id-sacesskey`,
        'secretAccessKey',
      );
    });
  });

  describe('removeStorage()', () => {
    //*
    it("Should remove a storage, it's credentials and the associated backup links", async () => {
      const spyModelSave = jest.spyOn(MockedStoragesModel, 'save');
      const spyKeytarDelete = jest.spyOn(MockedKeytarService, 'delete');
      const spyBackupLinksRemove = jest.spyOn(
        MockedBackupLinksService,
        'removeBackupLinksFromStorage',
      );

      MockedStoragesModel.raw.id = {
        accessInfo: {
          endpointKeytarIdentifier: '',
          accessKeyIdKeytarIdentifier: '',
          secretAccessKeyKeytarIdentifier: '',
        },
      };

      await StoragesService.removeStorage('id');

      expect(MockedStoragesModel.raw.id).not.toBeDefined();

      expect(spyModelSave).toHaveBeenCalled();
      expect(spyKeytarDelete).toHaveBeenCalledTimes(3);

      expect(spyBackupLinksRemove).toHaveBeenCalledWith('id');
    });
  });

  describe('removeAllStorages()', () => {
    //*
    it('Should remove all storage, their credentials and the associated backup links', async () => {
      const spyModelSave = jest.spyOn(MockedStoragesModel, 'save');
      const spyKeytarDelete = jest.spyOn(MockedKeytarService, 'delete');
      const spyBackupLinksRemove = jest.spyOn(
        MockedBackupLinksService,
        'removeBackupLinksFromStorage',
      );

      MockedStoragesModel.raw = {
        id: {
          accessInfo: {
            endpointKeytarIdentifier: '',
            accessKeyIdKeytarIdentifier: '',
            secretAccessKeyKeytarIdentifier: '',
          },
        },
        id2: {
          accessInfo: {
            endpointKeytarIdentifier: '',
            accessKeyIdKeytarIdentifier: '',
            secretAccessKeyKeytarIdentifier: '',
          },
        },
      };

      await StoragesService.removeAllStorages();

      expect(MockedStoragesModel.raw.id).not.toBeDefined();
      expect(MockedStoragesModel.raw.id2).not.toBeDefined();

      expect(spyModelSave).toHaveBeenCalled();
      expect(spyKeytarDelete).toHaveBeenCalledTimes(6);

      expect(spyBackupLinksRemove).toHaveBeenNthCalledWith(1, 'id');
      expect(spyBackupLinksRemove).toHaveBeenNthCalledWith(2, 'id2');
    });
  });

  describe('listStoragesByNames()', () => {
    //*
    it('Should return the storageName for each storage', () => {
      MockedStoragesModel.raw.id = { storageName: 'one' };
      MockedStoragesModel.raw.secondId = { storageName: 'two' };

      expect(StoragesService.listStoragesByNames()).toEqual(['one', 'two']);
    });
  });

  describe('storageNameToIdMap()', () => {
    //*
    it("Should return the id of a storage based on it's name", () => {
      MockedStoragesModel.raw.id = { storageName: 'one' };

      expect(StoragesService.storageNameToIdMap('one')).toBe('id');
    });

    //*
    it('Should return undefined if there is no storage with the supplied name ', () => {
      expect(StoragesService.storageNameToIdMap('one')).toBeUndefined();
    });
  });

  describe('getStoragesStatus()', () => {
    beforeEach(() => {
      MockedStoragesModel.raw.id = {
        storageName: 'name',
        accessInfo: {
          endpointKeytarIdentifier: '',
          accessKeyIdKeytarIdentifier: '',
          secretAccessKeyKeytarIdentifier: '',
        },
      };
    });

    // *
    it('Should return the correct status when credentials are not reachable', async () => {
      jest.spyOn(MockedKeytarService, 'get').mockReturnValue(undefined);

      const data: StorageStatus[] = await StoragesService.getStoragesStatus();

      expect(Array.isArray(data)).toBeTruthy();
      expect(data[0]).toEqual({
        storageId: 'id',
        storageName: 'name',
        credentialsAreOk: false,
        isOnline: false,
      });
    });

    // *
    it('Should return the correct status when credentials are reachable but it fails to list the bucket', async () => {
      jest.spyOn(MockedKeytarService, 'get').mockReturnValue('value');
      jest
        .spyOn(MockedS3ManagerService, 'listBuckets')
        .mockImplementation(() => {
          throw new Error();
        });

      const data: StorageStatus[] = await StoragesService.getStoragesStatus();

      expect(Array.isArray(data)).toBeTruthy();
      expect(data[0]).toEqual({
        storageId: 'id',
        storageName: 'name',
        credentialsAreOk: true,
        isOnline: false,
      });
    });

    // *
    it('Should return the correct status when both the credentials and the object storage', async () => {
      jest.spyOn(MockedKeytarService, 'get').mockReturnValue('value');
      jest
        .spyOn(MockedS3ManagerService, 'listBuckets')
        .mockImplementation(() => null);

      const data: StorageStatus[] = await StoragesService.getStoragesStatus();

      expect(Array.isArray(data)).toBeTruthy();
      expect(data[0]).toEqual({
        storageId: 'id',
        storageName: 'name',
        credentialsAreOk: true,
        isOnline: true,
      });
    });
  });
});
