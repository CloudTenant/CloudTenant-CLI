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
};

jest.mock('@src/common/util/util.service', () => {
  return {
    UtilService: MockedUtilsService,
  };
});

/**
 * * Dependencies
 */
import { join } from 'path';

/**
 * * Types
 */
import { BackupLinkStatus } from './@types';

/**
 * * Test Target
 */
import { BackupLinksService } from './backup-links.service';

describe('BackupLinksService - Unit Tests', () => {
  afterEach(() => {
    MockedBackupLinksModel.raw = {};
    jest.resetAllMocks();
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
});
