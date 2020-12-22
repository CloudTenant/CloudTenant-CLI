/**
 * * Dependencies
 */
import * as inquirer from 'inquirer';

/**
 * * Services
 */
import { StoragesService } from '@src/modules/storages/storages.service';

/**
 * * Types
 */
import { InputForBackupLink } from './@types/interface';
import { AddNewStorageParams } from '@src/modules/storages/@types';

/**
 * * Constants
 */
import { JOB_FREQUENCE_OPTIONS } from './constants';
import { BackupLinksService } from '@src/modules/backup-links/backup-links.service';

class Class {
  /**
   * * Private methods
   * @param params
   */

  /**
   * * Public methods
   */

  /**
   * * Get the value for a list of params
   * @param params *
   */
  async confirmAction(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const question: inquirer.QuestionCollection = {
        type: 'confirm',
        name: 'confirm',
        message,
        default: false,
      };

      inquirer.prompt(question).then(({ confirm }) => {
        resolve(confirm);
      });
    });
  }

  /**
   * * getInputForS3()
   * ? Get the input for an S3
   */
  async getInputForS3(): Promise<AddNewStorageParams> {
    return new Promise((resolve) => {
      const question: inquirer.QuestionCollection = [
        {
          type: 'input',
          name: 'storageName',
          message: 'With what name you want to save this storage',
          validate: function (value) {
            if (!value.trim().length) {
              return 'Please enter a name';
            }

            // ? check if storageName is unique
            if (StoragesService.listStoragesByNames().includes(value)) {
              return 'You already have a storage with this name. Please use something else';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'endpoint',
          message: 'The endpoint of your S3',
          validate: function (value) {
            return value.trim().length > 0 || 'Please enter the endpoint';
          },
        },
        {
          type: 'input',
          name: 'accessKeyId',
          message: 'The access key of your S3',
          validate: function (value) {
            return value.trim().length > 0 || 'Please enter the key';
          },
        },
        {
          type: 'password',
          name: 'secretAccessKey',
          message: 'The secret access key',
          mask: '*',
          validate: function (value) {
            return value.trim().length > 0 || 'Please enter the secret key';
          },
        },
      ];

      inquirer.prompt(question).then((payload: AddNewStorageParams) => {
        resolve(payload);
      });
    });
  }

  /**
   * * getInputForBackupLink()
   * ? Get the input for a backup link
   */
  async getInputForBackupLink(buckets: string[]): Promise<InputForBackupLink> {
    return new Promise((resolve) => {
      const question: inquirer.QuestionCollection = [
        {
          type: 'list',
          name: 'bucket',
          message: 'Choose what bucket you want to link',
          choices: buckets,
        },
        {
          type: 'input',
          name: 'localDirPath',
          message: 'Path to local folder that you want to backup',
          validate: function (value) {
            return value.trim().length > 0 || 'Please enter the endpoint';
          },
        },
        {
          type: 'input',
          name: 'linkName',
          message:
            'What name you want to give to this backup link? This is useful to easily identify backup links',
          validate: function (value) {
            if (!value.trim().length) {
              return 'Please enter a name';
            }

            // ? check if linkName is unique
            if (BackupLinksService.listBackupLinksByNames().includes(value)) {
              return 'You already have a backup link with this name. Please use something else';
            }
            return true;
          },
        },
        {
          type: 'list',
          name: 'jobFrequenceMs',
          message: 'Choose the frequence of the backup',
          choices: JOB_FREQUENCE_OPTIONS,
        },
        {
          type: 'input',
          name: 'prefix',
          default: '',
          message:
            '[OPTIONAL] Prefix under which you want to save this backup. By default, it will use the same folder name as your local folder.',
        },
      ];

      inquirer.prompt(question).then((payload: InputForBackupLink) => {
        resolve(payload);
      });
    });
  }

  /**
   * * chooseStorageByName()
   * ? select an option from a list of strings
   * @param message - msg to show
   * @param list - list of strings to chooce from
   */
  async chooseFromList(message: string, list: string[]): Promise<string> {
    return new Promise((resolve) => {
      const question: inquirer.QuestionCollection = {
        type: 'list',
        name: 'selected',
        message,
        choices: list,
      };

      inquirer.prompt(question).then(({ selected }: { selected: string }) => {
        resolve(selected);
      });
    });
  }
}

const Prompt = new Class();
Object.freeze(Prompt);

export { Prompt };
