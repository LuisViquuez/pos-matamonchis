#!/usr/bin/env node

/**
 * Database Setup Script usando PostgreSQL native driver
 * Este script inicializa la base de datos Neon con tablas y datos de prueba
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno del archivo .env
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith("'") && value.endsWith("'")) ||
              (value.startsWith('"') && value.endsWith('"'))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.error('❌ Error al leer el archivo .env:', error.message);
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está configurado en el archivo .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando configuración de la base de datos...\n');
    console.log('📡 Conectando a Neon Database...\n');

    // Leer el script de creación de tablas
    console.log('📋 Paso 1: Creando tablas...');
    const createTablesSQL = fs.readFileSync(
      path.join(__dirname, '001-create-tables.sql'),
      'utf8'
    );

    await client.query(createTablesSQL);
    console.log('✅ Tablas creadas exitosamente\n');

    // Leer el script de datos de prueba
    console.log('📋 Paso 2: Insertando datos de prueba...');
    const seedDataSQL = fs.readFileSync(
      path.join(__dirname, '002-seed-data.sql'),
      'utf8'
    );

    await client.query(seedDataSQL);
    console.log('✅ Datos de prueba insertados exitosamente\n');

    // Verificar que los datos se insertaron correctamente
    console.log('📊 Verificando la base de datos...');
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const productCount = await client.query('SELECT COUNT(*) as count FROM products');
    const customerCount = await client.query('SELECT COUNT(*) as count FROM customers');
    const promotionCount = await client.query('SELECT COUNT(*) as count FROM promotions');

    console.log(`   - Usuarios: ${userCount.rows[0].count}`);
    console.log(`   - Productos: ${productCount.rows[0].count}`);
    console.log(`   - Clientes: ${customerCount.rows[0].count}`);
    console.log(`   - Promociones: ${promotionCount.rows[0].count}`);

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Admin:  admin@matamonchis.com / admin123');
    console.log('   Cajero: cajero@matamonchis.com / admin123');
    console.log('\n💡 Ahora puedes ejecutar el proyecto con: npm run dev');

  } catch (error) {
    console.error('\n❌ Error al configurar la base de datos:', error);
    console.error('Detalles:', error.message);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
