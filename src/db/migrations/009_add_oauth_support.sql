-- Add OAuth support columns to users table

-- Add Google OAuth ID
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) DEFAULT NULL;

-- Add authentication provider
ALTER TABLE users 
ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local';

-- Add email verification status
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Make password_hash nullable for OAuth users
-- Note: SQLite doesn't support ALTER COLUMN, so we'll work with existing structure

-- Create indexes for OAuth fields
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);