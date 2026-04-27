========================================================
PROJNET - CODE DIRECTORY STARTUP GUIDE
========================================================

PROJECT NAME:    Projnet
VERSION:         1.0.0
LAST UPDATED:    April 2026
DESCRIPTION:     A full-stack web application for collaborative
                 project management and real-time team communication.

========================================================
DIRECTORY STRUCTURE
========================================================

Projnet_Code/
|
|-- README.txt                        (this file)
|
|-- Docs/
|   |
|   |-- UserManual.txt                (user manual)
|
|-- WebSite/                          (entire application - run from here)
|   |
|   |-- server.js                     (entry point; starts the Express + Socket.io server)
|   |-- db.js                         (shared MySQL connection pool, imported by controllers)
|   |-- package.json                  (Node.js manifest; defines all dependencies)
|   |-- .env.example                  (template for required environment variables)
|   |
|   |-- routes/                       (HTTP route definitions; map URLs to controllers)
|   |   |-- auth.js                   (POST /auth/register, /auth/login, /auth/logout)
|   |   |-- tasks.js                  (GET/POST /tasks, PUT/DELETE /tasks/:id)
|   |   |-- groups.js                 (GET/POST /groups, POST /groups/:id/members)
|   |   |-- messages.js               (GET /messages/:groupId)
|   |   |-- users.js                  (GET/PUT /users/profile, PUT /users/password)
|   |
|   |-- controllers/                  (business logic; called by routes)
|   |   |-- authController.js         (register, login, logout)
|   |   |-- taskController.js         (CREATE, READ, UPDATE, DELETE for tasks, filtering, search)
|   |   |-- groupController.js        (create group, list groups, add member)
|   |   |-- messageController.js      (fetch message history for a group)
|   |   |-- userController.js         (profile read/update, password change)
|   |
|   |-- middleware/                   (Express middleware applied to routes)
|   |   |-- requireAuth.js            (blocks requests with no active session)
|   |   |-- validate.js               (input sanitization helpers)
|   |
|   |-- public/                       (static files served directly to the browser)
|       |-- css/
|       |   |-- style.css             (global stylesheet; light/dark mode, board, chat)
|       |-- js/
|       |   |-- main.js               (task board logic, modals, filters, dark mode)
|       |   |-- chat.js               (Socket.io client; joining rooms, sending/receiving)
|       |-- index.html                (login page - served at /)
|       |-- register.html             (new account registration)
|       |-- dashboard.html            (task board view)
|       |-- group.html                (group management + real-time chat)
|       |-- profile.html              (user profile and settings)
|
|-- Database/
    |-- projnet_schema.sql            (creates the database, all tables, indexes)
    |-- README_DATABASE.txt           (instructions for importing schema and data)



========================================================
HOW REQUIRE PATHS RESOLVE
========================================================

server.js is the root of the application (WebSite/).
All other server-side files are relative to WebSite/.

  server.js              requires  ./db
                         requires  ./routes/auth
                         requires  ./routes/tasks        (etc.)
                         requires  ./middleware/requireAuth

  routes/auth.js         requires  ../controllers/authController
  routes/tasks.js        requires  ../controllers/taskController  (etc.)

  controllers/*.js       requires  ../db

This means every require() path goes up exactly one level
from its own folder back to WebSite/, then down into the
target folder. No path goes more than one level up.


========================================================
STARTUP GUIDE
========================================================

1. Install: Node.js 18+, MySQL 8+, Git
2. cd .../Projnet_Code/WebSite
3. npm install
4. copy .env.example .env  (then, fill in your DB credentials)
5. Import schema:
	- mysql -u root -p (logs into MySQL)
	- SOURCE .../Projnet_Code/Database/projnet_schema.sql;
	- exit
6. node server.js
7. Open http://localhost:3000 in a browser, register an account, and use Projnet

========================================================
DEPENDENCIES (installed by npm install)
========================================================

express                 Web server and routing
express-session         Server-side session management
bcrypt                  Password hashing
mysql2                  MySQL driver (promise interface)
socket.io               WebSocket server for real-time chat
dotenv                  Loads .env into process.env
express-socket.io-session   Shares Express session with Socket.io

========================================================
DATABASE BACKUP & RESTORE
========================================================

The Database/ folder contains backup scripts to protect your data.

CREATE A BACKUP (preserve all current data):
  Windows: double-click Database/backup_data.bat
  Mac/Linux: /.../Database/backup_data.sh
  You'll be asked for:
    - MySQL password (to read the database)
    - ZIP password (to encrypt the backup)

RESTORE FROM BACKUP (load previously saved data):
  Windows: double-click /.../Database/restore_data.bat
  Mac/Linux: ./Database/restore_data.sh
  You'll be asked for:
    - ZIP password (to decrypt the backup)
    - MySQL password (to write to database)

What is password protected?
  - All user emails and password hashes
  - All tasks, groups, and chat messages
  - Complete database state

The schema file (projnet_schema.sql) contains NO data and
can be shared freely. The backup file (projnet_data.zip)
is encrypted and requires a password.

========================================================
TEAM
========================================================

Project:    Projnet
Course:     Capstone I (CIS3950 U01 1261)
Team:       Alyssa Hooper, Marcio Garcia, Brandon Delgado, Matthew Fortes, Cristian Vargas
Semester:   Spring 2026

========================================================
