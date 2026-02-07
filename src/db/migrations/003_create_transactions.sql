-- Migration: Create Transactions Table
-- Version: 003
-- Created: 2026-02-07

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    transaction_date DATE NOT NULL,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    tags TEXT[], -- Array for flexible tagging
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_currency_format CHECK (currency ~* '^[A-Z]{3}$'),
    CONSTRAINT transactions_date_not_future CHECK (transaction_date <= CURRENT_DATE + INTERVAL '1 day'),
    CONSTRAINT transactions_recurring_check CHECK (
        (is_recurring = FALSE) OR 
        (is_recurring = TRUE AND recurring_frequency IS NOT NULL)
    )
);

-- Indexes for performance and analytics
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_user_type_date ON transactions(user_id, type, transaction_date);
CREATE INDEX idx_transactions_monthly ON transactions(user_id, EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date));

-- GIN index for tags array
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();