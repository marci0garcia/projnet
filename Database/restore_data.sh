#!/bin/bash

echo "========================================"
echo "Projnet Database Restore Tool"
echo "========================================"
echo ""
echo "This will RESTORE data from a backup file."
echo "WARNING: All existing data in projnet will be REPLACED!"
echo ""

if [ ! -f "projnet_data.zip" ]; then
    echo "ERROR: projnet_data.zip not found!"
    echo "Run backup_data.sh first to create a backup."
    exit 1
fi

# Get ZIP password
read -sp "Enter the ZIP password: " ZIP_PWD
echo ""

# Get MySQL password
read -sp "Enter MySQL password (or press Enter if none): " MYSQL_PWD
echo ""
echo ""

# Extract the zip file
if command -v unzip &> /dev/null; then
    unzip -P "${ZIP_PWD}" projnet_data.zip
else
    python3 -c "
import zipfile
with zipfile.ZipFile('projnet_data.zip', 'r') as zf:
    zf.setpassword(b'${ZIP_PWD}')
    zf.extractall()
" 2>/dev/null
fi

if [ ! -f "projnet_data_dump.sql" ]; then
    echo "ERROR: Could not extract the zip file. Wrong password?"
    exit 1
fi

# Restore the data
mysql -u root -p${MYSQL_PWD} projnet < projnet_data_dump.sql 2>/dev/null

if [ $? -ne 0 ]; then
    echo ""
    echo "Restore FAILED! Check your MySQL password."
    rm projnet_data_dump.sql
    exit 1
fi

# Clean up
rm projnet_data_dump.sql

echo "========================================"
echo "Restore complete! Your data has been restored."
echo "========================================"
echo ""