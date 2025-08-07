
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { createHash, randomBytes } from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Generate salt and hash password using crypto
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(input.password + salt).digest('hex');
    const password_hash = `${hash}:${salt}`;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: password_hash,
        role: input.role,
        pegawai_id: input.pegawai_id || null
      })
      .returning()
      .execute();

    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
