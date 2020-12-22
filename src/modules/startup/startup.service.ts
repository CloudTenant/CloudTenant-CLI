/**
 * * Dependencies
 */
import { join } from 'path';

/**
 * * Types
 */

import { AllowedPlatforms } from './@types/enum';

/**
 * * Errors
 */
import { PlatformError } from '@common/errors';

/**
 * * Constants
 */
import { USER_MESSAGES } from '@src/constants';
import { STARTUP_CONSTANTS } from './constants';

class Class {
  constructor() {}

  /**
   * * Private methods
   */

  // * generet startup script for windows
  #generateScriptForWin = (): string => {
    const startupFolderPath: string = join(
      process.env.APPDATA,
      `Microsoft/Windows/Start Menu/Programs/Startup`,
    );
    const destination: string = join(
      startupFolderPath,
      STARTUP_CONSTANTS.wOutScriptName,
    );

    const target: string = join(
      __dirname,
      '..',
      'scripts',
      STARTUP_CONSTANTS.wInScriptName,
    );

    const command: string = `copy "${target}" "${destination}"`;

    return command;
  };

  // * generate remove from startup script for windows
  #generateRemoveScriptForWin = (): string => {
    const target: string = join(
      process.env.APPDATA,
      `Microsoft/Windows/Start Menu/Programs/Startup`,
      STARTUP_CONSTANTS.wOutScriptName,
    );

    return `del "${target}"`;
  };

  /**
   * * Generate the script to be used by the user to enable startup behavior
   */
  generateStartupScript() {
    const isKnownPlatform: string | undefined =
      AllowedPlatforms[process.platform as AllowedPlatforms];

    if (!isKnownPlatform) {
      throw new PlatformError(USER_MESSAGES.unknownPlatform);
    }

    // ? create a dictonary for each platform
    const dic: any = {};
    dic[AllowedPlatforms.win32] = this.#generateScriptForWin;

    const scriptToRun: string = dic[isKnownPlatform].call(this);

    return scriptToRun;
  }

  /**
   * * Generate the script to be used by the user to disable startup behavior
   */
  generateUnStartupScript() {
    const isKnownPlatform: string | undefined =
      AllowedPlatforms[process.platform as AllowedPlatforms];

    if (!isKnownPlatform) {
      throw new PlatformError(USER_MESSAGES.unknownPlatform);
    }

    // ? create a dictonary for each platform
    const dic: any = {};
    dic[AllowedPlatforms.win32] = this.#generateRemoveScriptForWin;

    const scriptToRun: string = dic[isKnownPlatform].call(this);

    return scriptToRun;
  }
}

const StartupService = new Class();
Object.freeze(StartupService);

export { StartupService };
