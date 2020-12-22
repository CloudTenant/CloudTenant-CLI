<div style="text-align:center">
    <img src='https://github.com/GeorgianStan/CloudTenant-CLI/raw/0.x/static/logo.png' alt='logo'>
</div>

**CTC** (Cloud Tenat CLI) is a backup tool that you can use to save your local files in **S3** cloud storages.

# Commands

### Install the module

`$ npm i -g cloud-tenant-cli`

### Commands

- `$ ctc` or `$ ctc --help`

- `$ ctc init` - initialize the CLI tool (**This command must be run first, in order to use the CLI tool**)

- `$ ctc remove-data` - delete all the data created by the CLI tool

- `$ ctc startup` - generate a script to be runned in order for the application to run it's required logic at startup

  - `$ ctc startup remove` - generate a script to be runned in order to remove the startup behavior

- `$ ctc storages` - list all the storages
  - `$ ctc storages add` - add a new storage
