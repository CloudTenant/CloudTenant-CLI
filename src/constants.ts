/**
 * * Dependencies
 */
import { join } from 'path';

// ? This constant is used for messages that appear in more than one place
export const USER_MESSAGES = {
  // ? used by global err filter
  unknownErr:
    'An unknown error occurred. Please submit an issue if this impacts you',
  failedToInitialize:
    'The application could not initialize because the HOME path is missing. If you encounter this problem, please report it',
  nodeVersionNotSupported: 'This NodeJS version is not supported.',

  // ? used when a startup script is generated
  unknownPlatform: 'We are sorry, but your operating system is not supported',
  failedToGenerateStartupCommand: 'The startup script could not be generated',
};

export const APP_CONSTANTS = {
  minNodeJSVersion: '14.14.0',

  appDataFolderPath:
    process.platform === 'win32'
      ? join(process.env.APPDATA, 'CloudTenantCLI')
      : join(process.env.HOME, '.CloudTenantCLI'),

  logsFolder: 'logs', // ? folder that will be created inside appDataFolderPath
  appName: 'CloudTenantCLI', // ? application name that will be used in keytar to store credentials
  mainDbFileName: 'preferences',
  storagesDbFileName: 'storages',
  backupLinkDbFileName: 'backup-links',
};
