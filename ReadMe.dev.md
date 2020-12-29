# ReadMe for developers ( Project Documentation )

## Startup functionality

A startup script can be generated only for platforms marked in `AllowedPlatforms` enum.

### For windows

For windows it will copy the file `win-startup.bat` to `%APPDATA%/Microsoft/Windows/Start Menu/Programs/Startup`

## Testing

The prerequisites for testing the CLI are as follows:

1.  Create `.env.test` file and populate it with the credentials for the object storages against which you want to run the tests.

    For example, to see that the CLI tool can upload files to an S3 space (Digital Ocean for example) the following values are placed in the .env.test file:

        do_endpoint=
        do_secretAccessKey=
        do_accessKeyId=
        do_bucket=

    And the following array is declared in the test file that will validate the upload functionality

    ```ts
    const s3Providers: string = ['do'];
    ```

2.  Create a `test-placeholder` folder on the root level. This folder will be used as a placeholder to create some of the files that are part of the tests.
