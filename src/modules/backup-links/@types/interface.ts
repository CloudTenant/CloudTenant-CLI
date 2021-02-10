import { BackupLinkStatus } from './enum';

export interface BackupLink {
  id: string; // ? unique
  storageId: string;
  localDirPath: string;
  bucket: string;
  jobFrequenceMs: number;
  prefix?: string; // ? s3 prefix (folder)
  linkName?: string; // ? unique

  // ? internally handled
  lastBackupTimestamp: number; // ? default 0
  status: BackupLinkStatus; // ? default is PENDING
  logsPath: string;
  processPID?: number; // ? this one will have no effect by default, bcs the porcess can't be silence started in the background, therefore the backup will take place in the same main process; however if this property is present and then it disapears it means that the backup link should stop (in case is in progress)
}

export interface Links {
  [id: string]: BackupLink;
}

/**
 * * Operations
 */
export interface AddBackupLinkParams {
  storageId: string;
  localDirPath: string;
  bucket: string;
  jobFrequenceMs: number;
  prefix?: string;
  linkName: string;
}
