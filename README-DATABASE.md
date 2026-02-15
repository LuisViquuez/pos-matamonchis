# Configuración de Base de Datos - LA MATAMONCHIS S.A.

## Base de Datos Neon PostgreSQL

Este proyecto utiliza Neon Database (PostgreSQL) para la persistencia de datos.

### Configuración Inicial

#### 1. Configurar Variables de Entorno

Asegúrate de que el archivo `.env` contenga la URL de conexión a tu base de datos Neon:

```env
DATABASE_URL='postgresql://user:password@host/database?sslmode=require'
```

#### 2. Ejecutar el Setup de la Base de Datos

Para crear todas las tablas e insertar los datos de prueba, ejecuta:

```bash
npm run db:setup
```

Este comando:
- Crea todas las tablas necesarias (usuarios, productos, clientes, ventas, etc.)
- Inserta datos de prueba para comenzar
- Crea 2 usuarios de prueba
- Crea 12 productos de ejemplo
- Configura promociones iniciales

### Credenciales de Prueba

Después de ejecutar el setup, puedes iniciar sesión con estas credenciales:

**Administrador:**
- Email: `admin@matamonchis.com`
- Contraseña: `admin123`

**Cajero:**
- Email: `cajero@matamonchis.com`
- Contraseña: `admin123`

## Estructura de la Base de Datos

### Tablas Principales

#### `users`
Usuarios del sistema (administradores y cajeros)
- id, name, email, password_hash, role, is_active, created_at

#### `products`
Catálogo de productos
- id, name, price, category, stock, image_url, is_active, created_at

#### `customers`
Clientes registrados
- id, name, phone, email, created_at

#### `sales`
Registro de ventas
- id, customer_id, user_id, customer_name, subtotal, tax, discount, total, payment_method, cash_received, change_amount, created_at

#### `sale_items`
Detalle de productos en cada venta
- id, sale_id, product_id, product_name, quantity, unit_price, subtotal, promotion_applied

#### `promotions`
Promociones activas
- id, name, type, product_id, discount_value, min_quantity, is_active, created_at

## Scripts Disponibles

### `npm run db:setup`
Ejecuta el setup completo de la base de datos (tablas + datos de prueba)

### Scripts SQL Manuales

Si prefieres ejecutar los scripts SQL manualmente:

1. **Crear Tablas:** `scripts/001-create-tables.sql`
2. **Insertar Datos:** `scripts/002-seed-data.sql`

## Notas Importantes

- La base de datos utiliza SSL por defecto para conexiones seguras
- Todos los passwords están hasheados con bcrypt
- Los precios están en formato DECIMAL(10,2)
- Las fechas se almacenan con zona horaria (timestamptz)

## Desarrollo

Para desarrollo local, asegúrate de que:
1. Tu DATABASE_URL esté configurada correctamente en `.env`
2. La base de datos esté accesible desde tu red
3. Hayas ejecutado `npm run db:setup` al menos una vez

## Solución de Problemas

### Error: "DATABASE_URL no está configurado"
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Asegúrate de que la variable `DATABASE_URL` esté definida correctamente

### Error de Conexión
- Verifica que la URL de conexión sea correcta
- Asegúrate de que Neon Database esté activo
- Revisa que los parámetros SSL estén configurados correctamente

### Tablas ya existen
- El script usa `CREATE TABLE IF NOT EXISTS` para evitar errores
- Si necesitas empezar de cero, elimina las tablas manualmente desde la consola de Neon
