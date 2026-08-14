-- Migration: Add cancel_deadline_at and pickup_type columns to orders table
-- Date: 2026-08-14

-- Add cancel_deadline_at column (stores the deadline after which cancellation is no longer available)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_deadline_at TIMESTAMPTZ;

-- Add pickup_type column (breakfast/lunch/dinner/faculty/guest)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_type TEXT;

-- Add student_id_display column (the visible FDX-STU-XXXX identifier)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS student_id_display TEXT;

-- Create index for pickup_type for efficient sequential code generation
CREATE INDEX IF NOT EXISTS idx_orders_pickup_type ON orders(pickup_type);

-- Create index for cancel_deadline_at for efficient timer queries
CREATE INDEX IF NOT EXISTS idx_orders_cancel_deadline ON orders(cancel_deadline_at);

-- Create index for token_number for efficient sequential code generation
CREATE INDEX IF NOT EXISTS idx_orders_token_number ON orders(token_number);

-- Create index for pickup_code for efficient sequential code generation
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);

-- Enable realtime for orders table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS orders;
