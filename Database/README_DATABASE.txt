========================================================
PROJNET - DATABASE SETUP & BACKUP GUIDE
========================================================

This folder contains:
  - projnet_schema.sql  (table structure, NO user data-- safe to share)
  - projnet_data.zip    (password-protected data dump-- created by you)
  - backup_data.bat     (Windows backup script)
  - backup_data.sh      (Mac/Linux backup script)
  - restore_data.bat    (Windows restore script)
  - restore_data.sh     (Mac/Linux restore script)

========================================================
QUICK SETUP (FIRST TIME)
========================================================

Option A: Empty database (no data)
-----------------------------------
1. Open terminal/command prompt
2. Connect to MySQL:
   mysql -u root -p
3. Create and import schema:
   CREATE DATABASE projnet;
   USE projnet;
   SOURCE C:/.../Projnet_Code/Database/projnet_schema.sql;
4. Exit MySQL:
   EXIT;

Option B: With demo data (if you have projnet_data.zip)
-------------------------------------------------------
1. Run the restore script:
   Windows: double-click restore_data.bat
   Mac/Linux: ./restore_data.sh
2. Enter the ZIP password (provided by project team)
3. Enter your MySQL password when prompted

========================================================
CREATE A PASSWORD-PROTECTED BACKUP
========================================================

To save all current data (users, tasks, groups, messages):

Windows:
--------
1. Double-click backup_data.bat
2. Enter your MySQL password
3. Create a ZIP password (remember this!)
4. The script creates projnet_data.zip

Mac/Linux:
----------
1. Make the script executable (first time only):
   chmod +x backup_data.sh
2. Run the script:
   ./backup_data.sh
3. Enter your MySQL password
4. Create a ZIP password (remember this!)
5. The script creates projnet_data.zip

What the backup contains:
  - All user accounts (emails, hashed passwords, bios)
  - All tasks
  - All groups and group memberships
  - All chat messages

========================================================
RESTORE FROM A BACKUP
========================================================

Windows:
--------
1. Double-click restore_data.bat
2. Enter the ZIP password
3. Enter your MySQL password
4. Data is restored to your database

Mac/Linux:
----------
1. Make the script executable (first time only):
   chmod +x restore_data.sh
2. Run the script:
   ./restore_data.sh
3. Enter the ZIP password
4. Enter your MySQL password
5. Data is restored to your database

Note: Restore will REPLACE all existing data in the projnet database.

========================================================
SECURITY INFORMATION
========================================================

What is password protected?
  - The entire data dump (projnet_data.zip) is encrypted
  - User emails (personally identifiable information)
  - Password hashes (already secure, but extra layer)
  - Task descriptions, chat messages, group names

What is NOT protected?
  - projnet_schema.sql (table structure only, no data)
  - This README file
  - The backup scripts themselves

Password tips:
  - Use a strong ZIP password (mix of letters, numbers, symbols)
  - Share the ZIP password separately from the project files
  - Never commit the password to version control
  - If you forget the password, create a new backup

========================================================
TROUBLESHOOTING
========================================================

Error: "mysqldump: command not found"
  MySQL is not in your PATH. Either:
  - Add MySQL to PATH, or
  - Use full path: "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump"

Error: "Access denied for user 'root'@'localhost'"
  - Your MySQL password is incorrect
  - Try username 'root' with no password: just press Enter

Error: "Can't connect to MySQL server"
  - MySQL isn't running
  - Windows: services.msc → MySQL80 → Start
  - Mac: System Preferences → MySQL → Start
  - Linux: sudo systemctl start mysql

Error on Windows: "'mysql' is not recognized"
  - Add MySQL to your PATH:
    SET PATH=%PATH%;C:\Program Files\MySQL\MySQL Server 8.0\bin
  - Or use the full path in scripts (already configured)

========================================================
EXAMPLE WORKFLOW
========================================================

1. First time setup (empty database):
   mysql -u root -p
   CREATE DATABASE projnet;
   USE projnet;
   SOURCE C:/.../Projnet_Code/Database/projnet_schema.sql;

2. Run the app, register users, create tasks, send messages

3. Create a backup before major changes:
   ./backup_data.sh (enter password "MySecret123")

4. Share projnet_data.zip with team (share password separately)

5. Team member restores:
   ./restore_data.sh (enters "MySecret123")

========================================================