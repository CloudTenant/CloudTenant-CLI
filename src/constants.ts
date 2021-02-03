// ? This constant is used for messages that appear in more than one place
export const USER_MESSAGES = {
  // ? used by global err filter
  unknownErr:
    'An unknown error occurred. Please submit an issue if this impacts you',

  // ? used when a startup script is generated
  unknownPlatform: 'We are sorry, but your operating system is not supported',
  failedToGenerateStartupCommand: 'The startup script could not be generated',
};

export const APP_CONSTANTS = {
  appDataFolderName: 'CloudTenantCLI', // ? folder to be created in %APPDATA%
  logsFolder: 'logs', // ? folder that will be created inside appDataFolderName
  appName: 'CloudTenantCLI', // ? application name that will be used in keytar to store credentials
  mainDbFileName: 'preferences',
  storagesDbFileName: 'storages',
  backupLinkDbFileName: 'backup-links',
};
