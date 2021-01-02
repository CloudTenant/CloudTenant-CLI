import * as os from 'os';

export const LOG_MARKERS = {
  header: `================Backup Link started================================${
    os.EOL
  }-------------${new Date().toLocaleString()}-------------${os.EOL}`,
  footer: `${os.EOL}================================Backup Link finished================================`,
};

export const PROGRESS_LOG_LINE_POS = 2;
