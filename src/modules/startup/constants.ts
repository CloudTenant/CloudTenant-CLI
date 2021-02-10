/**
 * * Name of the scripts that will be copied in the startup folder, to create a startup behavior
 */
export const STARTUP_CONSTANTS = {
  wInScriptName: 'win-startup.bat', // ? name of the original file
  wOutScriptName: 'cloud-tentant-cli.startup.vbs', // ? name of the file when it will be saved in the startup folder
};

/**
 * * In a windows OS scenario, generate the content of the VBS file that will be placed in the startup folder
 */
export const generateContentForVbsFile = (startupScriptPath: string): string =>
  `Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run chr(34) & "${startupScriptPath}" & Chr(34), 0
Set WshShell = Nothing`;
