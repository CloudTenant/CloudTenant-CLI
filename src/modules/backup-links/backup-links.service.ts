/**
 * * Dependencies
 */
import * as fs from 'fs';
import { promises as fsPromise } from 'fs';
import { DirUtils } from 'dir-fs-utils';
import * as path from 'path';
import * as upath from 'upath';
import * as os from 'os';
import { S3 } from 'aws-sdk';
import * as util from 'util';
const ms = require('ms');

/**
 * * Services
 */
import { UtilService } from '@src/common/util/util.service';
import { AppService } from '../app/app.service';
import { StoragesService } from '../storages/storages.service';
import { S3ManagerService } from '@src/core/s3-manager/s3-manager.service';

/**
 * * Model
 */
import { BackupLinksModel } from './model/backup-links.model';

/**
 * * Types
 */
import {
  AddBackupLinkParams,
  BackupLink,
  BackupLinkStatus,
  StartBackupCb,
} from './@types';
import { BackupLinksError, UserChange } from '@src/common/errors';
import { LoggerService } from '@src/core/logger/logger.service';
import {
  S3Credentials,
  TransportLocalToS3Params,
} from '@src/core/s3-manager/@types';

/**
 * * Constants
 */
import { LOG_MARKERS, PROGRESS_LOG_LINE_POS } from './constants';

class Class {
  /**
   * * Private methods
   */

  /**
   * * Remove the logs file of a given backup link
   * @param backupLinkId
   */
  #removeLogsFile = async (backupLinkId: string): Promise<boolean> => {
    try {
      await fsPromise.unlink(BackupLinksModel.raw[backupLinkId].logsPath);
      return true;
    } catch (err) {
      return false;
    }
  };

  /**
   * * Public methods
   */

  /**
   * * Add a new backup link in user.backupLinks property
   * @param payload *
   * @param existingLinkId * used to update an existing backup link
   */
  async addBackupLink(payload: AddBackupLinkParams): Promise<BackupLink> {
    const backupLinkId: string = UtilService.generateRandomId(
      Object.keys(BackupLinksModel.raw),
    );

    const backupLink: BackupLink = {
      ...payload,
      id: backupLinkId,
      lastBackupTimestamp: 0,
      status: BackupLinkStatus.PENDING,
      logsPath: path.join(
        AppService.logsFolderPath,
        `backup-link-${backupLinkId}.log`,
      ),
    };

    BackupLinksModel.raw[backupLinkId] = backupLink;
    await BackupLinksModel.save();

    return backupLink;
  }

  /**
   * * Delete a backup link
   * @param id - backup link id
   */
  async removeBackupLink(id: string): Promise<boolean> {
    await this.#removeLogsFile(id);

    delete BackupLinksModel.raw[id];

    await BackupLinksModel.save();
    return true;
  }

  /**
   * * Remove all backup links that are associated with a given storage
   * @param storageId
   */
  async removeBackupLinksFromStorage(storageId: string): Promise<boolean> {
    await Promise.all(
      Object.keys(BackupLinksModel.raw).map(async (linkId: string) => {
        if (BackupLinksModel.raw[linkId].storageId === storageId) {
          await this.#removeLogsFile(linkId);
          delete BackupLinksModel.raw[linkId];
        }
      }),
    );

    await BackupLinksModel.save();
    return true;
  }

  /**
   * * listBackupLinksByNames()
   * ? Return an array with all the names of the available backup links
   */
  listBackupLinksByNames(): string[] {
    const output: string[] = [];

    Object.keys(BackupLinksModel.raw).forEach((id: string) => {
      output.push(BackupLinksModel.raw[id].linkName);
    });

    return output;
  }

  /**
   * * backupLinksNameToIdMap() 
   * ? return the associated id for a backup link name
   @param name - unique backup link id name
   */
  backupLinksNameToIdMap(searchName: string): string | undefined {
    let output: string;
    for (let i = 0; i < Object.keys(BackupLinksModel.raw).length; i++) {
      const id: string = Object.keys(BackupLinksModel.raw)[i];
      if (BackupLinksModel.raw[id].linkName === searchName) {
        output = id;
        break;
      }
    }

    return output;
  }

  /**
   * * startBackup()
   * ? will start a backup
   * @param backupLinkId
   * @param force - if force is true -> then start the backup process event though it's marked as active
   * @param cb - when the user will start the backup manually, because on windows the process can't be silency detached from the main process the backup will happen in the same process and the progress will be printed in the console
   */
  async startBackup(backupLinkId: string, force?: boolean, cb?: StartBackupCb) {
    const backupLink: BackupLink = BackupLinksModel.raw[backupLinkId];

    // ? Check if the backup can start
    if (!backupLink) {
      throw new BackupLinksError('There is no backup link with this id');
    }

    if (backupLink.status === BackupLinkStatus.ACTIVE && !force) {
      throw new BackupLinksError(
        'This backup link is already in progress. Use --force if you are sure you know what you do.',
      );
    }

    await UtilService.emptyFileContent(backupLink.logsPath);

    await LoggerService.appendToFile(backupLink.logsPath, LOG_MARKERS.header);

    // ? Validate that the backup link path still exists and is accessibe
    try {
      fs.accessSync(backupLink.localDirPath);
    } catch (err) {
      await LoggerService.appendToFile(
        backupLink.logsPath,
        `Your folder ${backupLink.localDirPath} is not accessible anymore`,
      );
      await LoggerService.appendToFile(backupLink.logsPath, LOG_MARKERS.footer);
      return;
    }

    // ? Calculate the entire size of local path
    const totalBytesSize: number = await DirUtils.getFolderSize(
      backupLink.localDirPath,
    );

    let uploadedBytesSize: number = 0;

    // ? Return an array with all the files from the folder
    const files: string[] = await DirUtils.listFolderContent(
      backupLink.localDirPath,
    );

    // ? Get the s3 client for this storage
    const s3Credentials: S3Credentials = await StoragesService.getS3Credentials(
      backupLink.storageId,
    );
    const s3: S3 = S3ManagerService.buildS3Client(s3Credentials);

    // ? Mark the backpu link as in progress
    BackupLinksModel.raw[backupLinkId].status = BackupLinkStatus.ACTIVE;
    BackupLinksModel.raw[backupLinkId].processPID = process.pid;
    await BackupLinksModel.save();

    for (let i = 0; i < files.length; i++) {
      // ? file key is prefix + (computed as files[i] - backupLink.localDirPath)
      // ? where prefix is backupLink.prefix or last folder path from backupLink.localDirPath

      const objectKey: string = upath.toUnix(
        files[i].replace(backupLink.localDirPath, ''),
      );
      const objectPrefix: string = backupLink.prefix
        ? upath.toUnix(backupLink.prefix)
        : upath.toUnix(backupLink.localDirPath).split('/').pop();

      const payload: TransportLocalToS3Params = {
        s3,
        filePath: files[i],
        bucket: backupLink.bucket,
        fileKey: `${objectPrefix}${objectKey}`,
      };

      try {
        await S3ManagerService.localToS3(
          payload,
          async (progressBytes: number) => {
            uploadedBytesSize += progressBytes;
            const percentage: number =
              (uploadedBytesSize * 100) / totalBytesSize;

            const progressMsg: string = `${percentage.toFixed(
              2,
            )}% - ${UtilService.bytesToSize(
              uploadedBytesSize,
            )} / ${UtilService.bytesToSize(totalBytesSize)}`;

            await LoggerService.overWriteFileAtPosition(
              backupLink.logsPath,
              progressMsg,
              PROGRESS_LOG_LINE_POS,
            );

            if (cb) {
              cb(progressMsg);
            }
          },
        );

        await LoggerService.appendToFile(
          backupLink.logsPath,
          `✔ File ${objectKey} was uploaded successfuly`,
        );
      } catch (err) {
        await LoggerService.appendToFile(
          backupLink.logsPath,
          `✖ Failed to upload ${objectKey}`,
        );
      }
    }

    await LoggerService.appendToFile(backupLink.logsPath, LOG_MARKERS.footer);

    // ? update status
    BackupLinksModel.raw[backupLinkId].status = BackupLinkStatus.PENDING;
    delete BackupLinksModel.raw[backupLinkId].processPID;
    BackupLinksModel.raw[backupLinkId].lastBackupTimestamp = Date.now();

    await BackupLinksModel.save();
  }

  /**
   * * Return the progress as an integer from the log file
   * @param backupLinkId
   */
  async getBackupLinkProgress(backupLinkId: string): Promise<number> {
    const logsPath: string = BackupLinksModel.raw[backupLinkId].logsPath;
    try {
      const access = util.promisify(fs.access);
      await access(logsPath);
      const readFile = util.promisify(fs.readFile);

      const data: string = await readFile(logsPath, 'utf-8');
      const lines: string[] = data.split(os.EOL);

      const progressText: string = lines[PROGRESS_LOG_LINE_POS];

      const progress: number = parseInt(
        progressText.slice(0, progressText.indexOf('%')).trim(),
      );
      return progress;
    } catch (err) {
      throw new UserChange(`Log file ${logsPath} is not accessible anymore`);
    }
  }

  /**
   * * Based on your backup settings, calculate how long the program should wait (in ms) until it can restart the backup
   * @param backupLinkId
   */
  computeBackupLinkWaitTime(backupLinkId: string): number {
    const backupLink: BackupLink = BackupLinksModel.raw[backupLinkId];

    const msUntilTheJob: number =
      backupLink.lastBackupTimestamp +
      ms(backupLink.jobFrequenceMs) -
      Date.now();

    return msUntilTheJob > 0 ? msUntilTheJob : 0;
  }
}

const BackupLinksService = new Class();
Object.freeze(BackupLinksService);

export { BackupLinksService };
