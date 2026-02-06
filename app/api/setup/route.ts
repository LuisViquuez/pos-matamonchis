import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Drop existing tables
    await sql`DROP TABLE IF EXISTS sale_items CASCADE`
    await sql`DROP TABLE IF EXISTS sales CASCADE`
    await sql`DROP TABLE IF EXISTS promotions CASCADE`
    await sql`DROP TABLE IF EXISTS products CASCADE`
    await sql`DROP TABLE IF EXISTS customers CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create customers table
    await sql`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create products table
    await sql`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INT DEFAULT 0,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create sales table
    await sql`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        customer_id INT NULL,
        user_id INT NOT NULL,
        customer_name VARCHAR(150),
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
        cash_received DECIMAL(10,2),
        change_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `

    // Create sale_items table
    await sql`
      CREATE TABLE sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(150) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        promotion_applied VARCHAR(100),
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `

    // Create promotions table
    await sql`
      CREATE TABLE promotions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(120),
        type VARCHAR(20) CHECK (type IN ('2x1', 'percentage', 'fixed')),
        product_id INT,
        discount_value DECIMAL(10,2),
        min_quantity INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `

    // Create indexes
    await sql`CREATE INDEX idx_sales_user_id ON sales(user_id)`
    await sql`CREATE INDEX idx_sales_customer_id ON sales(customer_id)`
    await sql`CREATE INDEX idx_sales_created_at ON sales(created_at)`
    await sql`CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id)`
    await sql`CREATE INDEX idx_sale_items_product_id ON sale_items(product_id)`
    await sql`CREATE INDEX idx_products_category ON products(category)`
    await sql`CREATE INDEX idx_products_is_active ON products(is_active)`

    // Insert seed data - Users (password: admin123)
    await sql`
      INSERT INTO users (name, email, password_hash, role) VALUES 
      ('Administrador', 'admin@matamonchis.com', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', 'admin'),
      ('Cajero Demo', 'cajero@matamonchis.com', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', 'cashier')
    `

    // Insert customer
    await sql`INSERT INTO customers (name) VALUES ('Cliente General')`

    // Insert products
    await sql`
      INSERT INTO products (name, price, category, stock) VALUES 
      ('Gomitas Ácidas', 25.00, 'Gomitas', 100),
      ('Gomitas de Frutas', 20.00, 'Gomitas', 150),
      ('Paleta Payaso', 15.00, 'Paletas', 80),
      ('Paleta de Caramelo', 10.00, 'Paletas', 120),
      ('Chocolate con Leche', 35.00, 'Chocolates', 60),
      ('Chocolate Amargo', 40.00, 'Chocolates', 45),
      ('Chicle de Menta', 5.00, 'Chicles', 200),
      ('Chicle de Frutas', 5.00, 'Chicles', 180),
      ('Caramelo de Miel', 8.00, 'Caramelos', 150),
      ('Caramelo Macizo', 6.00, 'Caramelos', 200),
      ('Mazapán', 12.00, 'Dulces Típicos', 90),
      ('Tamarindo Enchilado', 18.00, 'Dulces Típicos', 70)
    `

    // Insert promotions
    await sql`
      INSERT INTO promotions (id, name, type, discount_value, min_quantity, is_active) VALUES 
      ('promo_2x1_gomitas', '2x1 en Gomitas', '2x1', NULL, 2, true),
      ('promo_10_chocolates', '10% en Chocolates', 'percentage', 10.00, 1, true)
    `

    return NextResponse.json({ 
      success: true, 
      message: "Base de datos inicializada correctamente",
      tables: ["users", "customers", "products", "sales", "sale_items", "promotions"],
      data: {
        users: 2,
        customers: 1,
        products: 12,
        promotions: 2
      }
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }, { status: 500 })
  }
}
