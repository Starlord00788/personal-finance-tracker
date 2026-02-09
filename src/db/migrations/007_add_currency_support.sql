-- Add currency support to users and transactions

-- Add default currency to users table
ALTER TABLE users 
ADD COLUMN default_currency VARCHAR(3) DEFAULT 'USD';

-- Add currency column to transactions table
ALTER TABLE transactions 
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Update existing transactions to have USD as default currency
UPDATE transactions 
SET currency = 'USD' 
WHERE currency IS NULL;