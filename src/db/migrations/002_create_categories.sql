-- Migration: Create Categories Table
-- Version: 002
-- Created: 2026-02-07

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color code
    icon VARCHAR(50) DEFAULT 'folder',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT categories_name_user_unique UNIQUE(user_id, name) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT categories_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Indexes for performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_is_deleted ON categories(is_deleted);
CREATE INDEX idx_categories_user_type ON categories(user_id, type) WHERE is_deleted = FALSE;

-- Trigger for updated_at timestamp
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();