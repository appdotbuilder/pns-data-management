
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type LoginResponse, type User } from '../schema';

// Simple password hashing using Bun's built-in crypto
const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password);
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await Bun.password.verify(password, hashedPassword);
};

// Simple JWT token generation (in production, use proper JWT library)
const generateToken = (userId: number, role: string): string => {
  const payload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // In production, use proper JWT signing with secret key
  return btoa(JSON.stringify(payload));
};

export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Return user data without password and token
    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        pegawai_id: user.pegawai_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
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

    return users[0];
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}

// Helper function for creating users (useful for testing and admin operations)
export async function createUser(
  username: string,
  password: string,
  role: 'admin' | 'pegawai',
  pegawai_id?: number | null
): Promise<User> {
  try {
    const hashedPassword = await hashPassword(password);

    const result = await db.insert(usersTable)
      .values({
        username,
        password: hashedPassword,
        role,
        pegawai_id: pegawai_id || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Create user failed:', error);
    throw error;
  }
}
