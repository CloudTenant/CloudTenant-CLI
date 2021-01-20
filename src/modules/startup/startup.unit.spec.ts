/**
 * * Mockes
 */

// * BackupLinksModel
const MockedBackupLinksModel: any = {
  raw: {},
};

jest.mock('@modules/backup-links/model/backup-links.model', () => {
  return {
    BackupLinksModel: MockedBackupLinksModel,
  };
});

// * BackupLinksService
const MockedBackupLinksService: any = {
  computeBackupLinkWaitTime: (backupLinkId: string): number => null,
};

jest.mock('@modules/backup-links/backup-links.service', () => {
  return {
    BackupLinksService: MockedBackupLinksService,
  };
});

/**
 * * Dependencies
 */
import * as child_process from 'child_process';

/**
 * * Test Requirments
 */
import { PlatformError } from '@common/errors';
import { AllowedPlatforms } from './@types/enum';
import { StartupService } from './startup.service';
import { BackupLinkStatus } from '../backup-links/@types';

describe('StartupService', () => {
  describe('generateStartupScript()', () => {
    it('Should throw an error if platform is not supported', () => {
      delete global.process.platform;

      expect(() => StartupService.generateStartupScript()).toThrow(
        PlatformError,
      );
    });

    it.each([AllowedPlatforms.win32])(
      '%s startup script can be generated',
      (n) => {
        global.process.platform = n;

        expect(StartupService.generateStartupScript()).toBeDefined();
      },
    );
  });

  describe('generateUnStartupScript()', () => {
    it('Should throw an error if platform is not supported', () => {
      delete global.process.platform;

      expect(() => StartupService.generateUnStartupScript()).toThrow(
        PlatformError,
      );
    });

    it.each([AllowedPlatforms.win32])(
      '%s startup script can be generated',
      (n) => {
        global.process.platform = n;

        expect(StartupService.generateUnStartupScript()).toBeDefined();
      },
    );
  });

  describe('startupLogic()', () => {
    let SPY_SPAWN: jest.SpyInstance;
    afterEach(() => {
      MockedBackupLinksModel.raw = {};
      StartupService.clearTestingHelper();

      jest.clearAllMocks();
      jest.clearAllTimers();
    });

    beforeEach(() => {
      jest.useFakeTimers();
    });

    beforeAll(() => {
      SPY_SPAWN = jest
        .spyOn(child_process, 'spawn')
        .mockImplementation(
          (command: string, args: string[], options: any): any => {
            return { pid: 1000 };
          },
        );
    });

    // *
    it('Should use the correct command to start the backup processes ', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.ACTIVE,
      };

      await StartupService.startupLogic();

      expect(SPY_SPAWN).toHaveBeenCalledTimes(1);
      expect(SPY_SPAWN.mock.calls[0][0]).toBe(
        'ctc backup-links start-one --force',
      );
      expect(SPY_SPAWN.mock.calls[0][1]).toEqual([`--id id`]);
    });

    // *
    it('Should start a backup process for the backups marked with the status ACTIVE(zombie) and schedule the backup links marked as PENDING', async () => {
      jest
        .spyOn(MockedBackupLinksService, 'computeBackupLinkWaitTime')
        .mockImplementation((id) => 2);

      MockedBackupLinksModel.raw = {
        id: {
          status: BackupLinkStatus.ACTIVE,
        },
        id1: {
          status: BackupLinkStatus.ACTIVE,
        },
        id2: {
          status: BackupLinkStatus.PENDING,
        },
        id3: {
          status: BackupLinkStatus.PENDING,
        },
      };

      await StartupService.startupLogic();

      expect(SPY_SPAWN).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(2);
    });

    // *
    it('Should not start multiple backup processes for the same backup link', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.ACTIVE,
      };

      await StartupService.startupLogic();
      await StartupService.startupLogic();
      await StartupService.startupLogic();
      await StartupService.startupLogic();

      expect(SPY_SPAWN).toHaveBeenCalledTimes(1);
    });

    // *
    it('Should not schedule multiple backup processes for the same backup link', async () => {
      MockedBackupLinksModel.raw.id = {
        status: BackupLinkStatus.PENDING,
      };

      await StartupService.startupLogic();
      await StartupService.startupLogic();
      await StartupService.startupLogic();
      await StartupService.startupLogic();

      expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    // *
    it('When the timer is executed should move the process from scheduled to ongoing map', async () => {
      MockedBackupLinksModel.raw.myId = {
        status: BackupLinkStatus.PENDING,
      };

      await StartupService.startupLogic();

      jest.runAllTimers();

      // ? manualy set it as ACTIve -> this will be set from the backup process itself
      MockedBackupLinksModel.raw.myId = {
        status: BackupLinkStatus.ACTIVE,
      };

      await StartupService.startupLogic();

      expect(setTimeout).toHaveBeenCalledTimes(1);

      expect(SPY_SPAWN).toHaveBeenCalledTimes(1);
    });

    // *
    it('When the timer is executed the process should be removed from scheduled map', async () => {
      MockedBackupLinksModel.raw.myId = {
        status: BackupLinkStatus.PENDING,
      };

      await StartupService.startupLogic();

      jest.runAllTimers();

      // ? keep it as PENDING

      await StartupService.startupLogic();

      expect(setTimeout).toHaveBeenCalledTimes(2);
    });
  });
});
