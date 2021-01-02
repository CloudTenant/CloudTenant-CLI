/**
 * * Mocking
 */

// * BackupLinksModel
const MockedBackupLinksModel: any = {
  raw: {},
  save: (): void => null,
};

jest.mock('@modules/backup-links/model/backup-links.model', () => {
  return {
    BackupLinksModel: MockedBackupLinksModel,
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
  emptyFileContent: (path: string): void => null,
  bytesToSize: (size: number): void => null,
};

jest.mock('@src/common/util/util.service', () => {
  return {
    UtilService: MockedUtilsService,
  };
});

// * LoggerService
const MockedLoggerService: any = {
  appendToFile: (path: string, text: string): void => null,
  overWriteFileAtPosition: (path: string, msg: string, pos: number): void =>
    null,
};

jest.mock('@src/core/logger/logger.service', () => {
  return {
    LoggerService: MockedLoggerService,
  };
});

// * StoragesService
const MockedStoragesService: any = {
  getS3Credentials: (storageId: string): any => '',
};

jest.mock('@modules/storages/storages.service', () => {
  return {
    StoragesService: MockedStoragesService,
  };
});

// * S3ManagerService
const MockedS3ManagerService: any = {
  localToS3: (payload: any, cb: any): void => null,
  buildS3Client: (credentials: any): any => '',
};

jest.mock('@core/s3-manager/s3-manager.service', () => {
  return {
    S3ManagerService: MockedS3ManagerService,
  };
});

// * dir-fs-utils
const mockedDirUtils = {
  getFolderSize: (): any => null,
  listFolderContent: (): any => null,
};

jest.mock('dir-fs-utils', () => {
  return {
    DirUtils: mockedDirUtils,
  };
});

/**
 * * Dependencies
 */
import { join } from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as os from 'os';

/**
 * * Types & Constants
 */
import { BackupLinkStatus } from './@types';

import { LOG_MARKERS, PROGRESS_LOG_LINE_POS } from './constants';

/**
 * * Errors
 */
import { BackupLinksError, UserChange } from '@src/common/errors';

/**
 * * Test Target
 */
import { BackupLinksService } from './backup-links.service';

describe('BackupLinksService - Unit Tests', () => {
  afterEach(() => {
    MockedBackupLinksModel.raw = {};
    jest.resetAllMocks();

    jest.spyOn(util, 'promisify').mockImplementation((fn: any): any => fn);
  });

  describe('addBackupLink()', () => {
    //*
    it('Should add a new backup-link with the default options', async () => {
      const spySave = jest.spyOn(MockedBackupLinksModel, 'save');

      jest.spyOn(MockedUtilsService, 'generateRandomId').mockReturnValue('id');

      //@ts-ignore
      await BackupLinksService.addBackupLink({});

      expect(MockedBackupLinksModel.raw.id).toBeDefined();

      expect(MockedBackupLinksModel.raw.id).toEqual({
        id: 'id',
        lastBackupTimestamp: 0,
        status: BackupLinkStatus.PENDING,
        logsPath: join(MockedAppService.logsFolderPath, `backup-link-id.log`),
      });

      expect(spySave).toHaveBeenCalled();
    });
  });

  describe('removeBackupLink()', () => {
    //*
    it('Should remove backup-link', async () => {
      const spySave = jest.spyOn(MockedBackupLinksModel, 'save');

      MockedBackupLinksModel.raw.id = {};

      expect(MockedBackupLinksModel.raw.id).toBeDefined();
      await BackupLinksService.removeBackupLink('id');
      expect(MockedBackupLinksModel.raw.id).not.toBeDefined();

      expect(spySave).toHaveBeenCalled();
    });
  });

  describe('listBackupLinksByNames()', () => {
    //*
    it('Should return the linkName for each backup-link', () => {
      MockedBackupLinksModel.raw.id = { linkName: 'one' };
      MockedBackupLinksModel.raw.secondId = { linkName: 'two' };

      expect(BackupLinksService.listBackupLinksByNames()).toEqual([
        'one',
        'two',
      ]);
    });
  });

  describe('backupLinksNameToIdMap()', () => {
    //*
    it("Should return the id of a backup link based on it's name", () => {
      MockedBackupLinksModel.raw.id = { linkName: 'one' };

      expect(BackupLinksService.backupLinksNameToIdMap('one')).toBe('id');
    });

    //*
    it('Should return undefined if there is no backup link with the supplied name', () => {
      expect(BackupLinksService.backupLinksNameToIdMap('one')).toBeUndefined();
    });
  });

  describe('startBackup()', () => {
    // *
    it('Should throw an error if no backup with the supplied id is found', async () => {
      MockedBackupLinksModel.raw = {};

      await expect(BackupLinksService.startBackup('id')).rejects.toThrow(
        BackupLinksError,
      );
    });

    // *
    it('Should throw an error if the backup is already in progress(ACTIVE)', async () => {
      MockedBackupLinksModel.raw.id = { status: BackupLinkStatus.ACTIVE };

      await expect(BackupLinksService.startBackup('id')).rejects.toThrow(
        BackupLinksError,
      );
    });

    // *
    it('Should prepare the log file: empty the content and log the header and log the error if the local dir to backup is no longer accessible', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.PENDING,
        logsPath: 'my-path',
      };

      const spyEmptyFileContent = jest.fn();
      const spyAppendToFile = jest.fn();

      jest
        .spyOn(MockedLoggerService, 'appendToFile')
        .mockImplementation(spyAppendToFile);

      jest
        .spyOn(MockedUtilsService, 'emptyFileContent')
        .mockImplementation(spyEmptyFileContent);

      jest.spyOn(fs, 'accessSync').mockImplementation(() => {
        throw new Error();
      });

      await BackupLinksService.startBackup('id');

      expect(spyEmptyFileContent).toHaveBeenCalledTimes(1);
      expect(spyEmptyFileContent).toHaveBeenCalledWith('my-path');

      expect(spyAppendToFile).toHaveBeenCalledTimes(3);
      expect(spyAppendToFile).toHaveBeenNthCalledWith(
        1,
        'my-path',
        LOG_MARKERS.header,
      );
      expect(spyAppendToFile).toHaveBeenNthCalledWith(
        3,
        'my-path',
        LOG_MARKERS.footer,
      );
    });

    // *
    it('Should correctly compute the file key when no prefix is supplied and use the localDirPath as prefix', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.PENDING,
        logsPath: 'my-path',
        localDirPath: 'local-path',
      };

      // ? mock each function call
      jest.spyOn(fs, 'accessSync').mockImplementation(() => {});

      jest
        .spyOn(mockedDirUtils, 'listFolderContent')
        .mockReturnValue(Promise.resolve(['local-path/my-file.txt']));

      const spyLocalToS3 = jest.spyOn(MockedS3ManagerService, 'localToS3');

      await BackupLinksService.startBackup('id');

      //@ts-ignore
      expect(spyLocalToS3.mock.calls[0][0].fileKey).toBe(
        'local-path/my-file.txt',
      );
    });

    // *
    it('Should correctly compute the file key when a prefix is supplied', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.PENDING,
        logsPath: 'my-path',
        localDirPath: 'local-path',
        prefix: 'my-prefix',
      };

      // ? mock each function call
      jest.spyOn(fs, 'accessSync').mockImplementation(() => {});

      jest
        .spyOn(mockedDirUtils, 'listFolderContent')
        .mockReturnValue(Promise.resolve(['local-path/my-file.txt']));

      const spyLocalToS3 = jest.spyOn(MockedS3ManagerService, 'localToS3');

      await BackupLinksService.startBackup('id');

      //@ts-ignore
      expect(spyLocalToS3.mock.calls[0][0].fileKey).toBe(
        'my-prefix/my-file.txt',
      );
    });

    // *
    it('Should reset the backup link state in PEDING as update the lastBackupTimestamp once the backup is finished', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.PENDING,
        logsPath: 'my-path',
        localDirPath: 'local-path',
        prefix: 'my-prefix',
      };

      // ? mock each function call
      jest.spyOn(fs, 'accessSync').mockImplementation(() => {});

      jest
        .spyOn(mockedDirUtils, 'listFolderContent')
        .mockReturnValue(Promise.resolve(['local-path/my-file.txt']));

      const NOW: number = Date.now();
      jest.spyOn(Date, 'now').mockImplementation(() => NOW);

      await BackupLinksService.startBackup('id');

      expect(MockedBackupLinksModel.raw.id.status).toBe(
        BackupLinkStatus.PENDING,
      );
      expect(MockedBackupLinksModel.raw.id.lastBackupTimestamp).toBe(NOW);
    });

    // *
    it('Once the backup is completed, the correct messages should have been logged', async () => {
      const LOG_FILE_MOCK: string[] = [];
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.PENDING,
        logsPath: 'my-path',
        localDirPath: 'local-path',
        prefix: 'my-prefix',
      };

      jest
        .spyOn(MockedLoggerService, 'appendToFile')
        .mockImplementation((path: string, msg: string) => {
          LOG_FILE_MOCK.push(msg);
        });

      jest
        .spyOn(MockedLoggerService, 'overWriteFileAtPosition')
        .mockImplementation((path: string, msg: string, pos: number) => {
          LOG_FILE_MOCK.splice(pos, 1, msg);
        });

      jest.spyOn(fs, 'accessSync').mockImplementation(() => {});

      jest
        .spyOn(mockedDirUtils, 'getFolderSize')
        .mockReturnValue(Promise.resolve(100));

      jest
        .spyOn(mockedDirUtils, 'listFolderContent')
        .mockReturnValue(Promise.resolve(['local-path/my-file.txt']));

      jest
        .spyOn(MockedLoggerService, 'appendToFile')
        .mockImplementation((path: string, msg: string) => {
          LOG_FILE_MOCK.push(msg);
        });

      jest.spyOn(MockedUtilsService, 'bytesToSize').mockReturnValue('Bytes');

      jest
        .spyOn(MockedS3ManagerService, 'localToS3')
        .mockImplementation((_: any, cb: any) => {
          cb(100);
        });

      await BackupLinksService.startBackup('id');

      expect(LOG_FILE_MOCK[0]).toBe(LOG_MARKERS.header);

      // ? - 1 because the header is on two lines
      expect(LOG_FILE_MOCK[PROGRESS_LOG_LINE_POS - 1]).toBe(
        `100.00% - Bytes / Bytes`,
      );
      expect(
        LOG_FILE_MOCK[PROGRESS_LOG_LINE_POS].includes('/my-file.txt'),
      ).toBeTruthy();
      expect(LOG_FILE_MOCK[LOG_FILE_MOCK.length - 1]).toBe(LOG_MARKERS.footer);
    });
  });

  describe('getBackupLinkProgress()', () => {
    // *
    it('Should throw an error if the log file is not accessible anymore', async () => {
      MockedBackupLinksModel.raw.id = {
        logsPath: 'my-path',
      };

      jest.spyOn(fs, 'access').mockImplementation(() => {
        throw new Error();
      });

      await expect(
        BackupLinksService.getBackupLinkProgress('id'),
      ).rejects.toThrow(UserChange);
    });

    // *
    it('Should throw an error if the log file is not readable anymore', async () => {
      MockedBackupLinksModel.raw.id = {
        logsPath: 'my-path',
      };

      jest.spyOn(fs, 'access').mockImplementation(() => {});

      jest.spyOn(fs, 'readFile').mockImplementation(() => {
        throw new Error();
      });

      await expect(
        BackupLinksService.getBackupLinkProgress('id'),
      ).rejects.toThrow(UserChange);
    });

    // *
    it('Should correctly return the progress', async () => {
      MockedBackupLinksModel.raw.id = {
        logsPath: 'my-path',
      };

      jest.spyOn(fs, 'access').mockImplementation(() => {});

      jest.spyOn(fs, 'readFile').mockImplementation(
        () => `
        ================Backup Link started================================${os.EOL} 
-------------12/30/2020, 5:37:09 PM-------------${os.EOL} 
100.00% - 134.00 MB / 134.00 MB`,
      );

      const progress: number = await BackupLinksService.getBackupLinkProgress(
        'id',
      );

      expect(progress).toBe(100);
    });
  });
});
