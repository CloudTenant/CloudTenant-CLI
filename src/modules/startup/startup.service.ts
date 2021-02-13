/**
 * * Dependencies
 */
import { join } from 'path';
import * as child_process from 'child_process';
import * as tree_kill from 'tree-kill';
import { writeFileSync } from 'fs';
const find = require('find-process');

/**
 * * Types
 */
import { AllowedPlatforms } from './@types/enum';
import { BackupLink, BackupLinkStatus, Links } from '../backup-links/@types';

/**
 * * Errors
 */
import { PlatformError } from '@common/errors';

/**
 * * Constants
 */
import { USER_MESSAGES } from '@src/constants';
import { STARTUP_CONSTANTS, generateContentForVbsFile } from './constants';

/**
 * * Model
 */
import { BackupLinksModel } from '../backup-links/model/backup-links.model';
import { BackupLinksService } from '../backup-links/backup-links.service';
import { AppModel } from '../app/model/app.model';

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

  /**
   * * Private methods
   */

  /**
   * * For Windows, the startup script can't be moved directly in the startup folder, because it will open a shell once execuded
   * ? To overcome this problem, a .vbs file is generated and this file will be moved to the startup folder. The purpose of this vbs file is simply to call the Windows startup script
   * @param startupScriptPath - path the windows startup script to be executed
   */
  #generateScriptForWin = (): string => {
    const scriptsFolderPath: string = join(__dirname, '..', 'scripts');

    // ? generate the vbs file
    const vbsFileName = 'launch_bat.vbs';

    const vbsFileContent = generateContentForVbsFile(
      join(scriptsFolderPath, STARTUP_CONSTANTS.wInScriptName),
    );
    const vbsFilePath: string = join(scriptsFolderPath, vbsFileName);

    writeFileSync(vbsFilePath, vbsFileContent);

    // ? move the vbs file in the startup folder
    const destinationPath: string = join(
      process.env.APPDATA,
      `Microsoft/Windows/Start Menu/Programs/Startup`,
      STARTUP_CONSTANTS.wOutScriptName,
    );

    // ? generate the command that the user will need to run to move the script to the startup folder

    const command = `copy "${vbsFilePath}" "${destinationPath}" && "${destinationPath}"`;
    return command;
  };

  // *
  #generateRemoveScriptForWin = async (): Promise<string> => {
    const target: string = join(
      process.env.APPDATA,
      `Microsoft/Windows/Start Menu/Programs/Startup`,
      STARTUP_CONSTANTS.wOutScriptName,
    );

    // ? check if the PID saved is still valid (matches to startup process pattern)
    const startupProcessPid: number = AppModel.raw.startupProcess.pid;
    const pidValid: boolean = await this.validatePid(startupProcessPid);

    if (pidValid) {
      return `del "${target}" && TASKKILL /PID ${startupProcessPid} /F`;
    } else {
      return `del "${target}"`;
    }
  };

  // * Schedule a backup to be executed for a given backpulink based on it's id
  #scheduleBackup = (backupLinkId: string): any => {
    const msUntilTheJob: number = BackupLinksService.computeBackupLinkWaitTime(
      backupLinkId,
    );

    // ? execute the job
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      const child: child_process.ChildProcessWithoutNullStreams = child_process.spawn(
        `ctc backup-links start-one --force`,
        [`--id ${backupLinkId}`],
        {
          shell: true,
        },
      );

      this.#ongoingProcesses.set(backupLinkId, child);
      this.#scheduledProcesses.delete(backupLinkId);
    }, msUntilTheJob);

    this.#scheduledProcesses.set(backupLinkId, timeoutId);
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
   * * Validate if a given PID is the PID of the startup process that's currently running
   * @param pid
   */
  async validatePid(pid: number): Promise<boolean> {
    try {
      const list: any[] = await find('pid', pid);

      if (!list.length) {
        return false;
      }

      return list[0].cmd.includes('startup do-logic');
    } catch {
      return false;
    }
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

    try {
      const scriptToRun: string = dic[isKnownPlatform].call(this);
      return scriptToRun;
    } catch (err) {
      throw new PlatformError(USER_MESSAGES.failedToGenerateStartupCommand);
    }
  }

  /**
   * * Generate the script to be used by the user to disable startup behavior
   */
  async generateUnStartupScript() {
    const isKnownPlatform: string | undefined =
      AllowedPlatforms[process.platform as AllowedPlatforms];

    if (!isKnownPlatform) {
      throw new PlatformError(USER_MESSAGES.unknownPlatform);
    }

    // ? create a dictonary for each platform
    const dic: any = {};
    dic[AllowedPlatforms.win32] = this.#generateRemoveScriptForWin;

    const scriptToRun: string = await dic[isKnownPlatform].call(this);

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
    });

    // ? schedule the other backup links
    const idsOfPendingBackups: string[] = Object.keys(
      BackupLinksModel.raw,
    ).filter(
      (id: string) =>
        BackupLinksModel.raw[id].status === BackupLinkStatus.PENDING &&
        !this.#scheduledProcesses.has(id),
    );

    idsOfPendingBackups.forEach((id: string) => {
      this.#scheduleBackup(id);
    });
  }

  /**
   * * Triggered each time the BackupLinksModel.dbFilePath gets updated
   */
  async handleBackupLinksDbUpdate() {
    // ? make a copy of the curret values
    const modelTmp: Links = Object.assign({}, BackupLinksModel.raw);

    await BackupLinksModel.update();

    // ? create an unique array with all the ids (both after the update and before)
    const allIds: string[] = Array.from(
      new Set([...Object.keys(modelTmp), ...Object.keys(BackupLinksModel.raw)]),
    );

    // ? loop trough each backup link and check what was changed
    allIds.forEach((id: string) => {
      const previousValue: BackupLink = modelTmp[id];
      const updatedValue: BackupLink = BackupLinksModel.raw[id];

      // ? check if a backup link was added
      if (!previousValue && updatedValue) {
        this.#scheduleBackup(id);
        return;
      }

      // ? check if the backup link was removed entirely
      if (previousValue && !updatedValue) {
        if (previousValue.processPID) {
          this.#ongoingProcesses.delete(id);
          tree_kill(previousValue.processPID);
        } else {
          clearTimeout(this.#scheduledProcesses.get(id));
          this.#scheduledProcesses.delete(id);
        }

        return;
      }

      // ? check if previous was ACTIVE and now is not
      if (previousValue.processPID && !updatedValue.processPID) {
        this.#ongoingProcesses.delete(id);

        // ? reschedule the process
        this.#scheduleBackup(id);
      }
    });
  }
}

const StartupService = new Class();
Object.freeze(StartupService);

export { StartupService };
