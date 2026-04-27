@echo off
title Projnet Database Restore
echo ========================================
echo Projnet Database Restore Tool (Windows)
echo ========================================
echo.
echo This will RESTORE data from a backup file.
echo WARNING: All existing data in projnet will be REPLACED!
echo.

if not exist "projnet_data.zip" (
    echo ERROR: projnet_data.zip not found!
    echo Run backup_data.bat first to create a backup.
    pause
    exit /b
)

:: Get ZIP password
set /p ZIP_PWD="Enter the ZIP password: "

:: Get MySQL password
set /p MYSQL_PWD="Enter MySQL password (or press Enter if none): "

echo.
echo Restoring data...

:: Find MySQL installation path
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin
if exist "%MYSQL_PATH%\mysql.exe" goto found
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin
if exist "%MYSQL_PATH%\mysql.exe" goto found
set MYSQL_PATH=C:\xampp\mysql\bin
if exist "%MYSQL_PATH%\mysql.exe" goto found
echo MySQL not found. Please install MySQL.
pause
exit /b

:found

:: Try to unzip using PowerShell first
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::Open('projnet_data.zip', 'Read'); $entry = $zip.Entries[0]; [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, 'projnet_restore.sql', $true); $zip.Dispose()" 2>nul

if not exist "projnet_restore.sql" (
    echo Failed to extract. Trying alternative method...
    "%MYSQL_PATH%\..\..\..\7z.exe" x -p%ZIP_PWD% projnet_data.zip > nul 2>&1
)

if not exist "projnet_data_dump.sql" (
    echo ERROR: Could not extract the zip file. Wrong password?
    pause
    exit /b
)

:: Restore the data
"%MYSQL_PATH%\mysql" -u root -p%MYSQL_PWD% projnet < projnet_data_dump.sql

if errorlevel 1 (
    echo.
    echo Restore FAILED! Check your MySQL password.
    del projnet_data_dump.sql 2>nul
    pause
    exit /b
)

:: Clean up
del projnet_data_dump.sql

echo.
echo ========================================
echo Restore complete! Your data has been restored.
echo ========================================
echo.
pause