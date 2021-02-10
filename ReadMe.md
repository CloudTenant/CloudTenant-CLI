<div style="text-align:center">
    <img src='https://github.com/CloudTenant/CloudTenant-CLI/raw/master/static/logo.png' alt='logo'>
</div>

<div style='text-align:center'>
    <img src='https://img.shields.io/github/issues/CloudTenant/CloudTenant-CLI' alt='issues'>
    <img src='https://img.shields.io/github/forks/CloudTenant/CloudTenant-CLI' alt='forks'>
    <img src='https://img.shields.io/github/stars/CloudTenant/CloudTenant-CLI' alt='stars'>
    <img src='https://img.shields.io/github/license/CloudTenant/CloudTenant-CLI' alt='license'>
    <img src='https://img.shields.io/github/package-json/v/CloudTenant/CloudTenant-CLI?color=%237146f9&logo=javascript' alt='version'>
    <a href="https://david-dm.org/CloudTenant/CloudTenant-CLI" title="dependencies status"><img src="https://status.david-dm.org/gh/CloudTenant/CloudTenant-CLI.svg"/></a>
</div>

**CTC** (Cloud Tenat CLI) is a backup tool that you can use to save your local files in **S3** cloud storages. It works by creating backup links to a specific local path and S3 storage.

# Table-of-Contents

- [Usage workflow](#usage-workflow)
- [Commands](#commands)
- [Examples](#examples)
- [Current consideration](#current-consideration)
- [System Requirements](#System-Requirements)

# Usage Workflow

A complete workflow of using this tool can be resumed in the following steps.

1. Install the the CLI application

   `npm i -g cloud-tenant-cli`

2. Initialize the application -- [read more](#why-ctc-init)

   `ctc init`

3. Add your first storage

   `ctc storages add`

4. Create your first backup-link

   `ctc backup-links add`

5. (optional) Start the backup link now

   `ctc backup-links start`

6. Startup script

   For backup links to run automatically at the specified interval, CTC can generate a script that can be run to start a process of managing links automatically including at the host restart.

   `ctc startup`

# Commands

At any time the following command can be used to get more information about each `ctc help` command.

Here is the list with all the available commands:

- `ctc init` - initialize the applicaiton
- `ctc remove-data` - remove all the data that was created by the application (excluding the startup script)
- `ctc startup` - generate a script to be runned in order for the application to run it's required logic at startup

  - `ctc startup remove` - generate a script to be runned in order to remove the startup behavior

- `ctc storages` - list all storages

  - `ctc storages --status` - list the storages and their related status
  - `ctc storages add` - add a new S3 storage
  - `ctc storages remove` - remove a storage

- `ctc backup-links` - list all the backup-links

  - `ctc backup-links add` - add a new backup link
  - `ctc backup-links remove` - remove a backup link
  - `ctc backup-links start` - manually start a backup link

## Hidden commands

Some of the commands will be visible or hidden based on the current status of the application. For example, most of the commands will be hidden until the `etc init` command is executed.

However, there are some commands that will always be hidden and used by the program itself. You can use this commands only if you know what you are doing.

- `ctc backup-links start-one --id <id>` - start a given backup-link after it's id

  - `ctc backup-links start-one --id <id> --force` - using **--force**, option it will start the backup link even though he is marked as active

- `ctc startup do-logc` - this command is used by the startup script to automate the process [read more](#manually-adding-the-startup-behavior)

# Examples

Here are some examples to help you get the most out of this tool.

## Classic scenario

The classic scenarion would look like it follows.
You have a few files on your computer that you want to backup, you may want to access them remotely, or you just want to make sure they are safe in case something happens.

At the same time, you have S3 storage that you can use.

The files can be located in multiple folders or they can be all in the same folder. For this example, we'll say that they are in `D` drive in the folder `documents`.

The first step would be to run commands from 1-4 of from [usage workflow](#usage-workflow) section.

For the `ctc backup-links add` command you will need to provide some answers to various questions.

One of them would be the path to the local folder. In our example this would be `D:\documents`.

Because these documents don't change too often I will choose as the frequency for this to the backup job the option `each day`. This option will trigger the backup job no earlier than one day away from the last backup.

At this point, the files will be backed-up on the selected S3 storage under the selected bucket with the prefix made of the local folder name, in our case `documents`.

If you want to save them under a different prefix, you can overwrite it by providing another value in response to the last question.

One possible value would be `pc/drive-d/documents`. This would make all the files from the `documents` folder to be saved with the prefix `pc/drive-d/documents/`.

This option can be useful to better group or place files so they can be easier to manage.

Lastly to have this process executed `each day` you need to generate the startup script (step number 6 from [usage workflow](#usage-workflow) section)

## Specific scenario

In the current version, CTC allows the creation of backup links that will be run at a predefined frequency, which will copy all files from a local path in a supplied S3 storage.

A more specific scenario would be when you have a script that generates backups for databases, for example, and you want to save these backups in a cloud storage.

In this situation, you do not need to have the startup script enabled. You still need to select a random frequency for the backup link, but it won't have any impact without the startup script, so you can choose anything.

Once the backup link was added with the correct path to your database backups folder, you can update your script that generates this backup and add the hidden command `ctc backup-links start-one --id <id> --force`

_The `id` of the backup link can be acquired by inspecting the files created by CTC in the APPDATA folder_

# Current consideration

## Why ctc init

Cloud Tenant CLI must interact with your system to save the necessary information and function properly.
For this reason, but also because it is software with MIT open source license, the application aims to be as transparent as possible with the end-users.

`ctc init` the command will create a new folder in `APPDATA` folder that will be later used

## Memory usage

You can add as many backup links as you want, as long as you have enough RAM for them.

Each active backup link will increase the load of the application with maximum **20MB**.

Therefore if you have **10** backup links that all run simultaneously, this can increase the RAM usage by **200MB**.

The default memory limit of the NodeJS process has not been changed, so the number of backup links that you add and will run **simultaneously** must not exceed **~20**.

## Manually adding the startup behavior

Currently, the startup script can only be generated automatically for the `Windows` platform.

Support will be added for various operating systems in the near future. However, this does not mean that you cannot have startup behavior and automated processes on a platform other than Windows. Just that you need to do it yourself.

The startup process will only run the command `ctc startup do-logic`. Therefore all you need to do is to create a script that will run this command on startup.

## Contributing

Pull requests and stars are always welcome. Please check the [guidelines](https://github.com/CloudTenant/CloudTenant-CLI/blob/master/CONTRIBUTING.md).

This project is open-source, and your help is more than welcome.

At the same time, if you have suggestions or want to see a feature added, use the following [topic](https://github.com/CloudTenant/CloudTenant-CLI/discussions/categories/ideas-suggestions).

This project is open-source, and your help is more than welcome.

At the same time, if you have suggestions or want to see a feature added, use the following [topic](https://github.com/CloudTenant/CloudTenant-CLI/discussions/categories/ideas-suggestions).

# System-Requirements

In the current stage, you need to have NodeJS version **14.14.0** or higher.

## Linux specific

`libsecret` and `gnome keyring` must be installed.

## Other mentions

If you find that this app doesn't work for your environment or specific configuration, then open a discussion in the next
[category](https://github.com/CloudTenant/CloudTenant-CLI/discussions/categories/environment-specific-issues).
