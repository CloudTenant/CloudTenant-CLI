import { BackupLinkStatus } from './enum';

export interface BackupLink {
  id: string; // ? unique
  storageId: string;
  localDirPath: string;
  bucket: string;
  jobFrequenceMs: number;
  prefix?: string; // ? s3 prefix (folder)
  linkName?: string; // ? unique

  lastBackupTimestamp: number; // ? default 0
  status: BackupLinkStatus; // ? default is PENDING
  logsPath: string;
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
