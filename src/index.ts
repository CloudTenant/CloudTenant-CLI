/**
 * * Dependencies
 */
import { program } from 'commander';
import * as ora from 'ora';
import { S3 } from 'aws-sdk';
import { accessSync, watchFile } from 'fs';
import * as compareVersions from 'compare-versions';

/**
 * * Services
 */
import { AppService } from '@modules/app/app.service';
import { LoggerService } from '@core/logger/logger.service';
import { StartupService } from '@modules/startup/startup.service';
import { StoragesService } from './modules/storages/storages.service';
import { BackupLinksService } from './modules/backup-links/backup-links.service';
import { S3ManagerService } from './core/s3-manager/s3-manager.service';

/**
 * * Errors
 */
import { CustomError, PlatformError } from '@common/errors';
import { Prompt } from '@core/prompt/prompt';

/**
 * * Constants
 */
import { APP_CONSTANTS, USER_MESSAGES } from './constants';

/**
 * * Types
 */
import { AddNewStorageParams, StorageStatus } from './modules/storages/@types';
import { GeneralStatusTypes } from './@types/enum';
import { DescriptiveList } from './core/logger/@types';
import { AddBackupLinkParams } from './modules/backup-links/@types';
import { InputForBackupLink } from './core/prompt/@types/interface';
import { S3Credentials } from './core/s3-manager/@types';
import { BackupLinksModel } from './modules/backup-links/model/backup-links.model';

/**
 * * Global errors filters
 */
process.on('uncaughtException', (error: Error | CustomError) => {
  // ? if is a custom error show the msg
  if ((<CustomError>error).isCustom) {
    LoggerService.error(error.message);
    return;
  }

  LoggerService.error(USER_MESSAGES.unknownErr);
});

process.on('unhandledRejection', function (error: Error | CustomError) {
  // ? if reason is from Error object and is custom
  if ((<CustomError>error).isCustom) {
    LoggerService.error(error.message);
    return;
  }

  LoggerService.error(USER_MESSAGES.unknownErr);
});

/**
 * * Prevent app from running if any of this conditions are met
 */
if (
  (process.platform === 'win32' && !process.env.APPDATA) ||
  (process.platform !== 'win32' && !process.env.HOME)
) {
  throw new PlatformError(USER_MESSAGES.failedToInitialize);
}

if (compareVersions(process.version, APP_CONSTANTS.minNodeJSVersion) === -1) {
  throw new PlatformError(
    `${USER_MESSAGES.nodeVersionNotSupported} Minimum version is ${APP_CONSTANTS.minNodeJSVersion}. You are currently running on ${process.version}.`,
  );
}

// ? injected by webpack at build time
declare const __VERSION__: any;

const APP_WAS_INITIALIZED = AppService.checkIfAppWasInitialiezd();

/**
 * * Commands
 */
program.version(__VERSION__);

/**
 * * Init & Remove command
 */
program
  .command('init', {
    hidden: APP_WAS_INITIALIZED,
  })
  .description('initialize CloudTenant CLI tool')
  .action(async () => {
    const initSuccessfully: boolean = await AppService.initApp();
    if (initSuccessfully) {
      LoggerService.success('Application was initialized successfuly');
    }
  });

program
  .command('remove-data', {
    hidden: !APP_WAS_INITIALIZED,
  })
  .description('remove all the data created by the Cloud Tenant CLI tool')
  .action(async () => {
    const confirm: boolean = await Prompt.confirmAction(
      'Are you sure you want to delete all data and stop all processes?',
    );

    if (!confirm) {
      return;
    }

    const removedSuccessfully: boolean = await AppService.removeAppData();

    if (removedSuccessfully) {
      LoggerService.success('All data was removed');
      LoggerService.warn(
        '\nIf you had the startup script running, please also run the startup remove command',
      );
    }
  });

/**
 * * Startup Command
 */

// * 1. Generetate starup script
const startup = program
  .command('startup', {
    hidden: !APP_WAS_INITIALIZED,
  })
  .description('generate a startup script')
  .action(() => {
    if (!BackupLinksService.listBackupLinksByNames().length) {
      LoggerService.warn(
        "You have no backup links at this time. The startup script won't take effect right now, only when you start adding the first backup link.\n",
      );
    }

    const script: string = StartupService.generateStartupScript();

    LoggerService.log([
      'Please run the following command, preferably as an administrator\n',
      script,
    ]);
  });

// * 2. Unspartup
startup
  .command('remove', { hidden: !APP_WAS_INITIALIZED })
  .description('remove the startup script')
  .action(() => {
    const script: string = StartupService.generateUnStartupScript();

    LoggerService.log([
      'Please run the following command, preferably as an administrator\n',
      script,
    ]);
  });

// * 3. Do the startup logic
// ? this will be executed by the startup script
startup.command('do-logic', { hidden: true }).action(async () => {
  if (!APP_WAS_INITIALIZED) {
    return;
  }

  watchFile(BackupLinksModel.dbFilePath, async () => {
    await StartupService.handleBackupLinksDbUpdate();
  });

  await StartupService.startupLogic();
});

/**
 * * S3 Storage commands
 */

// * 1. List storages
const storageCommand = program
  .command('storages', { hidden: !APP_WAS_INITIALIZED })
  .description('list all your s3 storages')
  .option('-s, --status', 'list all storages and their related status')
  .action(async (opts) => {
    const storages: string[] = StoragesService.listStoragesByNames();

    if (!storages.length) {
      LoggerService.warn('You have no storages for now. Please add one');
      return;
    }

    // ? list with status or simply list
    if (Object.keys(opts).includes('status')) {
      const status: StorageStatus[] = await StoragesService.getStoragesStatus();
      const list: DescriptiveList[] = [];

      status.forEach((status: StorageStatus) => {
        list.push({
          head: status.storageName,
          rows: [
            {
              status: status.credentialsAreOk
                ? GeneralStatusTypes.SUCCESS
                : GeneralStatusTypes.ERROR,
              label: status.credentialsAreOk
                ? 'S3 credentials are present and accessible.'
                : 'S3 credentials are missing or they are not accessible.',
            },
            {
              status: status.isOnline
                ? GeneralStatusTypes.SUCCESS
                : GeneralStatusTypes.ERROR,
              label: status.isOnline
                ? 'S3 storage is online and accessible.'
                : 'S3 storage is not accessible. Check internet connection and endpoint status or review your credentials.',
            },
          ],
        });
      });

      LoggerService.descriptiveLists(list);
      return;
    }

    LoggerService.log(storages);
  });

// * 2. Add Storage
storageCommand
  .command('add', { hidden: !APP_WAS_INITIALIZED })
  .description('add a new S3 type storage space')
  .action(async () => {
    if (!APP_WAS_INITIALIZED) {
      LoggerService.warn('You need to initialize the application first');
      return;
    }

    const confirm: boolean = await Prompt.confirmAction(
      "You will be prompted to add your S3 credentials. These credentials will be stored in your system's keychain. Do you want to proceed?",
    );

    if (!confirm) {
      return;
    }

    const payload: AddNewStorageParams = await Prompt.getInputForS3();

    let spinner: ora.Ora;
    try {
      // ? validate credentials
      spinner = ora('Validating credentials...').start();
      await StoragesService.addS3Storage(payload);
      spinner.succeed();
      LoggerService.success(
        'Your credentials are valid and your storage was saved!',
      );
    } catch (err) {
      spinner.fail();
      LoggerService.error(
        "S3 storage couldn't be accessed. Please review your credentials or your internet connection!",
      );
    }
  });

// * 3. Remove storage
storageCommand
  .command('remove', {
    hidden: !(
      APP_WAS_INITIALIZED && StoragesService.listStoragesByNames().length
    ),
  })
  .description('remove a storage')
  .action(async () => {
    const storages: string[] = StoragesService.listStoragesByNames();

    if (!storages.length) {
      LoggerService.warn('Your storages list is empty.');
      return;
    }

    const selectedStorageName = await Prompt.chooseFromList(
      'Choose storage',
      storages,
    );
    const storageId: string = StoragesService.storageNameToIdMap(
      selectedStorageName,
    );

    const confirm: boolean = await Prompt.confirmAction(
      'Are you sure you want to delete this storage? Please note that all processes that are linked with it will be terminated!',
    );

    if (!confirm) {
      return;
    }

    await StoragesService.removeStorage(storageId);
  });

/**
 * * Backup links
 */

// * 1. List backup links
const backupLinkCommand = program
  .command('backup-links', {
    hidden: !(
      APP_WAS_INITIALIZED && StoragesService.listStoragesByNames().length
    ),
  })
  .description('list all your backup links')
  .action(() => {
    const backupLinks: string[] = BackupLinksService.listBackupLinksByNames();

    if (!backupLinks.length) {
      LoggerService.warn('You have no backup links for now. Please add one');
      return;
    }

    LoggerService.log(backupLinks);
  });

// * 2. Add backup link
backupLinkCommand
  .command('add', {
    hidden: !(
      APP_WAS_INITIALIZED && StoragesService.listStoragesByNames().length
    ),
  })
  .description('add a new backup link')
  .action(async () => {
    const storages: string[] = StoragesService.listStoragesByNames();

    if (!storages.length) {
      LoggerService.warn(
        'You have no storages for which to create a backup link. Please add one first',
      );
      return;
    }

    const storageName: string = await Prompt.chooseFromList(
      'Choose what storage you want to link.',
      storages,
    );

    const storageId: string = StoragesService.storageNameToIdMap(storageName);

    const storageCredentials: S3Credentials = (await StoragesService.getS3Credentials(
      storageId,
    )) as S3Credentials;

    const buckets: string[] = (
      await S3ManagerService.listBuckets(storageCredentials)
    ).Buckets.map((bucket: S3.Bucket) => bucket.Name);

    if (!buckets.length) {
      LoggerService.warn('You have no bucket in this storage');
    }

    const backupLinkInput: InputForBackupLink = await Prompt.getInputForBackupLink(
      buckets,
    );

    // ? check if this path exists
    try {
      accessSync(backupLinkInput.localDirPath);
    } catch (err) {
      LoggerService.error(
        `The path that you supplied either doesn't exists or is not accessible for CloudTenantCLI. Your supplied path was ${backupLinkInput.localDirPath}. Please review it!`,
      );
      return;
    }

    const addBackupLinkPayload: AddBackupLinkParams = {
      storageId,
      bucket: backupLinkInput.bucket,
      localDirPath: backupLinkInput.localDirPath,
      jobFrequenceMs: backupLinkInput.jobFrequenceMs,
      linkName: backupLinkInput.linkName,
    };

    if (backupLinkInput.prefix) {
      addBackupLinkPayload.prefix = backupLinkInput.prefix;
    }

    await BackupLinksService.addBackupLink(addBackupLinkPayload);
    LoggerService.success('The backup link was added successfully');
  });

// * 3. Remove a backup link
backupLinkCommand
  .command('remove', {
    hidden: !(
      APP_WAS_INITIALIZED && BackupLinksService.listBackupLinksByNames().length
    ),
  })
  .description('remove a backup link')
  .action(async () => {
    const backupLinks: string[] = BackupLinksService.listBackupLinksByNames();

    if (!backupLinks.length) {
      LoggerService.warn('Your backup links list is empty.');
      return;
    }

    const selectedName = await Prompt.chooseFromList(
      'Choose backup link',
      backupLinks,
    );

    const confirm: boolean = await Prompt.confirmAction(
      'Are you sure you want to delete this backup link? Please note that all active processes that are linked with it will be terminated!',
    );

    if (!confirm) {
      return;
    }

    const backupLinkId: string = BackupLinksService.backupLinksNameToIdMap(
      selectedName,
    );

    BackupLinksService.removeBackupLink(backupLinkId);
  });

// * 4 HIDDEN method to start the job for a backup link
// ? this command will be executed by the processes that will be created
backupLinkCommand
  .command('start-one', { hidden: true })
  .option('--id <id>')
  .option('--force')
  .action(async (opts) => {
    if (!APP_WAS_INITIALIZED) {
      return;
    }

    const backupLinks: string[] = BackupLinksService.listBackupLinksByNames();

    if (!backupLinks.length) {
      LoggerService.warn('Your backup links list is empty.');
      return;
    }

    await BackupLinksService.startBackup(opts.id, opts.force);
  });

// * 5 Public method to manually execute a backup
backupLinkCommand
  .command('start', {
    hidden: !(
      APP_WAS_INITIALIZED && BackupLinksService.listBackupLinksByNames().length
    ),
  })
  .description('start a given backup link')
  .option(
    '--force',
    'Start a given backup link even though he is marked as in progress.',
  )
  .action(async (opts) => {
    const backupLinks: string[] = BackupLinksService.listBackupLinksByNames();

    if (!backupLinks.length) {
      LoggerService.warn('Your backup links list is empty.');
      return;
    }

    const name: string = await Prompt.chooseFromList(
      'Choose what backup link you want to execute',
      BackupLinksService.listBackupLinksByNames(),
    );

    const backupLinkId: string = BackupLinksService.backupLinksNameToIdMap(
      name,
    );

    await BackupLinksService.startBackup(
      backupLinkId,
      opts.force,
      (progress: string) => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${progress}\r`);
      },
    );

    // ? spawning a sperate process is not an option due to the fact that on windows it will fail to detach it with no shell
    // ? https://github.com/sindresorhus/execa/issues/433
    // ? https://github.com/nodejs/node/issues/21825

    // const child: child_process.ChildProcessWithoutNullStreams = child_process.spawn(
    //   `ctc backup-links start-one`,
    //   [` --id ${backupLinkId}`],

    //   {
    //     detached: true,
    //     // shell: true,
    //   },
    // );
    // child.unref();
  });

// ? init
program.parse(process.argv);
