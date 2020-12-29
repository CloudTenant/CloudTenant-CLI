/**
 * * Test Requirments
 */
import { PlatformError } from '@common/errors';
import { AllowedPlatforms } from './@types/enum';
import { StartupService } from './startup.service';

describe('StartupService', () => {
  describe('generateStartupScript()', () => {
    it('Should throw an error if platform is not supported', () => {
      delete global.process.platform;

      expect(() => StartupService.generateStartupScript()).toThrow(
        PlatformError,
      );
    });

    it.each([AllowedPlatforms.win32])(
      '%s startup script can be generated',
      (n) => {
        global.process.platform = n;

        expect(StartupService.generateStartupScript()).toBeDefined();
      },
    );
  });

  describe('generateUnStartupScript()', () => {
    it('Should throw an error if platform is not supported', () => {
      delete global.process.platform;

      expect(() => StartupService.generateUnStartupScript()).toThrow(
        PlatformError,
      );
    });

    it.each([AllowedPlatforms.win32])(
      '%s startup script can be generated',
      (n) => {
        global.process.platform = n;

        expect(StartupService.generateUnStartupScript()).toBeDefined();
      },
    );
  });
});
