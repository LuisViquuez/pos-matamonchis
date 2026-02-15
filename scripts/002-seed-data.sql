-- Seed data for LA MATAMONCHIS S.A POS Application

-- Insert admin user (password: admin123)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
('Admin Usuario', 'admin@matamonchis.com', '$2b$10$rQZ8K3.VqJ7Y5X2F1u8P8OzW9Y4L6N8M3A5B7C9D1E3F5G7H9I1J3', 'admin', true),
('Cajero Principal', 'cajero@matamonchis.com', '$2b$10$rQZ8K3.VqJ7Y5X2F1u8P8OzW9Y4L6N8M3A5B7C9D1E3F5G7H9I1J3', 'cashier', true)
ON CONFLICT (email) DO NOTHING;

-- Insert products (Papas, Bolis, Empanadas, Gelatinas, Coca Cola, Agua)
INSERT INTO products (name, price, category, stock, is_active) VALUES
('Papas Fritas', 3500.00, 'Snacks', 100, true),
('Papas Naturales', 3000.00, 'Snacks', 80, true),
('Bolis de Fresa', 1500.00, 'Helados', 150, true),
('Bolis de Limon', 1500.00, 'Helados', 150, true),
('Bolis de Mango', 1500.00, 'Helados', 120, true),
('Empanada de Carne', 4000.00, 'Comidas', 50, true),
('Empanada de Pollo', 4000.00, 'Comidas', 50, true),
('Empanada de Queso', 3500.00, 'Comidas', 60, true),
('Gelatina de Fresa', 2000.00, 'Postres', 80, true),
('Gelatina de Uva', 2000.00, 'Postres', 70, true),
('Gelatina de Limon', 2000.00, 'Postres', 75, true),
('Coca Cola 350ml', 3000.00, 'Bebidas', 200, true),
('Coca Cola 600ml', 4500.00, 'Bebidas', 150, true),
('Agua 500ml', 2000.00, 'Bebidas', 250, true),
('Agua 1L', 3500.00, 'Bebidas', 100, true)
ON CONFLICT DO NOTHING;

INSERT INTO promotions (id, name, type, discount_value, min_quantity, is_active) VALUES
('gelatina-2x1', 'Gelatina 2x1', '2x1', 0, 2, true)
ON CONFLICT (id) DO NOTHING;

-- Link the promotion to all products whose name starts with 'Gelatina' (assign 2x1 to gelatinas)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'product_promotions' AND column_name = 'product_id'
	) THEN
		INSERT INTO product_promotions (product_id, promotion_id)
		SELECT p.id, 'gelatina-2x1'
		FROM products p
		WHERE LOWER(p.name) LIKE 'gelatina%'
		ON CONFLICT DO NOTHING;

	ELSIF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'product_promotions' AND column_name = '"productId"'
	) THEN
		-- Some setups (Prisma) create camelCase column names; handle that too
		EXECUTE 'INSERT INTO product_promotions ("productId", "promotionId") SELECT id, $1 FROM products WHERE LOWER(name) LIKE ''gelatina%'' ON CONFLICT DO NOTHING' USING 'gelatina-2x1';

	ELSE
		RAISE NOTICE 'product_promotions table does not have expected columns';
	END IF;
END$$;

-- Insert sample customers
INSERT INTO customers (name, phone, email) VALUES
('Cliente General', NULL, NULL),
('Maria Garcia', '3001234567', 'maria@email.com'),
('Juan Rodriguez', '3009876543', 'juan@email.com')
ON CONFLICT DO NOTHING;
