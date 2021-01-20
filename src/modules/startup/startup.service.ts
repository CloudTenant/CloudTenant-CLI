/**
 * * Dependencies
 */
import { join } from 'path';
import * as child_process from 'child_process';
import * as tree_kill from 'tree-kill';

/**
 * * Types
 */
import { AllowedPlatforms } from './@types/enum';
import { BackupLinkStatus } from '../backup-links/@types';

/**
 * * Errors
 */
import { PlatformError } from '@common/errors';

/**
 * * Constants
 */
import { USER_MESSAGES } from '@src/constants';
import { STARTUP_CONSTANTS } from './constants';

/**
 * * Model
 */
import { BackupLinksModel } from '../backup-links/model/backup-links.model';
import { BackupLinksService } from '../backup-links/backup-links.service';

class Class {
  /**
   * * Private variables
   */

  // ? used to save the processes spawned
  #ongoingProcesses: Map<
    string,
    child_process.ChildProcessWithoutNullStreams
  > = new Map();

  // ? used to save the processes that will be spawned after a given timeout
  #scheduledProcesses: Map<string, NodeJS.Timeout> = new Map();

  constructor() {}

  /**
   * * Private methods
   */

  // *
  #generateScriptForWin = (): string => {
    const startupFolderPath: string = join(
      process.env.APPDATA,
      `Microsoft/Windows/Start Menu/Programs/Startup`,
    );
    const destination: string = join(
      startupFolderPath,
      STARTUP_CONSTANTS.wOutScriptName,
    );

    const target: string = join(
      __dirname,
      '..',
      'scripts',
      STARTUP_CONSTANTS.wInScriptName,
    );

    const command: string = `copy "${target}" "${destination}"`;

    return command;
  };

  // *
  #generateRemoveScriptForWin = (): string => {
    const target: string = join(
      process.env.APPDATA,
      `Microsoft/Windows/Start Menu/Programs/Startup`,
      STARTUP_CONSTANTS.wOutScriptName,
    );

    return `del "${target}"`;
  };

  /**
   * * Public method
   */

  /**
   * * Helper function to be used for testing purposes
   * ? it will clear the maps
   */
  clearTestingHelper() {
    this.#ongoingProcesses.clear();
    this.#scheduledProcesses.clear();
  }

  /**
   * * Generate the script to be used by the user to enable startup behavior
   */
  generateStartupScript() {
    const isKnownPlatform: string | undefined =
      AllowedPlatforms[process.platform as AllowedPlatforms];

    if (!isKnownPlatform) {
      throw new PlatformError(USER_MESSAGES.unknownPlatform);
    }

    // ? create a dictonary for each platform
    const dic: any = {};
    dic[AllowedPlatforms.win32] = this.#generateScriptForWin;

    const scriptToRun: string = dic[isKnownPlatform].call(this);

    return scriptToRun;
  }

  /**
   * * Generate the script to be used by the user to disable startup behavior
   */
  generateUnStartupScript() {
    const isKnownPlatform: string | undefined =
      AllowedPlatforms[process.platform as AllowedPlatforms];

    if (!isKnownPlatform) {
      throw new PlatformError(USER_MESSAGES.unknownPlatform);
    }

    // ? create a dictonary for each platform
    const dic: any = {};
    dic[AllowedPlatforms.win32] = this.#generateRemoveScriptForWin;

    const scriptToRun: string = dic[isKnownPlatform].call(this);

    return scriptToRun;
  }

  /**
   * * Do the startup logic
   * ? this function will be called by the process that will run at startup
   * ? At first, this feature should go through all the backup links and see if there are any ongoing links that don't have a correspondent on the ShceduledPorcesses map; this handles if the process is stopped before the backup is complete
   */
  async startupLogic() {
    // ? restart all the backup links that were not finished
    const idsOfUnfinishedBackups: string[] = Object.keys(
      BackupLinksModel.raw,
    ).filter(
      (id: string) =>
        BackupLinksModel.raw[id].status === BackupLinkStatus.ACTIVE &&
        !this.#ongoingProcesses.has(id),
    );

    idsOfUnfinishedBackups.forEach((id: string) => {
      const child: child_process.ChildProcessWithoutNullStreams = child_process.spawn(
        `ctc backup-links start-one --force`,
        [`--id ${id}`],
        {
          shell: true,
        },
      );

      this.#ongoingProcesses.set(id, child);
      // console.log('will stop', tree_kill(child.pid));
    });

    // ? schedule the other backup links
    const idsOfPendingBackups: string[] = Object.keys(
      BackupLinksModel.raw,
    ).filter(
      (id: string) =>
        BackupLinksModel.raw[id].status === BackupLinkStatus.PENDING &&
        !this.#scheduledProcesses.has(id),
    );

    idsOfPendingBackups.forEach((id: string, i) => {
      const msUntilTheJob: number = BackupLinksService.computeBackupLinkWaitTime(
        id,
      );

      // ? execute the job
      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        const child: child_process.ChildProcessWithoutNullStreams = child_process.spawn(
          `ctc backup-links start-one --force`,
          [`--id ${id}`],
          {
            shell: true,
          },
        );

        this.#ongoingProcesses.set(id, child);
        this.#scheduledProcesses.delete(id);
      }, msUntilTheJob);

      this.#scheduledProcesses.set(id, timeoutId);
    });
  }
}

const StartupService = new Class();
Object.freeze(StartupService);

export { StartupService };
