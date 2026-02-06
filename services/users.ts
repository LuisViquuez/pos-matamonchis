'use server'

import { sql } from '@/lib/db'
import { requireAdmin, hashPassword } from '@/lib/auth'
import type { User } from '@/types/models'
import type { CreateUserDTO, UpdateUserDTO } from '@/types/dto'

export async function getUsers(): Promise<Omit<User, 'password_hash'>[]> {
  await requireAdmin()
  
  const users = await sql`
    SELECT id, name, email, role, is_active, created_at FROM users ORDER BY name
  `
  return users as Omit<User, 'password_hash'>[]
}

export async function getUserById(id: number): Promise<Omit<User, 'password_hash'> | null> {
  await requireAdmin()
  
  const users = await sql`
    SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ${id} LIMIT 1
  `
  return (users as Omit<User, 'password_hash'>[])[0] || null
}

export async function createUser(data: CreateUserDTO): Promise<Omit<User, 'password_hash'>> {
  await requireAdmin()
  
  // Check if email already exists
  const existing = await sql`
    SELECT id FROM users WHERE email = ${data.email} LIMIT 1
  `
  if ((existing as User[]).length > 0) {
    throw new Error('Email already exists')
  }
  
  const passwordHash = await hashPassword(data.password)
  
  const result = await sql`
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES (${data.name}, ${data.email}, ${passwordHash}, ${data.role}, ${data.is_active ?? true})
    RETURNING id, name, email, role, is_active, created_at
  `
  return (result as Omit<User, 'password_hash'>[])[0]
}

export async function updateUser(data: UpdateUserDTO): Promise<Omit<User, 'password_hash'>> {
  await requireAdmin()
  
  const existing = await getUserById(data.id)
  if (!existing) {
    throw new Error('User not found')
  }
  
  // If email is being changed, check it doesn't exist
  if (data.email && data.email !== existing.email) {
    const emailExists = await sql`
      SELECT id FROM users WHERE email = ${data.email} AND id != ${data.id} LIMIT 1
    `
    if ((emailExists as User[]).length > 0) {
      throw new Error('Email already exists')
    }
  }
  
  // If password is provided, hash it
  let passwordUpdate = ''
  if (data.password) {
    const passwordHash = await hashPassword(data.password)
    await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${data.id}
    `
  }
  
  const result = await sql`
    UPDATE users SET
      name = ${data.name ?? existing.name},
      email = ${data.email ?? existing.email},
      role = ${data.role ?? existing.role},
      is_active = ${data.is_active ?? existing.is_active}
    WHERE id = ${data.id}
    RETURNING id, name, email, role, is_active, created_at
  `
  return (result as Omit<User, 'password_hash'>[])[0]
}

export async function deleteUser(id: number): Promise<void> {
  await requireAdmin()
  
  // Soft delete - just deactivate
  await sql`
    UPDATE users SET is_active = false WHERE id = ${id}
  `
}

export async function toggleUserStatus(id: number): Promise<Omit<User, 'password_hash'>> {
  await requireAdmin()
  
  const result = await sql`
    UPDATE users SET is_active = NOT is_active WHERE id = ${id}
    RETURNING id, name, email, role, is_active, created_at
  `
  return (result as Omit<User, 'password_hash'>[])[0]
}

// Alias export for compatibility
export async function getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
  return getUsers()
}
