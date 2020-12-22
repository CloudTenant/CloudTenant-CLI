/**
 * * Constnts
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
}

const LoggerService = new Class();
Object.freeze(LoggerService);
export { LoggerService };
