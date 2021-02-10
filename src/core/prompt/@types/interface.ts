/**
 * * Operations
 */
export interface InputForBackupLink {
  localDirPath: string;
  bucket: string;
  jobFrequenceMs: number;
  prefix?: string;
  linkName: string;
}
