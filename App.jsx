-- ==============================================
-- Meta Social Integration — MySQL Schema
-- ==============================================

CREATE DATABASE IF NOT EXISTS meta_social_app;
USE meta_social_app;

-- ----- Users table (your app's users) -----
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) UNIQUE,
    name            VARCHAR(255),
    meta_user_id    VARCHAR(100) UNIQUE,          -- Facebook user ID
    access_token    TEXT,                          -- encrypted long-lived token
    token_expires   DATETIME,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----- Connected accounts (FB Pages + IG Business accounts) -----
CREATE TABLE connected_accounts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    platform        ENUM('facebook_page', 'instagram_business') NOT NULL,
    account_id      VARCHAR(100) NOT NULL,         -- Page ID or IG account ID
    account_name    VARCHAR(255),
    account_image   TEXT,                           -- profile picture URL
    page_token      TEXT,                           -- Page-specific access token
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_account (user_id, platform, account_id)
);

-- ----- Cached Facebook posts -----
CREATE TABLE facebook_posts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    post_id         VARCHAR(255) UNIQUE NOT NULL,  -- Facebook post ID
    account_id      VARCHAR(100) NOT NULL,
    message         TEXT,
    media_type      ENUM('text', 'photo', 'video', 'link', 'reel', 'album') DEFAULT 'text',
    media_url       TEXT,
    thumbnail_url   TEXT,
    permalink       TEXT,
    likes_count     INT DEFAULT 0,
    comments_count  INT DEFAULT 0,
    shares_count    INT DEFAULT 0,
    published_at    DATETIME,
    fetched_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account (account_id),
    INDEX idx_published (published_at)
);

-- ----- Cached Instagram posts -----
CREATE TABLE instagram_posts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    post_id         VARCHAR(255) UNIQUE NOT NULL,  -- Instagram media ID
    account_id      VARCHAR(100) NOT NULL,
    caption         TEXT,
    media_type      ENUM('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REEL') DEFAULT 'IMAGE',
    media_url       TEXT,
    thumbnail_url   TEXT,
    permalink       TEXT,
    likes_count     INT DEFAULT 0,
    comments_count  INT DEFAULT 0,
    published_at    DATETIME,
    fetched_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account (account_id),
    INDEX idx_published (published_at)
);
