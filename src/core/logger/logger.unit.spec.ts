/**
 * * Dependencies
 */
import * as fs from 'fs';
import * as os from 'os';

/**
 * * Test Target
 */
import { GeneralStatusTypes } from '../../@types/enum';
import { DescriptiveList } from './@types';
import { ANSI_COLORS } from './constants';
import { LoggerService } from './logger.service';

describe('LoggerService - Unit Testing', () => {
  /**
   * * descriptiveLists() function
   */
  describe('descriptiveLists()', () => {
    const MOCKED_STDOUT_VALUE: string[] = [];
    beforeAll(() => {
      //@ts-ignore
      jest.spyOn(process.stdout, 'write').mockImplementation((str: string) => {
        MOCKED_STDOUT_VALUE.push(str);
      });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    const lists: DescriptiveList[] = [
      {
        head: 'This is a head',
        rows: [
          {
            label: 'This is the first row(error)',
            status: GeneralStatusTypes.ERROR,
          },
          {
            label: 'This is the second row(warn)',
            status: GeneralStatusTypes.WARN,
          },
          {
            label: 'This is the thirds row(success)',
            status: GeneralStatusTypes.SUCCESS,
          },
        ],
      },
    ];
    it('It should output the correct message with the correct colors and symbols', () => {
      LoggerService.descriptiveLists(lists);

      const head: string = MOCKED_STDOUT_VALUE[0];
      const errRow: string = MOCKED_STDOUT_VALUE[1];
      const warnRow: string = MOCKED_STDOUT_VALUE[2];
      const successRow: string = MOCKED_STDOUT_VALUE[3];

      // * head
      expect(head.toLowerCase().indexOf(`\x1b[${ANSI_COLORS.cyan}m`) != -1);

      // * errRow
      expect(
        errRow.indexOf('✖') !== -1 || errRow.indexOf('×') !== -1,
      ).toBeTruthy();

      expect(errRow.toLowerCase().indexOf(`\x1b[${ANSI_COLORS.red}m`) != -1);

      // * warnRow
      expect(
        warnRow.indexOf('⚠') !== -1 || warnRow.indexOf('‼') !== -1,
      ).toBeTruthy();

      expect(
        warnRow.toLowerCase().indexOf(`\x1b[${ANSI_COLORS.yellow}m`) != -1,
      ).toBeTruthy();

      // * successRow
      expect(
        successRow.indexOf('✔') !== -1 || successRow.indexOf('√') !== -1,
      ).toBeTruthy();

      expect(
        successRow.toLowerCase().indexOf(`\x1b[${ANSI_COLORS.green}m`) != -1,
      ).toBeTruthy();
    });
  });

  /**
   * * appendToFile() function
   */
  describe('appendToFile()', () => {
    const MOCKED_FS_WRITE_VALUE: string[] = [];

    afterEach(() => {
      jest.clearAllMocks();
    });

    beforeAll(() => {
      jest.spyOn(fs, 'open').mockImplementation((path, mode, cb) => {
        cb(undefined, undefined);
      });

      jest
        .spyOn(fs, 'write')
        //@ts-ignore
        .mockImplementationOnce((fd, text, position, encoding, cb) => {
          MOCKED_FS_WRITE_VALUE.push(text);
          cb(undefined, undefined, undefined);
        });

      jest.spyOn(fs, 'close').mockImplementation((fd, cb) => {
        cb(undefined);
      });
    });

    it('It should append a new row to the end of a file', async () => {
      const msgToAppend: string = 'This line will be appended';

      await LoggerService.appendToFile('', msgToAppend);

      // ? EOL to simply \n
      expect(
        MOCKED_FS_WRITE_VALUE[0].replace(/\r\n/g, '\n').indexOf('\n') !== -1,
      ).toBeTruthy;
    });
  });

  /**
   * * overWriteFileAtPosition() function
   */
  describe('overWriteFileAtPosition()', () => {
    const MOCKED_FS_INITIAL_VALUE: string = `First Line${os.EOL}Second Line`;

    const NEW_LINE_TO_USE = 'New Line';
    const EXPECTED_OUTPUT: string = `First Line${os.EOL}${NEW_LINE_TO_USE}`;

    let MOCKED_FS_WRITTEN_VALUE: string;

    afterEach(() => {
      jest.clearAllMocks();
      MOCKED_FS_WRITTEN_VALUE = undefined;
    });

    beforeAll(() => {
      //@ts-ignore
      jest.spyOn(fs, 'readFile').mockImplementation((path, mode, cb) => {
        cb(undefined, MOCKED_FS_INITIAL_VALUE);
      });

      jest
        .spyOn(fs, 'writeFile')
        .mockImplementationOnce((path, text: any, cb) => {
          MOCKED_FS_WRITTEN_VALUE = text;
          cb(undefined);
        });
    });

    it('It should correctly overwrite a line from a file', async () => {
      await LoggerService.overWriteFileAtPosition('path', NEW_LINE_TO_USE, 1);
      expect(MOCKED_FS_WRITTEN_VALUE).toBe(EXPECTED_OUTPUT);
    });
  });
});
