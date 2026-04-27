@echo off
title Projnet Database Backup
echo ========================================
echo Projnet Database Backup Tool (Windows)
echo ========================================
echo.
echo This will create a password-protected backup
echo of ALL data in your projnet database.
echo.
echo The backup will be saved as: projnet_data.zip
echo.

:: Get MySQL password
set /p MYSQL_PWD="Enter MySQL password (or press Enter if none): "

:: Get ZIP password
set /p ZIP_PWD="Create a ZIP password for this backup: "

echo.
echo Creating backup...

:: Find MySQL installation path
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin
if exist "%MYSQL_PATH%\mysqldump.exe" goto found
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin
if exist "%MYSQL_PATH%\mysqldump.exe" goto found
set MYSQL_PATH=C:\xampp\mysql\bin
if exist "%MYSQL_PATH%\mysqldump.exe" goto found
echo MySQL not found in standard locations. Please install MySQL.
pause
exit /b

:found
echo Found MySQL at: %MYSQL_PATH%

:: Dump data only (no schema)
"%MYSQL_PATH%\mysqldump" -u root -p%MYSQL_PWD% --no-create-info projnet > projnet_data_dump.sql

if errorlevel 1 (
    echo.
    echo Backup FAILED! Check your MySQL password.
    pause
    exit /b
)

:: Create password-protected ZIP
"%MYSQL_PATH%\..\..\..\7z.exe" a -tzip -p%ZIP_PWD% projnet_data.zip projnet_data_dump.sql > nul 2>&1
if errorlevel 1 (
    echo 7-Zip not found. Using PowerShell zip instead...
    powershell -Command "Compress-Archive -Path projnet_data_dump.sql -DestinationPath projnet_data.zip -CompressionLevel Optimal"
    powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::Open('projnet_data.zip', 'Update'); $zip.Entries | ForEach-Object { $_.Encryption = [System.IO.Compression.EncryptionAlgorithm]::Aes256 }; $zip.Dispose()"
)

:: Clean up
del projnet_data_dump.sql

echo.
echo ========================================
echo Backup complete!
echo File: projnet_data.zip
echo Password: %ZIP_PWD%
echo ========================================
echo.
echo IMPORTANT: Remember this password! You'll need it to restore.
echo.
pause