/**
 * * Operations
 */
export interface InputForBackupLink {
  localDirPath: string;
  bucket: string;
  jobFrequenceMs: string;
  prefix?: string;
  linkName: string;
}
