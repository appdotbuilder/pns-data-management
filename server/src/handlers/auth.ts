
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Simple JWT-like token implementation using Node.js crypto
function createToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHash('sha256').update(`${header}.${body}.secret`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(password + salt).digest('hex');
}

function verifyPassword(password: string, hashedPassword: string, salt: string): boolean {
  const hash = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(hash), Buffer.from(hashedPassword));
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Check password - support both salted and simple hash formats
    let isValidPassword = false;
    
    if (user.password_hash.includes(':')) {
      // Salted hash format: "hash:salt"
      const [storedHash, salt] = user.password_hash.split(':');
      isValidPassword = verifyPassword(input.password, storedHash, salt);
    } else {
      // Simple hash format (legacy)
      const simpleHash = createHash('sha256').update(input.password).digest('hex');
      isValidPassword = simpleHash === user.password_hash;
    }

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Return user data
    const userResponse: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      pegawai_id: user.pegawai_id,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return {
      user: userResponse,
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function getCurrentUser(userId: number): Promise<User> {
  try {
    // Find user by ID
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      pegawai_id: user.pegawai_id,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}

// Helper function to create password hash with salt for testing
export function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return `${hash}:${salt}`;
}
