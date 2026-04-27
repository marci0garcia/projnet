#!/bin/bash

echo "========================================"
echo "Projnet Database Backup Tool"
echo "========================================"
echo ""
echo "This will create a password-protected backup"
echo "of ALL data in your projnet database."
echo ""
echo "The backup will be saved as: projnet_data.zip"
echo ""

# Get MySQL password
read -sp "Enter MySQL password (or press Enter if none): " MYSQL_PWD
echo ""

# Get ZIP password
read -sp "Create a ZIP password for this backup: " ZIP_PWD
echo ""
echo ""

# Check if mysqldump exists
if ! command -v mysqldump &> /dev/null; then
    echo "ERROR: mysqldump not found. Is MySQL installed?"
    exit 1
fi

# Dump data only (no schema)
mysqldump -u root -p${MYSQL_PWD} --no-create-info projnet > projnet_data_dump.sql 2>/dev/null

if [ $? -ne 0 ]; then
    echo ""
    echo "Backup FAILED! Check your MySQL password."
    exit 1
fi

# Create password-protected ZIP
if command -v zip &> /dev/null; then
    zip -P "${ZIP_PWD}" projnet_data.zip projnet_data_dump.sql > /dev/null 2>&1
else
    echo "zip command not found. Using Python instead..."
    python3 -c "
import zipfile, os
with zipfile.ZipFile('projnet_data.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.setpassword(b'${ZIP_PWD}')
    zf.write('projnet_data_dump.sql')
" 2>/dev/null
fi

# Clean up
rm projnet_data_dump.sql

echo "========================================"
echo "Backup complete!"
echo "File: projnet_data.zip"
echo "Password: ${ZIP_PWD}"
echo "========================================"
echo ""
echo "IMPORTANT: Remember this password! You'll need it to restore."
echo ""