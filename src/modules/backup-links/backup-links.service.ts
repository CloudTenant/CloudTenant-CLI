/**
 * * Dependencies
 */
import { accessSync } from 'fs';
import { DirUtils } from 'dir-fs-utils';

/**
 * * Services
 */
import { UtilService } from '@src/common/util/util.service';

/**
 * * Model
 */
import { BackupLinksModel } from './model/backup-links.model';

/**
 * * Types
 */
import { AddBackupLinkParams, BackupLink, BackupLinkStatus } from './@types';
import { BackupLinksError, UserChange } from '@src/common/errors';
import { AppService } from '../app/app.service';
import { join } from 'path';

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
    if (backupLink.status === BackupLinkStatus.ACTIVE) {
      throw new BackupLinksError('This backup link is already in progress');
    }

    // ? 1
    try {
      accessSync(backupLink.localDirPath);
    } catch (err) {
      throw new UserChange(
        `Your folder ${backupLink.localDirPath} is not accessible anymore`,
      );
    }

    // ? 2
    const bytesSize: number = await DirUtils.getFolderSize(
      backupLink.localDirPath,
    );

    // ? 3
    const files: string[] = await DirUtils.listFolderContent(
      backupLink.localDirPath,
    );

    console.log(files);
  }
}

const BackupLinksService = new Class();
Object.freeze(BackupLinksService);

export { BackupLinksService };
