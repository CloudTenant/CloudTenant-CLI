/**
 * * Dependencies
 */
import * as fs from 'fs';
import * as os from 'os';

/**
 * * Constants
 */
import { ANSI_COLORS } from './constants';

/**
 * * Types
 */
import { DescriptiveList, DescriptiveListRow } from './@types';
import { GeneralStatusTypes } from '@src/@types/enum';

class Class {
  constructor() {}

  /**
   * * Private methods
   */

  /**
   * *ansiColor - return text with color
   * @param text - text to interpolate
   * @param color - desired color from ANSI_COLORS const
   */
  #ansiColor = (text: string, color: string) => {
    return `\x1b[${ANSI_COLORS[color]}m${text}\x1b[0m`;
  };

  /**
   * *getPadding() - return padding
   * @param num - length of the padding
   */
  #getPadding = (num: number) => {
    let text = '';

    for (let i = 1; i <= num; i++) {
      text += ' ';
    }
    return text;
  };

  #getIcon = (status: GeneralStatusTypes): string => {
    const isSupported =
      process.platform !== 'win32' || process.env.TERM !== undefined;

    const icons: any = {};
    icons[GeneralStatusTypes.ERROR] = isSupported ? '✖' : '×';
    icons[GeneralStatusTypes.WARN] = isSupported ? '⚠' : '‼';
    icons[GeneralStatusTypes.SUCCESS] = isSupported ? '✔' : '√';

    return icons[status];
  };

  /**
   * * Public methods
   */
  error(msg: string) {
    process.stderr.write(this.#ansiColor(msg, 'red'));
  }

  warn(msg: string) {
    process.stderr.write(this.#ansiColor(msg, 'yellow'));
  }

  success(msg: string) {
    process.stderr.write(this.#ansiColor(msg, 'green'));
  }

  log(msg: string | string[]) {
    if (Array.isArray(msg)) {
      msg.forEach((_) => process.stdout.write(`${_}\n`));
      return;
    }

    process.stdout.write(`${msg}\n`);
  }

  /**
   * * descriptiveList() - show a descriptive list
   * @param lists - descriptive list
   */
  descriptiveLists(lists: DescriptiveList[]) {
    lists.forEach((eachList: DescriptiveList, index: number) => {
      if (index > 0) {
        process.stdout.write(`\n`);
      }
      process.stdout.write(
        `${this.#ansiColor(`${String(index)}. ${eachList.head}`, 'cyan')}`,
      );
      eachList.rows.forEach((row: DescriptiveListRow) => {
        const padding: string = this.#getPadding(3);

        switch (row.status) {
          case GeneralStatusTypes.ERROR: {
            const text = this.#ansiColor(
              `${this.#getIcon(row.status)} ${row.label}`,
              'red',
            );
            process.stdout.write(`\n${padding}${text}`);
            break;
          }

          case GeneralStatusTypes.WARN: {
            const text = this.#ansiColor(
              `${this.#getIcon(row.status)} ${row.label}`,
              'yellow',
            );

            process.stdout.write(`\n${padding}${text}`);
            break;
          }
          case GeneralStatusTypes.SUCCESS: {
            const text = this.#ansiColor(
              `${this.#getIcon(row.status)} ${row.label}`,
              'green',
            );

            process.stdout.write(`\n${padding}${text}`);
            break;
          }
        }
      });
    });
  }

  /**
   * * Log message to file path
   * ? only resolve with true or false -> the program should not be impacted if the log failed or not
   * @param path - file path wehere to log
   * @param text - text to show
   */
  appendToFile(path: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.open(path, 'a', (err: NodeJS.ErrnoException | null, fd: number) => {
        if (err) {
          return resolve(false);
        }
        fs.write(
          fd,
          text + os.EOL,
          null,
          'utf-8',
          (err: NodeJS.ErrnoException | null) => {
            if (err) {
              return resolve(false);
            }
            fs.close(fd, (err: NodeJS.ErrnoException | null) => {
              if (err) {
                return resolve(false);
              }
              return resolve(true);
            });
          },
        );
      });
    });
  }

  /**
   * * Overwrite a file text at a certain position
   * @param path
   * @param text
   * @param pos
   */
  overWriteFileAtPosition(
    path: string,
    text: string,
    pos: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      fs.readFile(path, 'utf-8', (err: NodeJS.ErrnoException, data: string) => {
        if (err) {
          return resolve(false);
        }
        const lines: string[] = data.split(os.EOL);
        lines[pos] = text;

        console.log(lines.join(os.EOL));
        fs.writeFile(path, lines.join(os.EOL), (err: NodeJS.ErrnoException) => {
          if (err) {
            resolve(false);
          }

          return resolve(true);
        });
      });
    });
  }
}

const LoggerService = new Class();
Object.freeze(LoggerService);
export { LoggerService };
