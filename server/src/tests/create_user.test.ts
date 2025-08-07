
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, pegawaiTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Helper function to verify password
const verifyPassword = (password: string, storedHash: string): boolean => {
  const [hash, salt] = storedHash.split(':');
  const computedHash = createHash('sha256').update(password + salt).digest('hex');
  return hash === computedHash;
};

// Test input without pegawai_id
const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'user',
  pegawai_id: undefined
};

// Test input for admin user
const testAdminInput: CreateUserInput = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'adminpass123',
  role: 'admin',
  pegawai_id: undefined
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with default role', async () => {
    const result = await createUser(testUserInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('user');
    expect(result.pegawai_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should create an admin user', async () => {
    const result = await createUser(testAdminInput);

    expect(result.username).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
    expect(result.role).toEqual('admin');
    expect(result.pegawai_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(testUserInput);

    // Verify password is hashed
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash).toContain(':'); // Should contain salt separator
    
    // Verify the hash can be used to verify the original password
    const isValid = verifyPassword('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = verifyPassword('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should save user to database', async () => {
    const result = await createUser(testUserInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].role).toEqual('user');
    expect(users[0].pegawai_id).toBeNull();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create user with pegawai_id reference', async () => {
    // First create a pegawai record
    const pegawaiResult = await db.insert(pegawaiTable)
      .values({
        nip: '12345678901234567890',
        nama: 'John Doe',
        email: 'john.doe@example.com',
        tanggal_lahir: new Date('1990-01-01'),
        jenis_kelamin: 'Laki-laki',
        status_kepegawaian: 'PNS',
        is_active: true
      })
      .returning()
      .execute();

    const pegawai = pegawaiResult[0];

    // Create user with pegawai_id
    const userInput: CreateUserInput = {
      username: 'johndoe',
      email: 'john.user@example.com',
      password: 'password123',
      role: 'user',
      pegawai_id: pegawai.id
    };

    const result = await createUser(userInput);

    expect(result.pegawai_id).toEqual(pegawai.id);
    expect(result.username).toEqual('johndoe');
    expect(result.email).toEqual('john.user@example.com');
    expect(result.role).toEqual('user');
  });

  it('should handle unique constraint violations', async () => {
    // Create first user
    await createUser(testUserInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'password123',
      role: 'user',
      pegawai_id: undefined
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle invalid foreign key reference', async () => {
    const invalidInput: CreateUserInput = {
      username: 'invaliduser',
      email: 'invalid@example.com',
      password: 'password123',
      role: 'user',
      pegawai_id: 99999 // Non-existent pegawai_id
    };

    await expect(createUser(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
