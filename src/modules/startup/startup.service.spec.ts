/**
 * * Test Requirments
 */
import { PlatformError } from '@common/errors';
import { AllowedPlatforms } from './@types/enum';
import { StartupService } from './startup.service';

describe('OSLayer', () => {
  it('Should throw an error if platform is not supported', () => {
    delete global.process.platform;

    expect(() => StartupService.generateStartupScript()).toThrow(PlatformError);
  });

  it.each([AllowedPlatforms.win32])('%s startup script generated', (n) => {
    global.process.platform = n;

    expect(StartupService.generateStartupScript()).toBeTruthy();
  });
});
