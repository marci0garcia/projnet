-- ============================================================
-- projnet_schema.sql  -  Projnet Database Schema
-- ============================================================
-- Creates the database and all required tables.
-- Contains NO user data - safe to share and version-control.
-- Compatible with MySQL 8.0+
--
-- Import with:
--   mysql -u YOUR_USER -p < projnet_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS projnet
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE projnet;

-- -------------------------------------------------------
-- users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64)   NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  bio           TEXT              NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- groups
-- NOTE: "groups" is a reserved word in MySQL 8+.
-- The table name is wrapped in backticks throughout.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `groups` (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(128) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- user_groups  (junction table: users <-> groups, many-to-many)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_groups (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id   INT UNSIGNED NOT NULL,
  group_id  INT UNSIGNED NOT NULL,
  joined_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_group (user_id, group_id),
  CONSTRAINT fk_ug_user  FOREIGN KEY (user_id)  REFERENCES users(`id`)    ON DELETE CASCADE,
  CONSTRAINT fk_ug_group FOREIGN KEY (group_id) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- tasks
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          INT UNSIGNED                                              NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED                                              NOT NULL,
  title       VARCHAR(255)                                              NOT NULL,
  description TEXT                                                          NULL,
  status      ENUM('To Do','In Progress','Completed','Overdue')         NOT NULL DEFAULT 'To Do',
  priority    ENUM('Low','Medium','High')                               NOT NULL DEFAULT 'Low',
  deadline    DATE                                                          NULL,
  created_at  DATETIME                                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME                                                  NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(`id`) ON DELETE CASCADE,
  INDEX idx_tasks_user_id  (user_id),
  INDEX idx_tasks_status   (status),
  INDEX idx_tasks_priority (priority)
) ENGINE=InnoDB;

-- -------------------------------------------------------
-- messages
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id  INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  content   TEXT         NOT NULL,
  sent_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_msg_group  FOREIGN KEY (group_id)  REFERENCES `groups`(`id`) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(`id`)    ON DELETE CASCADE,
  INDEX idx_messages_group_id (group_id),
  INDEX idx_messages_sent_at  (sent_at)
) ENGINE=InnoDB;

-- ============================================================
-- Schema complete. Five tables created:
--   users, groups, user_groups, tasks, messages
-- ============================================================
