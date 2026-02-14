-- Add has_2x1 column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_2x1 BOOLEAN DEFAULT FALSE;

-- Add promotion_type column to sales table to track which promotion was applied
ALTER TABLE sales ADD COLUMN IF NOT EXISTS promotion_type VARCHAR(50);
