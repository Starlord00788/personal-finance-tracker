-- Migration: Create Exchange Rates Table
-- Version: 006
-- Created: 2026-02-07

CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate NUMERIC(12,6) NOT NULL CHECK (rate > 0),
    source VARCHAR(50) DEFAULT 'manual', -- 'api', 'manual', 'ecb', 'openexchange'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT exchange_rates_currency_format CHECK (
        from_currency ~* '^[A-Z]{3}$' AND to_currency ~* '^[A-Z]{3}$'
    ),
    CONSTRAINT exchange_rates_currency_pair_unique UNIQUE(from_currency, to_currency),
    CONSTRAINT exchange_rates_no_self_conversion CHECK (from_currency != to_currency)
);

-- Base exchange rates to USD (commonly used as base currency)
INSERT INTO exchange_rates (from_currency, to_currency, rate, source) VALUES
('USD', 'USD', 1.000000, 'system'),
('EUR', 'USD', 1.080000, 'manual'),
('GBP', 'USD', 1.250000, 'manual'),
('JPY', 'USD', 0.007500, 'manual'),
('CAD', 'USD', 0.740000, 'manual'),
('AUD', 'USD', 0.650000, 'manual'),
('CHF', 'USD', 1.010000, 'manual'),
('CNY', 'USD', 0.140000, 'manual'),
('INR', 'USD', 0.012000, 'manual')
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_exchange_rates_from_currency ON exchange_rates(from_currency);
CREATE INDEX idx_exchange_rates_to_currency ON exchange_rates(to_currency);
CREATE INDEX idx_exchange_rates_currency_pair ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_updated_at ON exchange_rates(updated_at);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_exchange_rates_updated_at 
    BEFORE UPDATE ON exchange_rates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();