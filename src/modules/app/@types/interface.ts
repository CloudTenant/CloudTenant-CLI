export interface App {
  appInit: boolean;
  startupProcess: {
    pid: number; // ? this is the possible PID of the startup process, no need to delete it once the process is killed, because if it remains here and it's not the correct one then it will do no harm;
  };
}
