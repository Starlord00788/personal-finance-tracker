-- Migration: Create Budgets Table
-- Version: 004
-- Created: 2026-02-07

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    limit_amount NUMERIC(14,2) NOT NULL CHECK (limit_amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    alert_threshold NUMERIC(3,2) DEFAULT 0.80 CHECK (alert_threshold BETWEEN 0.01 AND 1.00), -- 80% threshold
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT budgets_user_category_month_unique UNIQUE(user_id, category_id, month, year),
    CONSTRAINT budgets_currency_format CHECK (currency ~* '^[A-Z]{3}$')
);

-- Indexes for performance
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);
CREATE INDEX idx_budgets_user_month_year ON budgets(user_id, month, year);
CREATE INDEX idx_budgets_is_active ON budgets(is_active);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();