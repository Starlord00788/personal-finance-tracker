-- Migration: Create Notifications Table
-- Version: 005
-- Created: 2026-02-07

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('budget_overrun', 'anomaly', 'monthly_summary', 'goal_achieved', 'reminder')),
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical', 'info')),
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50), -- 'transaction', 'budget', 'category'
    related_entity_id UUID,
    metadata JSONB, -- Additional data for notification context
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT notifications_metadata_valid CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id) WHERE related_entity_id IS NOT NULL;

-- GIN index for metadata JSONB
CREATE INDEX idx_notifications_metadata ON notifications USING GIN(metadata);