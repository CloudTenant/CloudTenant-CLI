/**
 * * Dependencies
 */
import { accessSync } from 'fs';
import { DirUtils } from 'dir-fs-utils';
import { join } from 'path';
import * as upath from 'upath';

/**
 * * Services
 */
import { UtilService } from '@src/common/util/util.service';
import { AppService } from '../app/app.service';

/**
 * * Model
 */
import { BackupLinksModel } from './model/backup-links.model';

/**
 * * Types
 */
import { AddBackupLinkParams, BackupLink, BackupLinkStatus } from './@types';
import { BackupLinksError } from '@src/common/errors';
import { LoggerService } from '@src/core/logger/logger.service';

/**
 * * Constants
 */
import { LOG_MARKERS } from './constants';
import { FileTransporterService } from '../file-transporter/file-transporter.service';
import { StoragesService } from '../storages/storages.service';
import { S3 } from 'aws-sdk';
import { S3Credentials } from '@src/core/s3-manager/@types';
import { S3ManagerService } from '@src/core/s3-manager/s3-manager.service';
import { TransportLocalToS3Params } from '../file-transporter/@types';

class Class {
  /**
   * * Add a new backup link in user.backupLinks property
   * @param payload *
   * @param existingLinkId * used to update an existing backup link
   */
  public async addBackupLink(
    payload: AddBackupLinkParams,
  ): Promise<BackupLink> {
    const backupLinkId: string = UtilService.generateRandomId(
      Object.keys(BackupLinksModel.raw),
    );

    const backupLink: BackupLink = {
      ...payload,
      id: backupLinkId,
      lastBackupTimestamp: 0,
      status: BackupLinkStatus.PENDING,
      logsPath: join(
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
    delete BackupLinksModel.raw[id];
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
   */
  async startBackup(backupLinkId: string) {
    /**
     * ? 0. Check if the backup can start
     * ? 1. Validate that the backup link path still exists and is accessibe
     * ? 2. Calculate the entire size of local path
     * ? 3. Return an array with all the files from the folder
     */
    const backupLink: BackupLink = BackupLinksModel.raw[backupLinkId];

    // ? 0
    if (!backupLink) {
      throw new BackupLinksError('There is no backup link with this id');
    }

    if (backupLink.status === BackupLinkStatus.ACTIVE) {
      throw new BackupLinksError('This backup link is already in progress');
    }

    await UtilService.emptyFileContent(backupLink.logsPath);

    await LoggerService.appendToFile(backupLink.logsPath, LOG_MARKERS.header);

    // ? 1
    try {
      accessSync(backupLink.localDirPath);
    } catch (err) {
      await LoggerService.appendToFile(
        backupLink.logsPath,
        `Your folder ${backupLink.localDirPath} is not accessible anymore`,
      );
      await LoggerService.appendToFile(backupLink.logsPath, LOG_MARKERS.footer);
      return;
    }

    // ? 2
    const totalBytesSize: number = await DirUtils.getFolderSize(
      backupLink.localDirPath,
    );

    let uploadedBytesSize: number = 0;

    // ? 3
    const files: string[] = await DirUtils.listFolderContent(
      backupLink.localDirPath,
    );

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
        await FileTransporterService.localToS3(
          payload,
          async (progressBytes: number) => {
            uploadedBytesSize += progressBytes;
            const percentage: number =
              (uploadedBytesSize * 100) / totalBytesSize;

            // await LoggerService.overWriteFileAtPosition(
            //   backupLink.logsPath,
            //   `${percentage.toFixed(2)}% - ${UtilService.bytesToSize(
            //     uploadedBytesSize,
            //   )} / ${UtilService.bytesToSize(totalBytesSize)}`,
            //   1,
            // );
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
}

const BackupLinksService = new Class();
Object.freeze(BackupLinksService);

export { BackupLinksService };
